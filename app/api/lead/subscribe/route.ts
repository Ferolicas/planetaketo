import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { resend } from '@/lib/resend';
import {
  getEmail1Template,
  getEmail2Template,
  getEmail3Template,
  getEmail4Template,
  getEmail5Template,
} from '@/lib/email/lead-templates';

// Validation schema
const leadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

// Email configuration
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
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

    // Calculate scheduled dates for emails 2-5
    const now = new Date();
    const day2 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const day4 = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    const day7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const day9 = new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000);

    // Email template parameters
    const templateParams = {
      name,
      pdfUrl: downloadUrl, // Magic link instead of direct PDF URL
      fourthwallUrl: SITE_URL,
      youtubeUrl: YOUTUBE_URL,
    };

    try {
      // Send Email 1 immediately (with PDF link)
      const email1Result = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Tu Plan Keto de 7 Días está aquí 🥑',
        html: getEmail1Template(templateParams),
      });

      console.log('Email 1 sent:', email1Result);

      // Schedule Email 2 (Day 2)
      const email2Result = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'El error #1 que arruina la dieta keto',
        html: getEmail2Template(templateParams),
        scheduledAt: day2.toISOString(),
      });

      console.log('Email 2 scheduled for', day2.toISOString(), ':', email2Result);

      // Schedule Email 3 (Day 4)
      const email3Result = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: '¿Cómo vas con el plan? (día 3-4)',
        html: getEmail3Template(templateParams),
        scheduledAt: day4.toISOString(),
      });

      console.log('Email 3 scheduled for', day4.toISOString(), ':', email3Result);

      // Schedule Email 4 (Day 7)
      const email4Result = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Ya terminaste los 7 días... ¿y ahora qué?',
        html: getEmail4Template(templateParams),
        scheduledAt: day7.toISOString(),
      });

      console.log('Email 4 scheduled for', day7.toISOString(), ':', email4Result);

      // Schedule Email 5 (Day 9)
      const email5Result = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: '(última vez) Sobre el método de 70 días',
        html: getEmail5Template(templateParams),
        scheduledAt: day9.toISOString(),
      });

      console.log('Email 5 scheduled for', day9.toISOString(), ':', email5Result);
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
