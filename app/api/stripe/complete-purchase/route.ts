import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { processSale } from '@/lib/payments/process-sale';

/**
 * Complete purchase after payment.
 * Called from frontend (or PendingPaymentRecovery) once we have the customer's
 * name + email. Idempotent on paymentIntentId.
 *
 * POST /api/stripe/complete-purchase
 */
export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, customerName, customerEmail } = await request.json();

    if (!paymentIntentId || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentIntentId, customerName, customerEmail' },
        { status: 400 }
      );
    }

    console.log(`📝 Completing purchase for ${paymentIntentId} | ${customerEmail}`);

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: `Payment not completed (status=${paymentIntent.status})` },
        { status: 400 }
      );
    }

    const result = await processSale({
      paymentIntent,
      customerName,
      customerEmail,
      stripeCustomerId: typeof paymentIntent.customer === 'string'
        ? paymentIntent.customer
        : null,
    });

    if (result.status === 'already_processed') {
      return NextResponse.json({
        success: true,
        status: 'already_processed',
        paymentId: result.paymentId,
        message: 'El email ya fue enviado anteriormente',
      });
    }

    if (result.status === 'skipped') {
      return NextResponse.json(
        { error: `Cannot process: ${result.reason}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentId: result.paymentId,
      emailSent: result.emailSent,
      message: result.emailSent
        ? 'Purchase completed and email sent'
        : 'Purchase completed but email failed (will retry)',
    });

  } catch (error: any) {
    console.error('❌ Complete purchase failed:', error.message);
    return NextResponse.json(
      { error: error.message || 'Error completing purchase' },
      { status: 500 }
    );
  }
}
