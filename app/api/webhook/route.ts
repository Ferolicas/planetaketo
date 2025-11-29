import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { resend } from '@/lib/resend';
import { generateToken } from '@/lib/utils';
import { addDays } from 'date-fns';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const productId = session.metadata?.productId;
        const customerEmail = session.customer_details?.email;

        if (!productId || !customerEmail) {
          throw new Error('Missing product ID or customer email');
        }

        // Create user if doesn't exist
        let { data: user, error: userFindError } = await supabaseAdmin
          .from('user')
          .select('*')
          .eq('email', customerEmail)
          .single();

        if (userFindError && userFindError.code !== 'PGRST116') {
          throw new Error(`Error finding user: ${userFindError.message}`);
        }

        if (!user) {
          const { data: newUser, error: userCreateError } = await supabaseAdmin
            .from('user')
            .insert({
              email: customerEmail,
              name: session.customer_details?.name || null,
              password: generateToken(32), // Temporary password
            })
            .select()
            .single();

          if (userCreateError) {
            throw new Error(`Error creating user: ${userCreateError.message}`);
          }

          user = newUser;
        }

        // Create purchase record
        const { data: purchase, error: purchaseError } = await supabaseAdmin
          .from('purchase')
          .insert({
            userId: user.id,
            productId,
            stripePaymentId: session.payment_intent as string,
            amount: (session.amount_total || 0) / 100,
            status: 'completed',
          })
          .select()
          .single();

        if (purchaseError) {
          throw new Error(`Error creating purchase: ${purchaseError.message}`);
        }

        // Get product details
        const { data: product, error: productError } = await supabaseAdmin
          .from('product')
          .select('*')
          .eq('id', productId)
          .single();

        if (productError) {
          throw new Error(`Error fetching product: ${productError.message}`);
        }

        // Create download link (expires in 30 days, max 2 downloads)
        const downloadToken = generateToken(64);
        const { error: downloadError } = await supabaseAdmin
          .from('download')
          .insert({
            userId: user.id,
            purchaseId: purchase.id,
            token: downloadToken,
            maxDownloads: 2,
            expiresAt: addDays(new Date(), 30),
          })
          .select()
          .single();

        if (downloadError) {
          throw new Error(`Error creating download: ${downloadError.message}`);
        }

        const downloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/download/${downloadToken}`;
        const profileUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/perfil`;
        const whatsappUrl = `https://wa.me/19176726696?text=${encodeURIComponent('Hola, necesito soporte con mi compra')}`;

        // Send email with Resend
        await resend.emails.send({
          from: 'Planeta Keto <info@planetaketo.es>',
          to: customerEmail,
          subject: '¡Gracias por tu compra! - Planeta Keto',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">¡Bienvenido a Planeta Keto!</h1>
                </div>

                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                  <h2 style="color: #16a34a;">¡Gracias por tu compra!</h2>

                  <p>Hola ${session.customer_details?.name || 'amigo'},</p>

                  <p>Estamos emocionados de tenerte en nuestra comunidad. Has adquirido: <strong>${product?.name}</strong></p>

                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                    <h3 style="margin-top: 0; color: #16a34a;">📥 Descarga tu producto</h3>
                    <p>Puedes descargar tu producto haciendo clic en el siguiente enlace (máximo 2 descargas):</p>
                    <a href="${downloadUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0;">Descargar Ahora</a>
                    <p style="font-size: 12px; color: #666;">Este enlace expira en 30 días.</p>
                  </div>

                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                    <h3 style="margin-top: 0; color: #16a34a;">👤 Accede a tu perfil</h3>
                    <p>Accede a tu perfil de usuario para conectar con la comunidad:</p>
                    <a href="${profileUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0;">Ir a Mi Perfil</a>
                    <p><strong>Email:</strong> ${customerEmail}</p>
                  </div>

                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <h3 style="margin-top: 0; color: #16a34a;">💬 ¿Necesitas ayuda?</h3>
                    <p>Estamos aquí para ayudarte con cualquier consulta.</p>
                    <a href="${whatsappUrl}" style="display: inline-block; background: #25D366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0;">📱 Soporte por WhatsApp</a>
                  </div>

                  <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
                    ¡Gracias por confiar en Planeta Keto!<br>
                    <strong>Equipo Planeta Keto</strong>
                  </p>
                </div>
              </body>
            </html>
          `,
        });

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
