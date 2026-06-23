import Image from 'next/image';
import { notFound } from 'next/navigation';
import catalog from '@/data/catalog.json';
import CheckoutButton from '@/components/checkout/CheckoutButton';

type Item = {
  id: string; slug: string; title: string; price: number; regular: number;
  for?: string; type?: string; kind?: string; includes?: string[]; note?: string;
};

const products = catalog.products as Item[];
const bundles = catalog.bundles as Item[];

export function generateStaticParams() {
  return [...products, ...bundles].map((p) => ({ slug: p.slug }));
}

const pct = (p: number, r: number) => Math.round((1 - p / r) * 100);
const titleById = (id: string) =>
  products.find((p) => p.id === id)?.title ?? bundles.find((b) => b.id === id)?.title ?? id;

export default async function ComprarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item =
    products.find((p) => p.slug === slug) ?? bundles.find((b) => b.slug === slug) ?? null;
  if (!item) notFound();

  const isBundle = Boolean(item.includes);
  const includedTitles = isBundle
    ? (item.includes![0] === 'ALL' ? ['Todo el catálogo'] : item.includes!.map(titleById))
    : [];

  return (
    <main className="min-h-screen bg-[#faf6ef] text-[#2c3028] px-5 py-10">
      <div className="max-w-md mx-auto">
        <a href="/catalogo" className="text-[#7a9b76] text-sm font-semibold">← Volver al catálogo</a>

        <div className="mt-5 bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(45,74,62,.12)]">
          {!isBundle && (
            <div className="relative aspect-[9/16] max-h-[52vh] bg-[#1d2a22]">
              <Image src={`/catalog/${item.id}.jpg`} alt={item.title} fill sizes="(max-width:768px) 100vw, 400px" className="object-contain" priority />
            </div>
          )}
          <div className="p-6">
            <h1 className="font-extrabold text-[#2d4a3e] text-2xl leading-tight">{item.title}</h1>
            {item.for && <p className="text-[#5d6b5a] mt-2">{item.for}</p>}
            {item.note && <p className="text-[#5d6b5a] mt-2">{item.note}</p>}

            {isBundle && (
              <ul className="mt-4 space-y-2">
                {includedTitles.map((t) => (
                  <li key={t} className="flex items-center gap-2 text-[#2d4a3e] font-semibold">
                    <span className="text-[#7a9b76]">✓</span> {t}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-[#2d4a3e] font-extrabold text-4xl">{item.price}€</span>
              <span className="text-[#9aa39a] line-through text-lg">{item.regular}€</span>
              <span className="text-[#c97b5a] font-bold text-sm bg-[#f6e4dc] rounded-full px-2.5 py-1">-{pct(item.price, item.regular)}%</span>
            </div>

            <CheckoutButton
              productSlug={item.slug}
              cta={`comprar:${item.slug}`}
              className="mt-6 w-full block text-center bg-[#2d4a3e] hover:bg-[#26412f] text-[#faf6ef] font-bold rounded-xl py-4 text-base transition-colors cursor-pointer"
            >
              Comprar ahora · {item.price}€
            </CheckoutButton>

            <p className="text-center text-[#8a7c63] text-xs mt-4">Pago seguro · Entrega inmediata por email · Pago único</p>
          </div>
        </div>
      </div>
    </main>
  );
}
