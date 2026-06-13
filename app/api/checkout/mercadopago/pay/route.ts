import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { queryOne } from '@/lib/db';
import { isMpConfigured, mpPayment, mpRedirectUrl, finalizeMpPayment } from '@/lib/payments/mercadopago';
import { convertEurToCop } from '@/lib/payments/fx';
import { PRODUCT_CONFIG } from '@/lib/product';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// Crea el pago de Mercado Pago (Colombia) a partir del formData del Payment
// Brick. NUNCA confiamos en el importe del cliente: recalculamos el precio en
// COP server-side a partir de "homeContent".discount_price (EUR) con la tasa
// EUR→COP en vivo.
//
// La entrega del libro la dispara el webhook (fuente de verdad); si el pago ya
// vuelve `approved`, entregamos también aquí (finalizeSale es idempotente).
// ============================================================
interface BrickFormData {
  token?: string;
  installments?: number | string;
  payment_method_id?: string;
  issuer_id?: number | string;
  payer?: {
    email?: string;
    identification?: { type?: string; number?: string };
  };
}

export async function POST(req: NextRequest) {
  if (!isMpConfigured()) {
    console.error('[mercadopago] MP_ACCESS_TOKEN no configurado');
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }

  let form: BrickFormData;
  try {
    form = (await req.json()) as BrickFormData;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const token = form?.token;
  const email = form?.payer?.email?.trim();
  if (!token || !email) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  // Precio EUR → COP en vivo (fuente de verdad: BD; importe recalculado en servidor).
  const row = await queryOne<{ discount_price: string | number | null }>(
    `SELECT discount_price FROM "homeContent" WHERE id = 'default'`
  );
  const eur = Number(row?.discount_price ?? 10);
  const { cop } = await convertEurToCop(eur);

  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const orderId = crypto.randomUUID();

  try {
    const payment = await mpPayment().create({
      body: {
        transaction_amount: cop,
        token,
        description: PRODUCT_CONFIG.name,
        installments: Number(form?.installments) || 1,
        payment_method_id: form?.payment_method_id,
        issuer_id: form?.issuer_id ? Number(form.issuer_id) : undefined,
        external_reference: orderId,
        notification_url: `${origin}/api/mercadopago/webhook`,
        metadata: { product_name: PRODUCT_CONFIG.name },
        payer: {
          email,
          identification: form?.payer?.identification,
        },
      },
      requestOptions: { idempotencyKey: orderId },
    });

    // Entrega inmediata si ya está aprobado (el webhook re-confirma; es idempotente).
    if (payment.status === 'approved') {
      await finalizeMpPayment(payment).catch((e) =>
        console.error('[mercadopago] entrega inmediata falló (la rescata el webhook):', e)
      );
    }

    return NextResponse.json({
      id: payment.id,
      status: payment.status, // approved | in_process | rejected | pending
      status_detail: payment.status_detail,
      redirect_url: mpRedirectUrl(payment),
    });
  } catch (err) {
    const e = err as Record<string, unknown>;
    console.error('[mercadopago] error creando pago:', { message: e?.message, cause: e?.cause });
    return NextResponse.json({ error: 'payment_error' }, { status: 500 });
  }
}
