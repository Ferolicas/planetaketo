import { NextRequest, NextResponse } from 'next/server';
import {
  getDownloadLink,
  incrementDownload,
  isDownloadUsable,
} from '@/lib/downloads/magic-link';
import { getPaidProduct, getProductBySlug, fetchSanityFile } from '@/lib/sanity';
import catalog from '@/data/catalog.json';

type Cat = { id: string; slug: string; title: string };
const cProducts = catalog.products as Cat[];
const cBundles = catalog.bundles as (Cat & { includes: string[] })[];
const bundleSlugs = (b: { includes: string[] }) =>
  b.includes[0] === 'ALL' ? cProducts.map((p) => p.slug) : b.includes.map((id) => cProducts.find((p) => p.id === id)?.slug).filter(Boolean) as string[];

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

    // BUNDLE: si el slug comprado es un pack del catálogo, entregamos varios PDFs.
    const bundle = link.product_slug ? cBundles.find((b) => b.slug === link.product_slug) : null;
    if (bundle) {
      const slugs = bundleSlugs(bundle);
      const bookSlug = request.nextUrl.searchParams.get('book');
      if (bookSlug && slugs.includes(bookSlug)) {
        const book = await getProductBySlug(bookSlug);
        if (!book?.pdfUrl) {
          return NextResponse.json({ error: 'Ese libro no está disponible' }, { status: 500 });
        }
        const buf = await fetchSanityFile(book.pdfUrl);
        await incrementDownload(link.id);
        return new NextResponse(buf, {
          status: 200,
          headers: {
            'Content-Type': book.mimeType || 'application/pdf',
            'Content-Disposition': `attachment; filename="${book.fileName || book.title + '.pdf'}"`,
            'Content-Length': buf.byteLength.toString(),
            'Cache-Control': 'no-store',
          },
        });
      }
      // Página de descargas del pack: un botón por libro incluido.
      const items = slugs.map((s) => cProducts.find((p) => p.slug === s)!).filter(Boolean);
      const rows = items.map((p) =>
        `<a class="b" href="/api/download/${token}?book=${p.slug}">⬇ ${p.title}</a>`).join('');
      const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tu pack · Planeta Keto</title>
<style>body{font-family:system-ui,sans-serif;background:#faf6ef;color:#2c3028;margin:0;padding:28px 18px;max-width:520px;margin:0 auto}h1{color:#2d4a3e;font-size:24px}p{color:#5d6b5a}.b{display:block;background:#2d4a3e;color:#faf6ef;text-decoration:none;font-weight:700;border-radius:12px;padding:15px 18px;margin:10px 0}</style></head>
<body><h1>🌿 Tu pack está listo</h1><p>Descarga cada libro incluido (puedes volver a este enlace durante 30 días):</p>${rows}<p style="font-size:13px;margin-top:20px">¿Problemas? Escríbenos a info@planetaketo.es</p></body></html>`;
      return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
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
