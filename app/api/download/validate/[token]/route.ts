import { NextRequest, NextResponse } from 'next/server';
import { getDownloadLink, isDownloadUsable } from '@/lib/downloads/magic-link';

export const runtime = 'nodejs';

// Validación de solo lectura del enlace del libro de pago (no incrementa).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const link = await getDownloadLink(token);
    if (!link) {
      return NextResponse.json(
        { valid: false, error: 'Enlace de descarga no encontrado' },
        { status: 404 }
      );
    }

    const usable = isDownloadUsable(link);
    if (!usable.ok) {
      return NextResponse.json(
        {
          valid: false,
          error:
            usable.reason === 'expired'
              ? 'El enlace de descarga ha expirado'
              : 'Límite de descargas alcanzado',
        },
        { status: usable.reason === 'expired' ? 410 : 403 }
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
