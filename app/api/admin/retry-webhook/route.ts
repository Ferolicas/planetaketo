import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createMagicLink } from '@/lib/downloads/magic-link';
import { Resend } from 'resend';
import { getPurchaseEmailTemplate } from '@/lib/email/templates';
import { PRODUCT_CONFIG } from '@/lib/stripe/config';

const resend = new Resend(process.env.RESEND_API_KEY);
const WHATSAPP_NUMBER = '+19176726696';

/**
 * Admin endpoint to retry failed webhook processing
 * POST /api/admin/retry-webhook
 * Body: { webhookLogId: string } OR { paymentId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookLogId, paymentId } = body;

    if (!webhookLogId && !paymentId) {
      return NextResponse.json(
        { error: 'Either webhookLogId or paymentId is required' },
        { status: 400 }
      );
    }

    // Get webhook log
    let webhookLog;
    if (webhookLogId) {
      const { data } = await supabaseAdmin
        .from('webhook_logs')
        .select('*')
        .eq('id', webhookLogId)
        .single();
      webhookLog = data;
    } else {
      const { data } = await supabaseAdmin
        .from('webhook_logs')
        .select('*')
        .eq('stripe_payment_intent', paymentId)
        .single();
      webhookLog = data;
    }

    if (!webhookLog) {
      return NextResponse.json(
        { error: 'Webhook log not found' },
        { status: 404 }
      );
    }

    console.log(`🔄 Retrying webhook: ${webhookLog.id}`);

    // Get payment record
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*, customers(*)')
      .eq('stripe_payment_id', webhookLog.stripe_payment_intent)
      .single();

    if (!payment) {
      // Payment doesn't exist, need to recreate from webhook data
      return await recreatePaymentFromWebhook(webhookLog);
    }

    // Payment exists, check what needs to be retried
    const needsMagicLink = !payment.magic_link_created;
    const needsEmail = !payment.email_sent;

    console.log(`Status: Magic Link: ${payment.magic_link_created}, Email: ${payment.email_sent}`);

    let downloadUrl;

    // Create magic link if needed
    if (needsMagicLink) {
      console.log('Creating magic link...');
      const result = await createMagicLink(
        payment.customer_id,
        payment.id,
        PRODUCT_CONFIG.pdfFileName
      );
      downloadUrl = result.downloadUrl;

      await supabaseAdmin
        .from('payments')
        .update({ magic_link_created: true })
        .eq('id', payment.id);

      console.log('✅ Magic link created');
    } else {
      // Get existing magic link
      const { data: magicLink } = await supabaseAdmin
        .from('download_links')
        .select('magic_token')
        .eq('payment_id', payment.id)
        .single();

      if (magicLink) {
        downloadUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/download/${magicLink.magic_token}`;
      } else {
        // Magic link was marked as created but doesn't exist, recreate
        const result = await createMagicLink(
          payment.customer_id,
          payment.id,
          PRODUCT_CONFIG.pdfFileName
        );
        downloadUrl = result.downloadUrl;
      }
    }

    // Send email if needed
    if (needsEmail) {
      console.log(`Sending email to ${payment.customers.email}...`);
      const emailHtml = getPurchaseEmailTemplate({
        customerName: payment.customers.name,
        downloadUrl,
        whatsappNumber: WHATSAPP_NUMBER,
      });

      const emailResult = await resend.emails.send({
        from: 'Planeta Keto <info@planetaketo.es>',
        to: payment.customers.email,
        subject: '¡Gracias por tu compra! Tu Método Keto está listo 💚',
        html: emailHtml,
      });

      await supabaseAdmin
        .from('payments')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      console.log(`✅ Email sent: ${emailResult.data?.id}`);
    }

    // Update webhook log
    await supabaseAdmin
      .from('webhook_logs')
      .update({
        status: 'completed',
        processing_step: 'completed_via_retry',
        completed_at: new Date().toISOString(),
        retry_count: (webhookLog.retry_count || 0) + 1,
        last_retry_at: new Date().toISOString(),
      })
      .eq('id', webhookLog.id);

    console.log('✅ Webhook retry successful');

    return NextResponse.json({
      success: true,
      webhookLogId: webhookLog.id,
      paymentId: payment.id,
      actions: {
        magicLinkCreated: needsMagicLink,
        emailSent: needsEmail,
      }
    });

  } catch (error: any) {
    console.error('❌ Retry failed:', error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

async function recreatePaymentFromWebhook(webhookLog: any) {
  console.log('⚠️  Payment record missing, recreating from webhook data...');

  // Get or create customer
  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('email', webhookLog.customer_email)
    .maybeSingle();

  if (!customer) {
    return NextResponse.json(
      { error: 'Customer not found and cannot be recreated from webhook log alone' },
      { status: 400 }
    );
  }

  // Create payment record
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('payments')
    .insert({
      customer_id: customer.id,
      stripe_payment_id: webhookLog.stripe_payment_intent,
      stripe_session_id: webhookLog.stripe_session_id,
      amount: webhookLog.amount,
      currency: webhookLog.currency,
      status: 'paid',
      product_name: PRODUCT_CONFIG.name,
      webhook_log_id: webhookLog.id,
    })
    .select()
    .single();

  if (paymentError) {
    throw new Error(`Failed to recreate payment: ${paymentError.message}`);
  }

  console.log(`✅ Payment record recreated: ${payment.id}`);

  // Create magic link
  const { downloadUrl } = await createMagicLink(
    customer.id,
    payment.id,
    PRODUCT_CONFIG.pdfFileName
  );

  await supabaseAdmin
    .from('payments')
    .update({ magic_link_created: true })
    .eq('id', payment.id);

  // Send email
  const emailHtml = getPurchaseEmailTemplate({
    customerName: customer.name,
    downloadUrl,
    whatsappNumber: WHATSAPP_NUMBER,
  });

  const emailResult = await resend.emails.send({
    from: 'Planeta Keto <info@planetaketo.es>',
    to: customer.email,
    subject: '¡Gracias por tu compra! Tu Método Keto está listo 💚',
    html: emailHtml,
  });

  await supabaseAdmin
    .from('payments')
    .update({
      email_sent: true,
      email_sent_at: new Date().toISOString()
    })
    .eq('id', payment.id);

  // Update webhook log
  await supabaseAdmin
    .from('webhook_logs')
    .update({
      status: 'completed',
      processing_step: 'completed_via_full_recreation',
      completed_at: new Date().toISOString(),
    })
    .eq('id', webhookLog.id);

  console.log(`✅ Full recreation successful | Email: ${emailResult.data?.id}`);

  return NextResponse.json({
    success: true,
    recreated: true,
    webhookLogId: webhookLog.id,
    paymentId: payment.id,
  });
}

/**
 * GET endpoint to list failed webhooks
 */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('webhook_logs')
    .select('*')
    .in('status', ['failed', 'processing'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ failedWebhooks: data });
}
