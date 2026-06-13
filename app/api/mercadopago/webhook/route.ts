import { NextRequest, NextResponse } from 'next/server';
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from 'mercadopago';
import { isMpConfigured, mpPayment, finalizeMpPayment } from '@/lib/payments/mercadopago';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// Webhook de Mercado Pago — disparador de la entrega para el cobro de Colombia.
// MP avisa con topic `payment`; consultamos el pago real y, si está aprobado,
// entregamos el libro vía finalizeMpPayment() → finalizeSale() (idempotente).
//
// Seguridad: validamos la firma `x-signature` (HMAC-SHA256) con el validador del
// SDK. Manifest oficial: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
// El `data.id` viaja en el query string de la notificación.
// ============================================================
export async function POST(req: NextRequest) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!isMpConfigured() || !secret) {
    console.error('[mercadopago] webhook no configurado (falta access token o webhook secret)');
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }

  const raw = await req.text();
  let body: { type?: string; topic?: string; data?: { id?: string | number }; id?: string | number } = {};
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    // MP a veces notifica solo por query string; no es un error fatal.
  }

  const params = req.nextUrl.searchParams;
  const type = params.get('type') || params.get('topic') || body?.type || body?.topic || '';
  const dataId =
    params.get('data.id') || (body?.data?.id != null ? String(body.data.id) : null) ||
    params.get('id') || (body?.id != null ? String(body.id) : null);

  // Solo procesamos pagos. El resto (merchant_order, etc.) se acusa con 200.
  if (String(type) !== 'payment') {
    return NextResponse.json({ received: true, ignored: type || 'unknown' });
  }
  if (!dataId) {
    return NextResponse.json({ error: 'missing_data_id' }, { status: 400 });
  }

  // --- Validación de firma (constante en tiempo; lanza si no coincide) ---
  try {
    WebhookSignatureValidator.validate({
      xSignature: req.headers.get('x-signature'),
      xRequestId: req.headers.get('x-request-id'),
      dataId,
      secret,
      toleranceSeconds: 600,
    });
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) {
      console.warn(`[mercadopago] firma inválida: ${err.reason} | req=${err.requestId ?? '?'}`);
      return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
    }
    throw err;
  }

  try {
    const payment = await mpPayment().get({ id: String(dataId) });
    const result = await finalizeMpPayment(payment);
    return NextResponse.json({
      received: true,
      status: result.status,
      paymentId: 'paymentId' in result ? result.paymentId : undefined,
    });
  } catch (err) {
    // 500 => MP reintenta.
    const e = err as Record<string, unknown>;
    console.error('[mercadopago] error procesando webhook:', {
      message: e?.message,
      code: e?.code,
      detail: e?.detail,
      constraint: e?.constraint,
    });
    return NextResponse.json({ error: 'processing_error' }, { status: 500 });
  }
}
