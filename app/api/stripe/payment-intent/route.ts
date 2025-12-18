import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRODUCT_CONFIG } from '@/lib/stripe/config';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Create Payment Intent for embedded payment flow
 * POST /api/stripe/payment-intent
 */
export async function POST(request: NextRequest) {
  try {
    const { amount, currency, customerName, customerEmail } = await request.json();

    console.log(`📝 Creating Payment Intent: ${amount} ${currency}`);
    console.log(`👤 Customer: ${customerName} <${customerEmail}>`);

    // Validate inputs
    if (!amount || !currency) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, currency' },
        { status: 400 }
      );
    }

    if (!customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: customerName, customerEmail' },
        { status: 400 }
      );
    }

    // Create Payment Intent with automatic payment methods
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      receipt_email: customerEmail, // Email para recibo de Stripe
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never', // No redirects, embedded flow only
      },
      metadata: {
        productName: PRODUCT_CONFIG.name,
        pdfFileName: PRODUCT_CONFIG.pdfFileName,
        customerName: customerName,
        customerEmail: customerEmail,
      },
      description: PRODUCT_CONFIG.name,
    });

    console.log('✓ Payment Intent created:', paymentIntent.id);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error: any) {
    console.error('❌ Payment Intent creation failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
