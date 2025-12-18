import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRODUCT_CONFIG } from '@/lib/stripe/config';
import { supabaseAdmin } from '@/lib/supabase';
import { createMagicLink } from '@/lib/downloads/magic-link';
import { Resend } from 'resend';
import { getPurchaseEmailTemplate } from '@/lib/email/templates';
import type Stripe from 'stripe';

const resend = new Resend(process.env.RESEND_API_KEY);
const WHATSAPP_NUMBER = '+19176726696';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('❌ No Stripe signature provided');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log(`📨 Webhook received: ${event.type} | ID: ${event.id}`);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle checkout.session.completed event (old flow)
  if (event.type === 'checkout.session.completed') {
    return await processCheckoutSession(event);
  }

  // Handle payment_intent.succeeded event (new embedded flow)
  if (event.type === 'payment_intent.succeeded') {
    return await processPaymentIntent(event);
  }

  return NextResponse.json({ received: true });
}

async function processCheckoutSession(event: Stripe.Event): Promise<NextResponse> {
  const session = event.data.object as Stripe.Checkout.Session;

  try {
    // Check idempotency - have we already processed this event?
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('stripe_session_id', session.id)
      .maybeSingle();

    if (existingPayment) {
      console.log(`⏭️  Session ${session.id} already processed, skipping`);
      return NextResponse.json({ received: true, status: 'already_processed' });
    }

    console.log(`📨 Processing checkout session: ${session.id}`);

    // Get customer details from Stripe
    let customerEmail: string;
    let customerName: string;
    let country: string;

    try {
      const customer = await stripe.customers.retrieve(session.customer as string);
      customerEmail = typeof customer !== 'string' && !customer.deleted && customer.email
        ? customer.email
        : session.customer_email || '';
      customerName = typeof customer !== 'string' && !customer.deleted && customer.name
        ? customer.name
        : session.customer_details?.name || 'Cliente';
      country = session.customer_details?.address?.country || 'Unknown';
    } catch (err: any) {
      console.error('⚠️  Failed to fetch customer from Stripe:', err.message);
      // Fallback to session data
      customerEmail = session.customer_email || '';
      customerName = session.customer_details?.name || 'Cliente';
      country = session.customer_details?.address?.country || 'Unknown';
    }

    if (!customerEmail) {
      throw new Error('No customer email found in session or customer object');
    }

    console.log(`👤 Customer: ${customerEmail} | Name: ${customerName} | Country: ${country}`);

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
          stripe_customer_id: session.customer as string,
          country,
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
          stripe_customer_id: session.customer as string,
          country,
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
        stripe_payment_id: session.payment_intent as string,
        stripe_session_id: session.id,
        amount: (session.amount_total || 0) / 100,
        currency: session.currency || 'eur',
        status: session.payment_status,
        product_name: PRODUCT_CONFIG.name,
      })
      .select()
      .single();

    if (paymentError) {
      throw new Error(`Failed to create payment record: ${paymentError.message}`);
    }

    console.log(`✅ Payment record created: ${payment.id} | Amount: ${payment.amount} ${payment.currency}`);

    // Create magic download link
    const { downloadUrl } = await createMagicLink(
      dbCustomer.id,
      payment.id,
      PRODUCT_CONFIG.pdfFileName
    );

    // Mark magic link as created
    await supabaseAdmin
      .from('payments')
      .update({ magic_link_created: true })
      .eq('id', payment.id);

    console.log(`✅ Magic link created: ${downloadUrl.substring(0, 50)}...`);

    // Send email with Resend
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

      // Mark email as sent
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
      // Don't throw - we'll retry email later
      throw new Error(`Email sending failed: ${emailError.message}`);
    }

    console.log(`\n🎉 ✅ PAYMENT PROCESSED SUCCESSFULLY`);
    console.log(`   Customer: ${customerEmail}`);
    console.log(`   Amount: ${payment.amount} ${payment.currency}`);
    console.log(`   Payment ID: ${payment.id}`);
    console.log(`   Download URL: ${downloadUrl}\n`);

    return NextResponse.json({
      received: true,
      status: 'success',
      paymentId: payment.id
    });

  } catch (error: any) {
    console.error(`\n❌ ❌ PAYMENT PROCESSING FAILED`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Event ID: ${event.id}`);
    console.error(`   Stack: ${error.stack}\n`);

    // Return 500 to trigger Stripe retry
    return NextResponse.json(
      { error: 'Error processing payment' },
      { status: 500 }
    );
  }
}

async function processPaymentIntent(event: Stripe.Event): Promise<NextResponse> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  try {
    // Check idempotency
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('stripe_payment_id', paymentIntent.id)
      .maybeSingle();

    if (existingPayment) {
      console.log(`⏭️  Payment Intent ${paymentIntent.id} already processed, skipping`);
      return NextResponse.json({ received: true, status: 'already_processed' });
    }

    console.log(`📨 Processing payment intent: ${paymentIntent.id}`);

    // Get customer data from metadata (set during payment intent creation)
    let customerEmail = paymentIntent.metadata.customerEmail || paymentIntent.receipt_email;
    let customerName = paymentIntent.metadata.customerName || 'Cliente';

    // Fallback: try to get from payment method billing details
    if (!customerEmail && paymentIntent.payment_method) {
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method as string);

        if (!customerEmail && paymentMethod.billing_details?.email) {
          customerEmail = paymentMethod.billing_details.email;
        }

        if (customerName === 'Cliente' && paymentMethod.billing_details?.name) {
          customerName = paymentMethod.billing_details.name;
        }
      } catch (error) {
        console.log('Could not retrieve payment method details');
      }
    }

    if (!customerEmail) {
      throw new Error('No customer email found in payment intent metadata or payment method');
    }

    console.log(`👤 Customer: ${customerEmail} | Name: ${customerName}`);

    // Get or create customer in Stripe
    const stripeCustomerId = paymentIntent.customer as string;
    let stripeCustomer;

    if (stripeCustomerId) {
      stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);
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
          stripe_customer_id: stripeCustomerId,
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
          stripe_customer_id: stripeCustomerId,
          country: 'Unknown', // Will be updated later if available
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
        stripe_payment_id: paymentIntent.id,
        stripe_session_id: null, // No session for embedded flow
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

    // Create magic download link
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
      throw new Error(`Email sending failed: ${emailError.message}`);
    }

    console.log(`\n🎉 ✅ PAYMENT PROCESSED SUCCESSFULLY (Embedded Flow)`);
    console.log(`   Customer: ${customerEmail}`);
    console.log(`   Amount: ${payment.amount} ${payment.currency}`);
    console.log(`   Payment ID: ${payment.id}`);
    console.log(`   Download URL: ${downloadUrl}\n`);

    return NextResponse.json({
      received: true,
      status: 'success',
      paymentId: payment.id
    });

  } catch (error: any) {
    console.error(`\n❌ ❌ PAYMENT PROCESSING FAILED (Embedded Flow)`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Event ID: ${event.id}`);
    console.error(`   Stack: ${error.stack}\n`);

    return NextResponse.json(
      { error: 'Error processing payment' },
      { status: 500 }
    );
  }
}
