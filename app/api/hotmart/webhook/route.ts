import { NextRequest, NextResponse } from 'next/server';
import { finalizeSale } from '@/lib/payments/process-sale';
import { parseHotmartSale, pickHottok, verifyHottok } from '@/lib/payments/hotmart';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// Webhook (Postback) de Hotmart — único disparador de la entrega.
// Al confirmarse el pago, Hotmart hace POST aquí; nosotros entregamos el libro
// (Resend + magic link) vía finalizeSale(). Hotmart NO envía el producto.
//
// Autenticación: token `hottok` propio de la cuenta. En Webhook 2.0 viaja en la
// cabecera `X-HOTMART-HOTTOK`; en pruebas/v1 puede venir en el body. Validamos ambos.
// Idempotente por `transaction`, así que los reintentos de Hotmart son seguros.
// ============================================================
export async function POST(req: NextRequest) {
  const expected = process.env.HOTMART_WEBHOOK_HOTTOK;
  if (!expected) {
    console.error('[hotmart] HOTMART_WEBHOOK_HOTTOK no está configurado');
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }

  const raw = await req.text();
  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // --- Validación del hottok (cabecera 2.0 o body en pruebas/v1) ---
  const provided = pickHottok(req.headers.get('x-hotmart-hottok'), payload);
  if (!verifyHottok(provided, expected)) {
    console.warn('[hotmart] hottok inválido o ausente');
    return NextResponse.json({ error: 'invalid_hottok' }, { status: 401 });
  }

  const event = String(payload?.event ?? '').toUpperCase();
  console.log(`[hotmart] webhook recibido: ${event || 'sin-evento'} | id=${payload?.id ?? '?'}`);

  const parsed = parseHotmartSale(payload, {
    expectedProductId: process.env.HOTMART_PRODUCT_ID ?? null,
  });

  if (!parsed.ok) {
    if (parsed.reason === 'missing_fields') {
      console.error('[hotmart] payload aprobado pero sin campos mínimos (email/transaction)');
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }
    // ignored_event (refund/chargeback/cancel/abandono/test) u other_product:
    // 200 para que Hotmart no reintente; no entregamos.
    return NextResponse.json({ received: true, ignored: parsed.reason });
  }

  const { sale } = parsed;

  try {
    const result = await finalizeSale({
      provider: 'hotmart',
      externalId: sale.transaction,
      externalRef: sale.eventId,
      email: sale.email,
      name: sale.name,
      country: sale.country,
      amount: sale.amount,
      currency: sale.currency,
      status: 'paid',
      productName: sale.productName,
      externalCustomerId: null,
    });

    return NextResponse.json({
      received: true,
      status: result.status,
      paymentId: 'paymentId' in result ? result.paymentId : undefined,
    });
  } catch (err) {
    // 500 => Hotmart reintenta el envío.
    console.error('[hotmart] error procesando la venta:', (err as Error).message);
    return NextResponse.json({ error: 'processing_error' }, { status: 500 });
  }
}
