import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRODUCT_CONFIG } from '@/lib/stripe/config';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Get current prices from database
    const { data: homeContent } = await supabaseAdmin
      .from('homeContent')
      .select('discount_price')
      .eq('id', 'default')
      .single();

    const price = homeContent?.discount_price || 19.75;
    const priceInCents = Math.round(price * 100);

    // Create or get Stripe product
    let product;
    const products = await stripe.products.search({
      query: `name:'${PRODUCT_CONFIG.name}'`,
      limit: 1,
    });

    if (products.data.length > 0) {
      product = products.data[0];
    } else {
      product = await stripe.products.create({
        name: PRODUCT_CONFIG.name,
        description: PRODUCT_CONFIG.description,
        metadata: {
          pdfFileName: PRODUCT_CONFIG.pdfFileName,
          bucketName: PRODUCT_CONFIG.bucketName,
        },
      });
    }

    // Create Stripe Price
    const stripePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: priceInCents,
      currency: PRODUCT_CONFIG.currency,
    });

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePrice.id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
      billing_address_collection: 'required',
      metadata: {
        productName: PRODUCT_CONFIG.name,
        pdfFileName: PRODUCT_CONFIG.pdfFileName,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
}
