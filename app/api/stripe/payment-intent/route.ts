import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRODUCT_CONFIG } from '@/lib/stripe/config';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Create Payment Intent for embedded payment flow
 * POST /api/stripe/payment-intent
 */
export async function POST(request: NextRequest) {
  try {
    const { amount, currency, customerEmail, customerName } = await request.json();

    console.log(`📝 Creating Payment Intent: ${amount} ${currency} for ${customerEmail}`);

    // Validate inputs
    if (!amount || !currency || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, currency, customerEmail' },
        { status: 400 }
      );
    }

    // Create or retrieve customer
    let stripeCustomer;
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (customers.data.length > 0) {
      stripeCustomer = customers.data[0];
      console.log('✓ Existing Stripe customer:', stripeCustomer.id);
    } else {
      stripeCustomer = await stripe.customers.create({
        email: customerEmail,
        name: customerName || undefined,
      });
      console.log('✓ New Stripe customer created:', stripeCustomer.id);
    }

    // Create Payment Intent with automatic payment methods
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: stripeCustomer.id,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never', // No redirects, embedded flow only
      },
      metadata: {
        productName: PRODUCT_CONFIG.name,
        pdfFileName: PRODUCT_CONFIG.pdfFileName,
        customerEmail,
        customerName: customerName || '',
      },
      description: `${PRODUCT_CONFIG.name} - ${customerEmail}`,
      receipt_email: customerEmail,
    });

    console.log('✓ Payment Intent created:', paymentIntent.id);
    console.log('✓ Client secret:', paymentIntent.client_secret?.substring(0, 20) + '...');

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: stripeCustomer.id,
    });

  } catch (error: any) {
    console.error('❌ Payment Intent creation failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
