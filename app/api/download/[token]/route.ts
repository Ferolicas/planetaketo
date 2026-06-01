import { NextRequest, NextResponse } from 'next/server';
import {
  getDownloadLink,
  incrementDownload,
  isDownloadUsable,
} from '@/lib/downloads/magic-link';
import { getPaidProduct, fetchSanityFile } from '@/lib/sanity';

export const runtime = 'nodejs';

// Descarga del libro de PAGO. Servido por proxy/stream desde Sanity
// (nunca se expone la URL del CDN). Token válido = pago confirmado.
// Límite de 2 descargas + expiración. Se incrementa solo si la entrega tuvo éxito.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const link = await getDownloadLink(token);
    if (!link) {
      return NextResponse.json(
        { error: 'Enlace de descarga no encontrado' },
        { status: 404 }
      );
    }

    const usable = isDownloadUsable(link);
    if (!usable.ok) {
      return NextResponse.json(
        {
          error:
            usable.reason === 'expired'
              ? 'El enlace de descarga ha expirado'
              : 'Límite de descargas alcanzado',
        },
        { status: usable.reason === 'expired' ? 410 : 403 }
      );
    }

    const product = await getPaidProduct();
    if (!product?.pdfUrl) {
      console.error('Producto de pago sin PDF en Sanity');
      return NextResponse.json(
        { error: 'El libro no está disponible en este momento' },
        { status: 500 }
      );
    }

    // Descargamos el asset; solo si llega bien incrementamos el contador.
    const buffer = await fetchSanityFile(product.pdfUrl);
    await incrementDownload(link.id);

    const fileName =
      product.fileName || link.file_name || 'Metodo Keto Definitivo - Planeta Keto.pdf';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': product.mimeType || 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la descarga' },
      { status: 500 }
    );
  }
}
