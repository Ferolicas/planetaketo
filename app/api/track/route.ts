import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// Analítica propia: registra un evento (visita o clic a comprar).
// Público (lo llama el navegador). Nunca debe romper la navegación:
// si algo falla, responde igual sin propagar el error al usuario.
// ============================================================
const Schema = z.object({
  type: z.enum(['pageview', 'checkout_click']),
  path: z.string().max(512).optional(),
});

const VID_COOKIE = 'pk_vid';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  // Visitante anónimo: cookie httpOnly de 1 año para contar únicos.
  let vid = req.cookies.get(VID_COOKIE)?.value;
  let setCookie = false;
  if (!vid) {
    vid = randomUUID();
    setCookie = true;
  }

  try {
    await query(
      `INSERT INTO analytics_events (type, path, visitor_id) VALUES ($1, $2, $3)`,
      [parsed.data.type, parsed.data.path ?? null, vid]
    );
  } catch (err) {
    // La analítica nunca tumba la navegación.
    console.error('[track] insert error:', (err as Error).message);
  }

  const res = new NextResponse(null, { status: 204 });
  if (setCookie) {
    res.cookies.set(VID_COOKIE, vid, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });
  }
  return res;
}
