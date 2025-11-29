import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get product
    const { data: product, error: productError } = await supabaseAdmin
      .from('product')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product || !product.isActive) {
      return NextResponse.json(
        { error: 'Product not found or inactive' },
        { status: 404 }
      );
    }

    // Create or get Stripe product/price
    let stripeProductId = product.stripeProductId;
    let stripePriceId = product.stripePriceId;

    if (!stripeProductId) {
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description || undefined,
        images: product.image ? [product.image] : [],
      });
      stripeProductId = stripeProduct.id;

      const { error: updateError } = await supabaseAdmin
        .from('product')
        .update({ stripeProductId })
        .eq('id', productId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating product with stripeProductId:', updateError);
      }
    }

    if (!stripePriceId) {
      const stripePrice = await stripe.prices.create({
        product: stripeProductId,
        unit_amount: Math.round(product.price * 100),
        currency: 'eur',
      });
      stripePriceId = stripePrice.id;

      const { error: updateError } = await supabaseAdmin
        .from('product')
        .update({ stripePriceId })
        .eq('id', productId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating product with stripePriceId:', updateError);
      }
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/tienda/${productId}`,
      metadata: {
        productId,
      },
      customer_email: undefined,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
