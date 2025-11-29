import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRODUCT_CONFIG } from '@/lib/stripe/config';
import { supabaseAdmin } from '@/lib/supabase';
import { createMagicLink } from '@/lib/downloads/magic-link';
import { Resend } from 'resend';
import { getPurchaseEmailTemplate } from '@/lib/email/templates';

const resend = new Resend(process.env.RESEND_API_KEY);
const WHATSAPP_NUMBER = '+19176726696';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      // Get customer details from Stripe
      const customer = await stripe.customers.retrieve(session.customer as string);
      const customerEmail = typeof customer !== 'string' && customer.email ? customer.email : session.customer_email;
      const customerName = typeof customer !== 'string' && customer.name ? customer.name : session.customer_details?.name || 'Cliente';
      const country = session.customer_details?.address?.country || 'Unknown';

      if (!customerEmail) {
        throw new Error('No customer email found');
      }

      // 1. Create or update customer in database
      let dbCustomer;
      const { data: existingCustomer } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('email', customerEmail)
        .single();

      if (existingCustomer) {
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

        if (error) throw error;
        dbCustomer = data;
      } else {
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

        if (error) throw error;
        dbCustomer = data;
      }

      // 2. Create payment record
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

      if (paymentError) throw paymentError;

      // 3. Create magic download link
      const { downloadUrl } = await createMagicLink(
        dbCustomer.id,
        payment.id,
        PRODUCT_CONFIG.pdfFileName
      );

      // 4. Send email with Resend
      const emailHtml = getPurchaseEmailTemplate({
        customerName,
        downloadUrl,
        whatsappNumber: WHATSAPP_NUMBER,
      });

      await resend.emails.send({
        from: 'Planeta Keto <info@planetaketo.es>',
        to: customerEmail,
        subject: '¡Gracias por tu compra! Tu Método Keto está listo 💚',
        html: emailHtml,
      });

      console.log('Payment processed successfully:', {
        customer: customerEmail,
        amount: payment.amount,
        downloadUrl,
      });

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error('Error processing payment:', error);
      return NextResponse.json(
        { error: 'Error processing payment' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
