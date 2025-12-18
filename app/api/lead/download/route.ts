import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// PDF URL in Supabase bucket
const PDF_PUBLIC_URL = process.env.LEAD_MAGNET_PDF_URL ||
  'https://xbmjnylhpcjbylqasbaz.supabase.co/storage/v1/object/public/producto/PLANIFICADOR_KETO_7_DIAS_GRATIS.pdf';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token requerido' },
        { status: 400 }
      );
    }

    // Find the token in database
    const { data: downloadToken, error: findError } = await supabaseAdmin
      .from('download_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (findError || !downloadToken) {
      console.error('Token not found:', token);
      return NextResponse.json(
        { error: 'Link no valido o expirado' },
        { status: 404 }
      );
    }

    // Check if token is already used
    if (downloadToken.used) {
      return NextResponse.json(
        {
          error: 'Este link ya fue utilizado',
          message: 'Cada link de descarga solo puede usarse una vez. Si necesitas descargar de nuevo, contacta con nosotros.'
        },
        { status: 410 } // 410 Gone
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(downloadToken.expires_at);

    if (now > expiresAt) {
      return NextResponse.json(
        {
          error: 'Link expirado',
          message: 'Este link ha expirado. Los links de descarga son validos por 7 dias.'
        },
        { status: 410 }
      );
    }

    // Mark token as used
    const { error: updateError } = await supabaseAdmin
      .from('download_tokens')
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', downloadToken.id);

    if (updateError) {
      console.error('Error marking token as used:', updateError);
      // Continue anyway - better to allow download than fail
    }

    console.log(`Download token used: ${token} for email: ${downloadToken.email}`);

    // Return the PDF URL for redirect
    return NextResponse.json({
      success: true,
      downloadUrl: PDF_PUBLIC_URL,
      message: 'Descarga autorizada'
    });

  } catch (error) {
    console.error('Error processing download:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
