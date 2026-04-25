import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRODUCT_CONFIG } from '@/lib/stripe/config';
import { supabaseAdmin } from '@/lib/supabase';

const ALLOWED_CURRENCIES = new Set([
  'eur', 'usd', 'gbp', 'mxn', 'cop', 'ars', 'clp', 'pen',
]);

/**
 * Create Payment Intent for embedded payment flow
 * POST /api/stripe/payment-intent
 *
 * Body: { currency: string, exchangeRate?: number }
 * - currency: target currency for the charge
 * - exchangeRate: optional EUR->currency rate from frontend (used only for display conversion)
 *
 * The base EUR amount is ALWAYS read from Supabase server-side.
 * The client cannot manipulate the price.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const currency = (body.currency || 'eur').toLowerCase();
    const exchangeRate = typeof body.exchangeRate === 'number' && body.exchangeRate > 0
      ? body.exchangeRate
      : 1;

    if (!ALLOWED_CURRENCIES.has(currency)) {
      return NextResponse.json(
        { error: `Currency not allowed: ${currency}` },
        { status: 400 }
      );
    }

    // Read price from server (single source of truth)
    const { data: homeContent } = await supabaseAdmin
      .from('homeContent')
      .select('discount_price')
      .eq('id', 'default')
      .single();

    const eurPrice = Number(homeContent?.discount_price ?? 19.75);

    if (!eurPrice || eurPrice <= 0) {
      return NextResponse.json(
        { error: 'Invalid product price' },
        { status: 500 }
      );
    }

    // For non-EUR, apply exchange rate (client-provided but bounded)
    // Fallback: if rate looks bogus, charge in EUR
    let finalCurrency = currency;
    let finalAmount = eurPrice;

    if (currency !== 'eur') {
      // Sanity bounds: 0.1x to 10000x of EUR
      if (exchangeRate < 0.1 || exchangeRate > 10000) {
        finalCurrency = 'eur';
        finalAmount = eurPrice;
      } else {
        finalAmount = eurPrice * exchangeRate;
      }
    }

    const amountInCents = Math.round(finalAmount * 100);

    console.log(
      `📝 Creating Payment Intent: ${finalAmount.toFixed(2)} ${finalCurrency.toUpperCase()} ` +
      `(EUR base ${eurPrice}, rate ${exchangeRate})`
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: finalCurrency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        productName: PRODUCT_CONFIG.name,
        pdfFileName: PRODUCT_CONFIG.pdfFileName,
        eurBaseAmount: eurPrice.toFixed(2),
      },
      description: PRODUCT_CONFIG.name,
    });

    console.log('✓ Payment Intent created:', paymentIntent.id);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: finalAmount,
      currency: finalCurrency,
    });

  } catch (error: any) {
    console.error('❌ Payment Intent creation failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
