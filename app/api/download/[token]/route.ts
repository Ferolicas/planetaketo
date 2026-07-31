import { NextRequest, NextResponse } from 'next/server';
import {
  claimDownload,
  getDownloadLink,
  isDownloadUsable,
} from '@/lib/downloads/magic-link';
import {
  fetchSanityFile,
  getBundleArchiveBySlug,
  getPaidProduct,
  getProductBySlug,
} from '@/lib/sanity';
import catalog from '@/data/catalog.json';

type Cat = { id: string; slug: string; title: string };
const cBundles = catalog.bundles as (Cat & { includes: string[] })[];
export const runtime = 'nodejs';

function contentDisposition(fileName: string): string {
  const clean = fileName.replace(/[\r\n"]/g, '').replace(/[\\/]/g, '-');
  const ascii = clean.normalize('NFKD').replace(/[^\x20-\x7E]/g, '') || 'descarga';
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(clean)}`;
}

async function claimOrLimit(linkId: string): Promise<NextResponse | null> {
  if (await claimDownload(linkId)) return null;
  return NextResponse.json({ error: 'Límite de descargas alcanzado o enlace expirado' }, { status: 403 });
}

// Descarga del libro de PAGO. Servido por proxy/stream desde Sanity
// (nunca se expone la URL del CDN). Token válido = pago confirmado.
// Límite de 2 descargas + expiración. Se incrementa solo si la entrega tuvo éxito.
export async function GET(
  _request: NextRequest,
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

    // BUNDLE: una descarga = un ZIP completo. Así el pack, incluido el Mega Pack,
    // obedece exactamente el mismo máximo de 2 descargas que un libro individual.
    const bundle = link.product_slug ? cBundles.find((b) => b.slug === link.product_slug) : null;
    if (bundle) {
      const archive = await getBundleArchiveBySlug(bundle.slug);
      if (!archive?.fileUrl) {
        console.error(`[download] pack sin ZIP en Sanity: ${bundle.slug}`);
        return NextResponse.json({ error: 'El pack no está disponible en este momento' }, { status: 500 });
      }
      const buffer = await fetchSanityFile(archive.fileUrl);
      const rejected = await claimOrLimit(link.id);
      if (rejected) return rejected;
      const fileName = archive.fileName || `${bundle.slug}.zip`;
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': archive.mimeType || 'application/zip',
          'Content-Disposition': contentDisposition(fileName),
          'Content-Length': buffer.byteLength.toString(),
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    // Producto que el cliente compró: si el enlace tiene product_slug, ese; si no
    // (compras keto antiguas, sin slug), el MÉTODO KETO por su slug estable
    // ('metodo-keto'), NUNCA "el de mayor precio" — así subir productos más caros
    // no secuestra las descargas antiguas. getPaidProduct queda como último recurso.
    const product = link.product_slug
      ? await getProductBySlug(link.product_slug)
      : ((await getProductBySlug('metodo-keto')) ?? (await getPaidProduct()));
    if (!product?.pdfUrl) {
      console.error('Producto de pago sin PDF en Sanity');
      return NextResponse.json(
        { error: 'El libro no está disponible en este momento' },
        { status: 500 }
      );
    }

    // Descargamos el asset; solo si llega bien incrementamos el contador.
    const buffer = await fetchSanityFile(product.pdfUrl);
    const rejected = await claimOrLimit(link.id);
    if (rejected) return rejected;

    const fileName =
      product.fileName || link.file_name || 'Metodo Keto Definitivo - Planeta Keto.pdf';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': product.mimeType || 'application/pdf',
        'Content-Disposition': contentDisposition(fileName),
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
