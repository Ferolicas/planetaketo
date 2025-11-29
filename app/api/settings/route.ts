import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: homeContent, error } = await supabaseAdmin
      .from('homeContent')
      .select('regular_price, discount_price, discount_percentage')
      .eq('id', 'default')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json({
      regularPrice: homeContent?.regular_price || 39.75,
      discountPrice: homeContent?.discount_price || 19.75,
      discountPercentage: homeContent?.discount_percentage || 50,
    });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json(
      {
        regularPrice: 39.75,
        discountPrice: 19.75,
        discountPercentage: 50
      },
      { status: 200 }
    );
  }
}
