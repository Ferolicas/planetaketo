import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { query, queryOne } from '@/lib/db';
import { resend } from '@/lib/resend';
import { getEmail1Template } from '@/lib/email/lead-templates';

export const runtime = 'nodejs';

const leadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Planeta Keto <info@planetaketo.es>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://planetaketo.es';
const YOUTUBE_URL = 'https://youtube.com/@planetaketo';

function generateDownloadToken(): string {
  return randomBytes(32).toString('hex');
}

// País del visitante a partir de su IP (best-effort). Para mostrar la bandera
// en la lista de descargas gratis del panel. Nunca rompe el alta del lead.
async function countryFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const xff = request.headers.get('x-forwarded-for') || '';
    const ip = xff.split(',')[0].trim();
    if (
      !ip ||
      ip === '::1' ||
      ip.startsWith('127.') ||
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('172.16.')
    ) {
      return null;
    }
    const res = await fetch(`https://ipapi.co/${ip}/country/`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const cc = (await res.text()).trim().toUpperCase();
    return /^[A-Z]{2}$/.test(cc) ? cc : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = leadSchema.parse(body);

    // ¿Ya existe el lead? (una sola copia por email)
    const existingLead = await queryOne<{ id: string }>(
      `SELECT id FROM leads WHERE email = $1`,
      [email]
    );

    if (existingLead) {
      console.log(`Email ${email} already exists - no resend allowed`);
      return NextResponse.json({ success: true, message: 'Subscription successful' });
    }

    const newLead = await queryOne<{ id: string }>(
      `INSERT INTO leads (email, name) VALUES ($1, $2) RETURNING id`,
      [email, name]
    );

    if (!newLead) {
      throw new Error('Failed to save lead information');
    }

    console.log(`New lead created: ${email}`);

    // País del lead (best-effort): si la columna no existe o la geo falla, no rompe el alta.
    try {
      const country = await countryFromRequest(request);
      if (country) {
        await query(`UPDATE leads SET country = $1 WHERE id = $2`, [country, newLead.id]);
      }
    } catch (geoError) {
      console.warn('No se pudo guardar el país del lead:', (geoError as Error).message);
    }

    // Token de descarga (un solo uso, expira en 7 días)
    const downloadToken = generateDownloadToken();
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    try {
      await query(
        `INSERT INTO download_tokens (token, lead_id, email, file_key, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          downloadToken,
          newLead.id,
          email,
          'PLANIFICADOR_KETO_7_DIAS_GRATIS.pdf',
          tokenExpiresAt.toISOString(),
        ]
      );
    } catch (tokenError) {
      console.error('Error creating download token:', tokenError);
      // Continuamos: el lead ya quedó guardado.
    }

    const downloadUrl = `${SITE_URL}/download?token=${downloadToken}`;
    console.log(`Download token created for ${email}: ${downloadToken.substring(0, 8)}...`);

    const templateParams = {
      name,
      pdfUrl: downloadUrl,
      fourthwallUrl: SITE_URL,
      youtubeUrl: YOUTUBE_URL,
    };

    try {
      const email1Result = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Tu Plan Keto de 7 Días está aquí 🥑',
        html: getEmail1Template(templateParams),
      });
      // El SDK de Resend no lanza en fallos de API: devuelve { error }
      if (email1Result.error) {
        throw new Error(`Resend: ${email1Result.error.name} - ${email1Result.error.message}`);
      }
      console.log('Email 1 sent successfully:', email1Result.data?.id);
    } catch (emailError: unknown) {
      console.error('Error sending email:', emailError);
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
