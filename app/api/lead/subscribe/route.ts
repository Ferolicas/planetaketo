import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { resend } from '@/lib/resend';
import { getEmail1Template } from '@/lib/email/lead-templates';

// Validation schema
const leadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

// Email configuration
// IMPORTANTE: Para usar info@planetaketo.es, el dominio debe estar verificado en Resend
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Planeta Keto <info@planetaketo.es>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://planetaketo.es';
const YOUTUBE_URL = 'https://youtube.com/@planetaketo';

// Generate a unique download token
function generateDownloadToken(): string {
  return randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = leadSchema.parse(body);

    const { name, email } = validatedData;

    // Check if email already exists
    const { data: existingLead, error: checkError } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (which is good, means email doesn't exist)
      console.error('Error checking existing lead:', checkError);
      throw new Error('Database error checking existing email');
    }

    // If email already exists, return success without creating duplicate
    // (Don't reveal to user that email is already in system)
    if (existingLead) {
      console.log(`Email ${email} already exists in leads table`);
      return NextResponse.json({
        success: true,
        message: 'Subscription successful',
      });
    }

    // Insert new lead into database
    const { data: newLead, error: insertError } = await supabaseAdmin
      .from('leads')
      .insert({
        email,
        name,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting lead:', insertError);
      throw new Error('Failed to save lead information');
    }

    console.log(`New lead created: ${email}`);

    // Generate unique download token
    const downloadToken = generateDownloadToken();
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Save download token to database
    const { error: tokenError } = await supabaseAdmin
      .from('download_tokens')
      .insert({
        token: downloadToken,
        lead_id: newLead.id,
        email: email,
        file_key: 'PLANIFICADOR_KETO_7_DIAS_GRATIS.pdf',
        expires_at: tokenExpiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Error creating download token:', tokenError);
      // Continue anyway - we can still send the lead magnet via direct link as fallback
    }

    // Generate magic download link
    const downloadUrl = `${SITE_URL}/download?token=${downloadToken}`;
    console.log(`Download token created for ${email}: ${downloadToken.substring(0, 8)}...`);

    // Email template parameters
    const templateParams = {
      name,
      pdfUrl: downloadUrl, // Magic link instead of direct PDF URL
      fourthwallUrl: SITE_URL,
      youtubeUrl: YOUTUBE_URL,
    };

    try {
      // Send Email 1 immediately (with PDF link)
      // NOTA: Los emails programados requieren plan de pago en Resend
      // Por ahora solo enviamos el email de entrega inmediata
      const email1Result = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Tu Plan Keto de 7 Días está aquí 🥑',
        html: getEmail1Template(templateParams),
      });

      console.log('Email 1 sent:', email1Result);

      // TODO: Implementar emails de seguimiento con cron job o webhook
      // Los emails programados de Resend requieren plan de pago
    } catch (emailError) {
      console.error('Error sending/scheduling emails:', emailError);

      // Even if email sending fails, we've saved the lead
      // Log the error but don't fail the request
      // You can manually follow up with this lead
      return NextResponse.json({
        success: true,
        warning: 'Lead saved but there was an issue sending emails',
        message: 'Subscription successful',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription successful',
      leadId: newLead.id,
    });
  } catch (error) {
    console.error('Error in lead subscription:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
