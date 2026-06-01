import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export const runtime = 'nodejs';

// Precios públicos para la home (tabla "homeContent", fila id='default').
export async function GET() {
  try {
    const row = await queryOne<{
      regular_price: string | number | null;
      discount_price: string | number | null;
      discount_percentage: string | number | null;
    }>(
      `SELECT regular_price, discount_price, discount_percentage
       FROM "homeContent" WHERE id = 'default'`
    );

    const num = (v: unknown, d: number) =>
      v === null || v === undefined ? d : Number(v);

    return NextResponse.json({
      regularPrice: num(row?.regular_price, 39.75),
      discountPrice: num(row?.discount_price, 10),
      discountPercentage: num(row?.discount_percentage, 50),
    });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json(
      { regularPrice: 39.75, discountPrice: 10, discountPercentage: 50 },
      { status: 200 }
    );
  }
}
