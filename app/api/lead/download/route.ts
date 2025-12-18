import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Nombre del archivo en el bucket (privado)
const PDF_FILE_NAME = 'PLANIFICADOR_KETO_7_DIAS_GRATIS.pdf';
const BUCKET_NAME = 'producto';

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

    // Mark token as used BEFORE downloading (prevent race conditions)
    const { error: updateError } = await supabaseAdmin
      .from('download_tokens')
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', downloadToken.id);

    if (updateError) {
      console.error('Error marking token as used:', updateError);
      return NextResponse.json(
        { error: 'Error al procesar la descarga' },
        { status: 500 }
      );
    }

    console.log(`Download token used: ${token} for email: ${downloadToken.email}`);

    // Download file from Supabase Storage (usando service role - acceso privado)
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(PDF_FILE_NAME);

    if (downloadError || !fileData) {
      console.error('Error downloading file from Supabase:', downloadError);
      // Revert the token usage if download fails
      await supabaseAdmin
        .from('download_tokens')
        .update({ used: false, used_at: null })
        .eq('id', downloadToken.id);

      return NextResponse.json(
        { error: 'Error al descargar el archivo' },
        { status: 500 }
      );
    }

    // Serve the file directly to the user
    const arrayBuffer = await fileData.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${PDF_FILE_NAME}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Error processing download:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
