import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getFreeProduct, fetchSanityFile } from '@/lib/sanity';

export const runtime = 'nodejs';

interface DownloadToken {
  id: string;
  token: string;
  email: string;
  used: boolean;
  used_at: string | null;
  expires_at: string;
}

// Descarga del lead magnet (PDF GRATIS) — se sirve por proxy desde Sanity.
// Token de un solo uso + expiración (tabla download_tokens, pg).
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }

    const dt = await queryOne<DownloadToken>(
      `SELECT id, token, email, used, used_at, expires_at
       FROM download_tokens WHERE token = $1`,
      [token]
    );

    if (!dt) {
      return NextResponse.json(
        { error: 'Link no válido o expirado' },
        { status: 404 }
      );
    }

    if (dt.used) {
      return NextResponse.json(
        {
          error: 'Este link ya fue utilizado',
          message:
            'Cada link de descarga solo puede usarse una vez. Si necesitas descargar de nuevo, contacta con nosotros.',
        },
        { status: 410 }
      );
    }

    if (new Date() > new Date(dt.expires_at)) {
      return NextResponse.json(
        {
          error: 'Link expirado',
          message: 'Este link ha expirado. Los links de descarga son válidos por 7 días.',
        },
        { status: 410 }
      );
    }

    // Marcar como usado ANTES de descargar (evita doble uso por carrera)
    await query(
      `UPDATE download_tokens SET used = true, used_at = now() WHERE id = $1`,
      [dt.id]
    );

    try {
      const product = await getFreeProduct();
      if (!product?.pdfUrl) {
        throw new Error('Producto gratis sin PDF en Sanity');
      }

      const buffer = await fetchSanityFile(product.pdfUrl);
      const fileName = product.fileName || 'PLANIFICADOR_KETO_7_DIAS_GRATIS.pdf';

      console.log(`Lead magnet entregado a: ${dt.email}`);

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': product.mimeType || 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': buffer.byteLength.toString(),
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    } catch (fileError) {
      // Revertir el uso del token si falla la descarga del archivo
      console.error('Error obteniendo el PDF de Sanity:', fileError);
      await query(
        `UPDATE download_tokens SET used = false, used_at = null WHERE id = $1`,
        [dt.id]
      );
      return NextResponse.json(
        { error: 'Error al descargar el archivo' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing download:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
