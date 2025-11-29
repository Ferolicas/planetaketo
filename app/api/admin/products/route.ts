import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { getSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, price, image, downloadUrl } = await request.json();

    // Create Stripe product
    const stripeProduct = await stripe.products.create({
      name,
      description: description || undefined,
      images: image ? [image] : [],
    });

    // Create Stripe price
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(price * 100),
      currency: 'eur',
    });

    // Create product in database
    const { data: product, error } = await supabaseAdmin
      .from('product')
      .insert({
        name,
        description,
        price,
        image,
        downloadUrl,
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePrice.id,
        isActive: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(product);
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data: products, error } = await supabaseAdmin
      .from('product')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
