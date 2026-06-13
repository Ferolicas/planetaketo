import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { queryOne } from '@/lib/db';
import {
  isMpConfigured,
  createMpPayment,
  mpRedirectUrl,
  finalizeMpPayment,
  type MpPayment,
} from '@/lib/payments/mercadopago';
import { convertEurToCop } from '@/lib/payments/fx';
import { PRODUCT_CONFIG } from '@/lib/product';
import { getClientIp } from '@/lib/geo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// Crea el pago de Mercado Pago (Colombia) a partir del formData del Payment
// Brick. Pasamos el formData TAL CUAL (cada método —tarjeta, PSE, Nequi,
// Efecty— trae su propia forma; solo la tarjeta lleva `token`) y sobreescribimos
// únicamente lo que controla el servidor: el importe en COP (recalculado en vivo,
// nunca confiamos en el del cliente), la referencia, el webhook y la descripción.
//
// El único campo que exigimos es el EMAIL del comprador: es la llave con la que
// finalizeSale() le entrega el libro por correo. La entrega la dispara el webhook;
// si el pago ya vuelve `approved`, entregamos también aquí (idempotente).
// ============================================================
export async function POST(req: NextRequest) {
  if (!isMpConfigured()) {
    console.error('[mercadopago] MP_ACCESS_TOKEN no configurado');
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }

  let form: Record<string, unknown>;
  try {
    form = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const payer = (form?.payer ?? {}) as {
    email?: string;
    identification?: { number?: string };
  };
  const email = payer?.email?.trim();

  // Log de diagnóstico (presencia, nunca valores).
  console.log('[mercadopago] /pay recibido:', {
    hasToken: Boolean(form?.token),
    hasEmail: Boolean(email),
    paymentMethod: (form?.payment_method_id as string) ?? null,
    hasIdentification: Boolean(payer?.identification?.number),
  });

  if (!email) {
    console.warn('[mercadopago] /pay rechazado: falta el email del comprador');
    return NextResponse.json({ error: 'missing_email' }, { status: 400 });
  }

  // Precio EUR → COP en vivo (fuente de verdad: BD; importe recalculado en servidor).
  const row = await queryOne<{ discount_price: string | number | null }>(
    `SELECT discount_price FROM "homeContent" WHERE id = 'default'`
  );
  const eur = Number(row?.discount_price ?? 10);
  const { cop } = await convertEurToCop(eur);

  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const orderId = crypto.randomUUID();

  // MP exige la IP del comprador en additional_info (la pasa Caddy en x-forwarded-for).
  const ip = getClientIp(req.headers);
  const existingAddInfo = (form.additional_info ?? {}) as Record<string, unknown>;

  try {
    const payment = (await createMpPayment(
      {
        ...form,
        transaction_amount: cop,
        description: PRODUCT_CONFIG.name,
        external_reference: orderId,
        notification_url: `${origin}/api/mercadopago/webhook`,
        // PSE/Efecty redirigen al comprador al banco; al volver, MP lo manda aquí.
        callback_url: `${origin}/gracias`,
        metadata: { product_name: PRODUCT_CONFIG.name },
        additional_info: {
          ...existingAddInfo,
          ...(ip ? { ip_address: ip } : {}),
        },
      },
      orderId
    )) as MpPayment;

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
      redirect_url: mpRedirectUrl(payment), // PSE/Efecty: URL del banco
    });
  } catch (err) {
    const e = err as Record<string, unknown>;
    console.error('[mercadopago] error creando pago:', { message: e?.message, cause: e?.cause });
    return NextResponse.json({ error: 'payment_error' }, { status: 500 });
  }
}
