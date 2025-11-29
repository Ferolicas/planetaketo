import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth/session';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { logo, heroTitle, heroSubtitle, heroImage, productId, regularPrice, discountPrice, discountPercentage } = await request.json();

    // Map camelCase to snake_case for database
    const dbData = {
      logo,
      hero_title: heroTitle,
      hero_subtitle: heroSubtitle,
      hero_image: heroImage,
      product_id: productId,
      regular_price: regularPrice,
      discount_price: discountPrice,
      discount_percentage: discountPercentage,
    };

    // Check if record exists
    const { data: existing } = await supabaseAdmin
      .from('homeContent')
      .select('*')
      .eq('id', 'default')
      .single();

    let homeContent;
    if (existing) {
      // Update existing record
      const { data, error } = await supabaseAdmin
        .from('homeContent')
        .update(dbData)
        .eq('id', 'default')
        .select()
        .single();

      if (error) throw error;
      homeContent = data;
    } else {
      // Create new record
      const { data, error } = await supabaseAdmin
        .from('homeContent')
        .insert({
          id: 'default',
          ...dbData,
        })
        .select()
        .single();

      if (error) throw error;
      homeContent = data;
    }

    return NextResponse.json(homeContent);
  } catch (error) {
    console.error('Update home content error:', error);
    return NextResponse.json({ error: 'Failed to update home content' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data: homeContent, error } = await supabaseAdmin
      .from('homeContent')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"

    // Map snake_case to camelCase for frontend
    if (homeContent) {
      return NextResponse.json({
        logo: homeContent.logo,
        heroTitle: homeContent.hero_title,
        heroSubtitle: homeContent.hero_subtitle,
        heroImage: homeContent.hero_image,
        productId: homeContent.product_id,
        regularPrice: homeContent.regular_price,
        discountPrice: homeContent.discount_price,
        discountPercentage: homeContent.discount_percentage,
      });
    }

    return NextResponse.json(null);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch home content' }, { status: 500 });
  }
}
