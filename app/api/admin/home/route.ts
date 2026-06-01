import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

interface HomeRow {
  logo: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image: string | null;
  product_id: string | null;
  regular_price: string | number | null;
  discount_price: string | number | null;
  discount_percentage: string | number | null;
}

function toClient(row: HomeRow) {
  return {
    logo: row.logo,
    heroTitle: row.hero_title,
    heroSubtitle: row.hero_subtitle,
    heroImage: row.hero_image,
    productId: row.product_id,
    regularPrice: row.regular_price,
    discountPrice: row.discount_price,
    discountPercentage: row.discount_percentage,
  };
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      logo,
      heroTitle,
      heroSubtitle,
      heroImage,
      productId,
      regularPrice,
      discountPrice,
      discountPercentage,
    } = await request.json();

    const params = [
      logo ?? null,
      heroTitle ?? null,
      heroSubtitle ?? null,
      heroImage ?? null,
      productId ?? null,
      regularPrice ?? null,
      discountPrice ?? null,
      discountPercentage ?? null,
    ];

    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM "homeContent" WHERE id = 'default'`
    );

    let row: HomeRow | null;
    if (existing) {
      row = await queryOne<HomeRow>(
        `UPDATE "homeContent" SET
            logo = $1,
            hero_title = $2,
            hero_subtitle = $3,
            hero_image = $4,
            product_id = $5,
            regular_price = $6,
            discount_price = $7,
            discount_percentage = $8
         WHERE id = 'default'
         RETURNING *`,
        params
      );
    } else {
      row = await queryOne<HomeRow>(
        `INSERT INTO "homeContent"
           (id, logo, hero_title, hero_subtitle, hero_image, product_id,
            regular_price, discount_price, discount_percentage)
         VALUES ('default', $1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        params
      );
    }

    return NextResponse.json(row ? toClient(row) : null);
  } catch (error) {
    console.error('Update home content error:', error);
    return NextResponse.json(
      { error: 'Failed to update home content' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const row = await queryOne<HomeRow>(
      `SELECT * FROM "homeContent" ORDER BY (id = 'default') DESC LIMIT 1`
    );
    return NextResponse.json(row ? toClient(row) : null);
  } catch (error) {
    console.error('Fetch home content error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch home content' },
      { status: 500 }
    );
  }
}
