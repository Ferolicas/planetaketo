/**
 * Script to manually recover Tomás Collado's failed transaction
 * Event ID: evt_1SZrVx4g09zyfJJUBq0W3JNY
 * Payment Intent: pi_3SZrVv4g09zyfJJU11Yb8nqy
 * Customer: Tomás Collado (tcg1308@gmail.com)
 * Amount: 10 EUR
 */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const TRANSACTION_DATA = {
  eventId: 'evt_1SZrVx4g09zyfJJUBq0W3JNY',
  paymentIntent: 'pi_3SZrVv4g09zyfJJU11Yb8nqy',
  sessionId: 'cs_live_a1oVSBO4a6qdGS7l8UQXvrZ11MsW89T0iDxZkfFY9InbWkonZ0nqlpMDrn',
  customerEmail: 'tcg1308@gmail.com',
  customerName: 'Tomás Collado',
  amount: 10.00,
  currency: 'eur',
  country: 'ES',
  address: {
    city: 'Baza',
    line1: 'Urbanización Federico García Lorca, 15',
    postalCode: '18800',
    state: 'GR',
  }
};

async function recoverTransaction() {
  console.log('🔄 Iniciando recuperación de transacción...\n');

  try {
    // Step 1: Check if already exists
    console.log('1️⃣ Verificando si la transacción ya existe...');
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_id', TRANSACTION_DATA.paymentIntent)
      .maybeSingle();

    if (existingPayment) {
      console.log('⚠️  Payment ya existe en DB:', existingPayment.id);
      console.log('   Verificando si necesita email...\n');

      if (existingPayment.email_sent) {
        console.log('✅ Email ya fue enviado anteriormente');
        return;
      }
    }

    // Step 2: Create or get customer
    console.log('2️⃣ Creando/obteniendo cliente...');
    let customer;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('email', TRANSACTION_DATA.customerEmail)
      .maybeSingle();

    if (existingCustomer) {
      console.log('✓ Cliente existe:', existingCustomer.id);
      customer = existingCustomer;
    } else {
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          email: TRANSACTION_DATA.customerEmail,
          name: TRANSACTION_DATA.customerName,
          country: TRANSACTION_DATA.country,
        })
        .select()
        .single();

      if (error) throw error;
      console.log('✓ Cliente creado:', newCustomer.id);
      customer = newCustomer;
    }

    // Step 3: Create payment record if doesn't exist
    let payment;
    if (!existingPayment) {
      console.log('3️⃣ Creando registro de pago...');
      const { data: newPayment, error } = await supabase
        .from('payments')
        .insert({
          customer_id: customer.id,
          stripe_payment_id: TRANSACTION_DATA.paymentIntent,
          stripe_session_id: TRANSACTION_DATA.sessionId,
          amount: TRANSACTION_DATA.amount,
          currency: TRANSACTION_DATA.currency,
          status: 'paid',
          product_name: 'Método Keto 70 Días - Planeta Keto',
        })
        .select()
        .single();

      if (error) throw error;
      console.log('✓ Pago creado:', newPayment.id);
      payment = newPayment;
    } else {
      payment = existingPayment;
    }

    // Step 4: Create magic link
    console.log('4️⃣ Creando magic link...');
    const magicToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365); // 1 year

    const { data: existingLink } = await supabase
      .from('download_links')
      .select('*')
      .eq('payment_id', payment.id)
      .maybeSingle();

    let downloadUrl;
    if (existingLink) {
      console.log('✓ Magic link ya existe');
      downloadUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/download/${existingLink.magic_token}`;
    } else {
      const { error } = await supabase
        .from('download_links')
        .insert({
          customer_id: customer.id,
          payment_id: payment.id,
          magic_token: magicToken,
          pdf_filename: 'El Metodo keto Definitivo - Planeta Keto.pdf',
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;
      downloadUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/download/${magicToken}`;
      console.log('✓ Magic link creado');
    }

    // Mark magic link as created
    await supabase
      .from('payments')
      .update({ magic_link_created: true })
      .eq('id', payment.id);

    // Step 5: Send email
    console.log('5️⃣ Enviando email...');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); color: white; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">¡Gracias por tu compra! 💚</h1>
  </div>

  <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; margin-bottom: 20px;">Hola ${TRANSACTION_DATA.customerName},</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Tu <strong>Método Keto está listo</strong> para descargar. Este es tu enlace personal de descarga:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${downloadUrl}"
         style="display: inline-block; padding: 15px 40px; background: #22c55e; color: white; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
        📥 Descargar Mi Método Keto
      </a>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      <strong>Importante:</strong> Guarda este email. Podrás acceder a tu descarga durante 1 año.
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0;">
      <p style="font-size: 16px; margin-bottom: 10px;">¿Necesitas ayuda?</p>
      <a href="https://wa.me/+19176726696"
         style="display: inline-block; padding: 12px 30px; background: #25D366; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
        💬 Contáctanos por WhatsApp
      </a>
    </div>

    <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
      Con cariño,<br>
      <strong>El equipo de Planeta Keto</strong> 🌱
    </p>
  </div>
</body>
</html>
    `;

    const emailResult = await resend.emails.send({
      from: 'Planeta Keto <info@planetaketo.es>',
      to: TRANSACTION_DATA.customerEmail,
      subject: '¡Gracias por tu compra! Tu Método Keto está listo 💚',
      html: emailHtml,
    });

    console.log('✓ Email enviado:', emailResult.data?.id);

    // Mark email as sent
    await supabase
      .from('payments')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    console.log('\n✅ ✅ ✅ TRANSACCIÓN RECUPERADA EXITOSAMENTE ✅ ✅ ✅\n');
    console.log('📧 Email enviado a:', TRANSACTION_DATA.customerEmail);
    console.log('💰 Monto:', TRANSACTION_DATA.amount, TRANSACTION_DATA.currency);
    console.log('🔗 Download URL:', downloadUrl);
    console.log('💳 Payment ID:', payment.id);
    console.log('\n');

  } catch (error) {
    console.error('\n❌ ❌ ❌ ERROR EN RECUPERACIÓN ❌ ❌ ❌\n');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

recoverTransaction();
