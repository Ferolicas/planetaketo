import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Get download link
    const { data: link, error } = await supabaseAdmin
      .from('download_links')
      .select('*, customers(name, email)')
      .eq('token', token)
      .single();

    if (error || !link) {
      return NextResponse.json(
        { valid: false, error: 'Enlace de descarga no encontrado' },
        { status: 404 }
      );
    }

    // Check if download limit reached
    if (link.download_count >= link.max_downloads) {
      return NextResponse.json(
        { valid: false, error: 'Límite de descargas alcanzado' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      valid: true,
      remainingDownloads: link.max_downloads - link.download_count,
      downloadUrl: `/api/download/${token}`,
    });
  } catch (error) {
    console.error('Validate token error:', error);
    return NextResponse.json(
      { valid: false, error: 'Error al validar el enlace' },
      { status: 500 }
    );
  }
}
