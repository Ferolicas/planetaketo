import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { getSession } from '@/lib/auth/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, price, image, downloadUrl, isActive } = await request.json();

    const { data: product, error: fetchError } = await supabaseAdmin
      .from('product')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update Stripe product if exists
    if (product.stripeProductId) {
      await stripe.products.update(product.stripeProductId, {
        name,
        description: description || undefined,
        images: image ? [image] : [],
      });

      // Update price if changed
      if (price !== product.price && product.stripePriceId) {
        const newPrice = await stripe.prices.create({
          product: product.stripeProductId,
          unit_amount: Math.round(price * 100),
          currency: 'eur',
        });

        await stripe.prices.update(product.stripePriceId, {
          active: false,
        });

        const { error: priceUpdateError } = await supabaseAdmin
          .from('product')
          .update({ stripePriceId: newPrice.id })
          .eq('id', id);

        if (priceUpdateError) throw priceUpdateError;
      }
    }

    const { data: updated, error } = await supabaseAdmin
      .from('product')
      .update({ name, description, price, image, downloadUrl, isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: product, error: fetchError } = await supabaseAdmin
      .from('product')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Deactivate in Stripe instead of deleting
    if (product.stripeProductId) {
      await stripe.products.update(product.stripeProductId, {
        active: false,
      });
    }

    const { error } = await supabaseAdmin
      .from('product')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
