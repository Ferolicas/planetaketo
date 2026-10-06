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
// Seguridad: el Webhook del panel se valida con `x-signature`. La IPN creada por
// `notification_url` no es autenticable con ese secret; para ella consultamos
// el pago directamente por API y exigimos metadatos/importe/referencia propios.
// ============================================================
export async function POST(req: NextRequest) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!isMpConfigured()) {
    console.error('[mercadopago] webhook no configurado (falta access token)');
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

  // Webhooks del panel llevan firma. `notification_url`, en cambio, usa el
  // protocolo IPN y Mercado Pago documenta que no puede validarse con el secret.
  // Para ambos canales consultamos el pago por API y exigimos la procedencia
  // server-side de Planeta Keto antes de entregar nada.
  let signatureValid = false;
  if (secret) {
    try {
      WebhookSignatureValidator.validate({
        xSignature: req.headers.get('x-signature'),
        xRequestId: req.headers.get('x-request-id'),
        dataId,
        secret,
        toleranceSeconds: 600,
      });
      signatureValid = true;
    } catch (err) {
      if (err instanceof InvalidWebhookSignatureError) {
        // Puede ser una IPN legítima. No confiamos en sus campos: se valida
        // consultando el pago por API y comprobando su procedencia más abajo.
      } else {
        throw err;
      }
    }
  }

  try {
    const payment = await mpPayment().get({ id: String(dataId) });
    const result = await finalizeMpPayment(payment);
    if (!signatureValid && result.status !== 'skipped') {
      console.log('[mercadopago] pago recuperado por canal IPN verificado vía API');
    }
    return NextResponse.json({
      received: true,
      channel: signatureValid ? 'webhook' : 'ipn',
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
