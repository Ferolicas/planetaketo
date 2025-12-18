import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRODUCT_CONFIG } from '@/lib/stripe/config';
import { supabaseAdmin } from '@/lib/supabase';
import { createMagicLink } from '@/lib/downloads/magic-link';
import { Resend } from 'resend';
import { getPurchaseEmailTemplate } from '@/lib/email/templates';

const resend = new Resend(process.env.RESEND_API_KEY);
const WHATSAPP_NUMBER = '+19176726696';

/**
 * Complete purchase after payment
 * Called from frontend after successful payment to collect customer data
 * POST /api/stripe/complete-purchase
 */
export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, customerName, customerEmail } = await request.json();

    console.log(`📝 Completing purchase for payment: ${paymentIntentId}`);
    console.log(`👤 Customer: ${customerName} <${customerEmail}>`);

    // Validate inputs
    if (!paymentIntentId || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentIntentId, customerName, customerEmail' },
        { status: 400 }
      );
    }

    // Verify payment intent exists and is successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      console.error(`Payment not successful: ${paymentIntent.status}`);
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Check idempotency - have we already processed this payment?
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('stripe_payment_id', paymentIntentId)
      .maybeSingle();

    if (existingPayment) {
      console.log(`⏭️  Payment ${paymentIntentId} already processed`);
      return NextResponse.json({
        success: true,
        status: 'already_processed',
        message: 'El email ya fue enviado anteriormente'
      });
    }

    // Create or update customer in database
    let dbCustomer;

    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('email', customerEmail)
      .maybeSingle();

    if (existingCustomer) {
      console.log(`✓ Customer exists, updating: ${existingCustomer.id}`);
      const { data, error } = await supabaseAdmin
        .from('customers')
        .update({
          name: customerName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingCustomer.id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update customer: ${error.message}`);
      dbCustomer = data;
    } else {
      console.log('✓ Creating new customer');
      const { data, error } = await supabaseAdmin
        .from('customers')
        .insert({
          email: customerEmail,
          name: customerName,
          country: 'Unknown',
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create customer: ${error.message}`);
      dbCustomer = data;
    }

    console.log(`✅ Customer ready: ${dbCustomer.id}`);

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        customer_id: dbCustomer.id,
        stripe_payment_id: paymentIntentId,
        stripe_session_id: null,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: 'paid',
        product_name: paymentIntent.metadata.productName || PRODUCT_CONFIG.name,
      })
      .select()
      .single();

    if (paymentError) {
      throw new Error(`Failed to create payment record: ${paymentError.message}`);
    }

    console.log(`✅ Payment record created: ${payment.id} | Amount: ${payment.amount} ${payment.currency}`);

    // Create magic download link (max 2 downloads)
    const { downloadUrl } = await createMagicLink(
      dbCustomer.id,
      payment.id,
      PRODUCT_CONFIG.pdfFileName
    );

    await supabaseAdmin
      .from('payments')
      .update({ magic_link_created: true })
      .eq('id', payment.id);

    console.log(`✅ Magic link created: ${downloadUrl.substring(0, 50)}...`);

    // Send email
    const emailHtml = getPurchaseEmailTemplate({
      customerName,
      downloadUrl,
      whatsappNumber: WHATSAPP_NUMBER,
    });

    try {
      const emailResult = await resend.emails.send({
        from: 'Planeta Keto <info@planetaketo.es>',
        to: customerEmail,
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

      console.log(`✅ Email sent successfully to ${customerEmail} | Resend ID: ${emailResult.data?.id}`);
    } catch (emailError: any) {
      console.error(`❌ Email sending failed:`, emailError);
      // Don't fail the request, but log the error
      // The user already paid, so we need to handle this gracefully
      return NextResponse.json({
        success: true,
        warning: 'Payment processed but email failed to send',
        paymentId: payment.id,
      });
    }

    console.log(`\n🎉 ✅ PURCHASE COMPLETED SUCCESSFULLY`);
    console.log(`   Customer: ${customerEmail}`);
    console.log(`   Amount: ${payment.amount} ${payment.currency}`);
    console.log(`   Payment ID: ${payment.id}`);
    console.log(`   Download URL: ${downloadUrl}\n`);

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      message: 'Purchase completed and email sent'
    });

  } catch (error: any) {
    console.error(`\n❌ ❌ COMPLETE PURCHASE FAILED`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}\n`);

    return NextResponse.json(
      { error: error.message || 'Error completing purchase' },
      { status: 500 }
    );
  }
}
