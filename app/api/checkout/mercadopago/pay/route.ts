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
// Crea el pago de Mercado Pago (Colombia) a partir del formData del Payment Brick.
// Vale para tarjeta (lleva token) y para PSE/Nequi/Efecty (sin token).
//
// CLAVE (aprendido de una integración que ya funciona): el Payment Brick NO
// recoge `first_name`, `last_name`, `phone` ni `address`, pero PSE los EXIGE.
// Si no se envían, MP responde "BankTransfers Api fail" (9032). Por eso los
// completamos en el servidor (con lo que traiga el brick o defaults válidos de
// Colombia). MP también exige `additional_info.ip_address` y `callback_url`.
//
// El único dato que pedimos al comprador es el EMAIL: es la llave con la que
// finalizeSale() le entrega el libro por correo.
// ============================================================
interface BrickPayer {
  email?: string;
  entity_type?: string;
  first_name?: string;
  last_name?: string;
  identification?: { type?: string; number?: string };
  phone?: { area_code?: string; number?: string };
  address?: Record<string, string>;
  financial_institution?: string;
}

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

  const formPayer = (form.payer ?? {}) as BrickPayer;
  const email = formPayer.email?.trim();

  console.log('[mercadopago] /pay recibido:', {
    hasToken: Boolean(form.token),
    hasEmail: Boolean(email),
    paymentMethod: (form.payment_method_id as string) ?? null,
    hasIdentification: Boolean(formPayer.identification?.number),
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
  const ip = getClientIp(req.headers); // MP exige additional_info.ip_address
  const existingAddInfo = (form.additional_info ?? {}) as Record<string, unknown>;

  // Banco de PSE (lo trae el brick en transaction_details.financial_institution).
  const td = (form.transaction_details ?? {}) as { financial_institution?: string };
  const financialInstitution =
    td.financial_institution ||
    (form.financial_institution as string | undefined) ||
    formPayer.financial_institution;

  try {
    const payment = (await createMpPayment(
      {
        ...form,
        transaction_amount: cop,
        description: PRODUCT_CONFIG.name,
        external_reference: orderId,
        notification_url: `${origin}/api/mercadopago/webhook`,
        callback_url: `${origin}/gracias`, // PSE/Efecty redirigen al banco y vuelven aquí
        metadata: { product_name: PRODUCT_CONFIG.name },
        additional_info: {
          ...existingAddInfo,
          ...(ip ? { ip_address: ip } : {}),
        },
        // PSE exige payer completo; el brick no recoge nombre/teléfono/dirección.
        payer: {
          ...formPayer,
          email,
          entity_type: formPayer.entity_type || 'individual',
          first_name: (formPayer.first_name || 'Cliente').slice(0, 32),
          last_name: (formPayer.last_name || 'Planeta Keto').slice(0, 32),
          identification: formPayer.identification,
          phone: formPayer.phone || { area_code: '601', number: '0000000' },
          address: formPayer.address || {
            zip_code: '11001',
            street_name: 'NA',
            street_number: '0',
            neighborhood: 'Centro',
            city: 'Bogota',
          },
        },
        ...(financialInstitution
          ? { transaction_details: { financial_institution: String(financialInstitution) } }
          : {}),
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
      status: payment.status, // approved | in_process | pending | rejected
      status_detail: payment.status_detail,
      redirect_url: mpRedirectUrl(payment), // PSE/Efecty: URL del banco
    });
  } catch (err) {
    const message = (err as Error)?.message ?? '';
    console.error('[mercadopago] error creando pago:', { message });

    // 424 / BankTransfers / 9032 / 9034 → la pasarela PSE de MP está caída
    // momentáneamente (failed_dependency). No es culpa del pagador: reintentar.
    if (/\b424\b|BankTransfers|903[24]|failed_dependency/i.test(message)) {
      return NextResponse.json(
        { error: 'bank_unavailable', message: 'El banco no está disponible ahora mismo. Espera un momento e inténtalo de nuevo.' },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: 'payment_error' }, { status: 500 });
  }
}
