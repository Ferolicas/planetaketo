import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { markCheckoutStarted } from '@/lib/analytics/session-link';
import { enforceRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// Hotmart usa checkout alojado (iframe): no pasa por nuestra creación de pago,
// así que el embed avisa aquí al abrirse para marcar la visita como
// "checkout_iniciado_no_completado". El cierre lo hace el webhook de Hotmart.
// ============================================================

const Schema = z.object({ sessionId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, 'checkout', 20, 5 * 60_000);
  if (limited) return limited;

  let body: unknown;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const parsed = Schema.safeParse(body);
  if (parsed.success) await markCheckoutStarted(parsed.data.sessionId);
  return new NextResponse(null, { status: 204 });
}
