import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { createMagicLink } from '@/lib/downloads/magic-link';
import { resend } from '@/lib/resend';
import { getPurchaseEmailTemplate } from '@/lib/email/templates';
import { PRODUCT_CONFIG } from '@/lib/stripe/config';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

const WHATSAPP_NUMBER = '+19176726696';
const FROM_EMAIL = 'Planeta Keto <info@planetaketo.es>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://planetaketo.es';

interface WebhookLog {
  id: string;
  stripe_payment_intent: string | null;
  stripe_session_id: string | null;
  customer_email: string | null;
  amount: number | null;
  currency: string | null;
  retry_count: number | null;
}

interface PaymentJoined {
  id: string;
  customer_id: string;
  magic_link_created: boolean | null;
  email_sent: boolean | null;
  customer_email: string;
  customer_name: string | null;
}

/**
 * Reintento de procesamiento de webhooks fallidos (admin).
 * POST /api/admin/retry-webhook  Body: { webhookLogId } | { paymentId }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { webhookLogId, paymentId } = await request.json();
    if (!webhookLogId && !paymentId) {
      return NextResponse.json(
        { error: 'Either webhookLogId or paymentId is required' },
        { status: 400 }
      );
    }

    const webhookLog = webhookLogId
      ? await queryOne<WebhookLog>(`SELECT * FROM webhook_logs WHERE id = $1`, [webhookLogId])
      : await queryOne<WebhookLog>(
          `SELECT * FROM webhook_logs WHERE stripe_payment_intent = $1`,
          [paymentId]
        );

    if (!webhookLog) {
      return NextResponse.json({ error: 'Webhook log not found' }, { status: 404 });
    }

    console.log(`🔄 Retrying webhook: ${webhookLog.id}`);

    const payment = await queryOne<PaymentJoined>(
      `SELECT p.id, p.customer_id, p.magic_link_created, p.email_sent,
              c.email AS customer_email, c.name AS customer_name
       FROM payments p
       JOIN customers c ON c.id = p.customer_id
       WHERE p.stripe_payment_id = $1`,
      [webhookLog.stripe_payment_intent]
    );

    if (!payment) {
      return await recreatePaymentFromWebhook(webhookLog);
    }

    const needsMagicLink = !payment.magic_link_created;
    const needsEmail = !payment.email_sent;

    let downloadUrl: string;
    if (needsMagicLink) {
      const result = await createMagicLink(payment.customer_id, payment.id, PRODUCT_CONFIG.pdfFileName);
      downloadUrl = result.downloadUrl;
      await query(`UPDATE payments SET magic_link_created = true WHERE id = $1`, [payment.id]);
    } else {
      const existingLink = await queryOne<{ token: string }>(
        `SELECT token FROM download_links WHERE payment_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [payment.id]
      );
      downloadUrl = existingLink
        ? `${SITE_URL}/download/${existingLink.token}`
        : (await createMagicLink(payment.customer_id, payment.id, PRODUCT_CONFIG.pdfFileName)).downloadUrl;
    }

    if (needsEmail) {
      const emailResult = await resend.emails.send({
        from: FROM_EMAIL,
        to: payment.customer_email,
        subject: '¡Gracias por tu compra! Tu Método Keto está listo 💚',
        html: getPurchaseEmailTemplate({
          customerName: payment.customer_name ?? 'Cliente',
          downloadUrl,
          whatsappNumber: WHATSAPP_NUMBER,
        }),
      });
      await query(
        `UPDATE payments SET email_sent = true, email_sent_at = now() WHERE id = $1`,
        [payment.id]
      );
      console.log(`✅ Email reenviado: ${emailResult.data?.id}`);
    }

    await query(
      `UPDATE webhook_logs
       SET status = 'completed', processing_step = 'completed_via_retry',
           completed_at = now(),
           retry_count = COALESCE(retry_count, 0) + 1, last_retry_at = now()
       WHERE id = $1`,
      [webhookLog.id]
    );

    return NextResponse.json({
      success: true,
      webhookLogId: webhookLog.id,
      paymentId: payment.id,
      actions: { magicLinkCreated: needsMagicLink, emailSent: needsEmail },
    });
  } catch (error) {
    console.error('❌ Retry failed:', (error as Error).message);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

async function recreatePaymentFromWebhook(webhookLog: WebhookLog): Promise<NextResponse> {
  console.log('⚠️  Payment record missing, recreating from webhook data...');

  const customer = await queryOne<{ id: string; email: string; name: string | null }>(
    `SELECT id, email, name FROM customers WHERE email = $1`,
    [webhookLog.customer_email]
  );

  if (!customer) {
    return NextResponse.json(
      { error: 'Customer not found and cannot be recreated from webhook log alone' },
      { status: 400 }
    );
  }

  const payment = await queryOne<{ id: string }>(
    `INSERT INTO payments
       (customer_id, stripe_payment_id, stripe_session_id, amount, currency, status, product_name, webhook_log_id)
     VALUES ($1, $2, $3, $4, $5, 'paid', $6, $7) RETURNING id`,
    [
      customer.id,
      webhookLog.stripe_payment_intent,
      webhookLog.stripe_session_id,
      webhookLog.amount,
      webhookLog.currency,
      PRODUCT_CONFIG.name,
      webhookLog.id,
    ]
  );
  if (!payment) throw new Error('Failed to recreate payment');

  const { downloadUrl } = await createMagicLink(customer.id, payment.id, PRODUCT_CONFIG.pdfFileName);
  await query(`UPDATE payments SET magic_link_created = true WHERE id = $1`, [payment.id]);

  const emailResult = await resend.emails.send({
    from: FROM_EMAIL,
    to: customer.email,
    subject: '¡Gracias por tu compra! Tu Método Keto está listo 💚',
    html: getPurchaseEmailTemplate({
      customerName: customer.name ?? 'Cliente',
      downloadUrl,
      whatsappNumber: WHATSAPP_NUMBER,
    }),
  });

  await query(
    `UPDATE payments SET email_sent = true, email_sent_at = now() WHERE id = $1`,
    [payment.id]
  );

  await query(
    `UPDATE webhook_logs
     SET status = 'completed', processing_step = 'completed_via_full_recreation', completed_at = now()
     WHERE id = $1`,
    [webhookLog.id]
  );

  console.log(`✅ Full recreation successful | Email: ${emailResult.data?.id}`);
  return NextResponse.json({
    success: true,
    recreated: true,
    webhookLogId: webhookLog.id,
    paymentId: payment.id,
  });
}

// Lista de webhooks fallidos (admin).
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const res = await query(
      `SELECT * FROM webhook_logs
       WHERE status IN ('failed', 'processing')
       ORDER BY created_at DESC LIMIT 50`
    );
    return NextResponse.json({ failedWebhooks: res.rows });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
