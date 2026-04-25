import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { supabaseAdmin } from '@/lib/supabase';
import { processSale, extractStripeEmail } from '@/lib/payments/process-sale';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const RESCUE_GRACE_MS = 15 * 60 * 1000; // 15 minutes
const LOOKBACK_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Cron rescue for orphan payments.
 *
 * Runs periodically (Vercel Cron). Finds Stripe PaymentIntents that:
 *   - succeeded in the last 24h
 *   - have no row in our `payments` table
 *   - are at least 15 minutes old (giving the frontend a chance to win)
 *
 * For each, tries to extract the email Stripe collected via PaymentElement
 * and processes the sale with name="Cliente" as fallback. The customer can
 * still update their name later.
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}` header.
 * GET /api/cron/rescue-payments
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  // Vercel Cron sends the configured Authorization header automatically.
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = Date.now();
  const created = {
    gte: Math.floor((now - LOOKBACK_MS) / 1000),
    lte: Math.floor((now - RESCUE_GRACE_MS) / 1000),
  };

  console.log(`🔍 Rescue scan: PaymentIntents from ${new Date(created.gte * 1000).toISOString()} ` +
    `to ${new Date(created.lte * 1000).toISOString()}`);

  const summary = {
    scanned: 0,
    alreadyProcessed: 0,
    rescued: 0,
    skippedNoEmail: 0,
    errors: [] as { id: string; error: string }[],
  };

  let starting_after: string | undefined;
  let hasMore = true;

  try {
    while (hasMore) {
      const page = await stripe.paymentIntents.list({
        created,
        limit: 100,
        starting_after,
      });

      for (const pi of page.data) {
        summary.scanned++;

        if (pi.status !== 'succeeded') continue;

        // Already in DB?
        const { data: existing } = await supabaseAdmin
          .from('payments')
          .select('id')
          .eq('stripe_payment_id', pi.id)
          .maybeSingle();

        if (existing) {
          summary.alreadyProcessed++;
          continue;
        }

        // Try to recover email from Stripe-collected billing details
        const { email, name, country } = await extractStripeEmail(pi);

        if (!email) {
          summary.skippedNoEmail++;
          console.warn(`⚠️  Orphan ${pi.id} has no Stripe email — manual recovery needed`);
          continue;
        }

        try {
          const result = await processSale({
            paymentIntent: pi,
            customerName: name || 'Cliente',
            customerEmail: email,
            stripeCustomerId: typeof pi.customer === 'string' ? pi.customer : null,
            country: country || undefined,
          });

          if (result.status === 'created') {
            summary.rescued++;
            console.log(`🛟 Rescued ${pi.id} -> ${email}`);
          } else if (result.status === 'already_processed') {
            summary.alreadyProcessed++;
          }
        } catch (err: any) {
          summary.errors.push({ id: pi.id, error: err.message });
          console.error(`❌ Rescue failed for ${pi.id}:`, err.message);
        }
      }

      hasMore = page.has_more;
      starting_after = page.data[page.data.length - 1]?.id;
    }

    console.log('🔍 Rescue summary:', summary);
    return NextResponse.json({ ok: true, summary });

  } catch (error: any) {
    console.error('❌ Rescue cron failed:', error);
    return NextResponse.json(
      { error: error.message, summary },
      { status: 500 }
    );
  }
}
