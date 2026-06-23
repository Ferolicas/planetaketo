'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import catalog from '@/data/catalog.json';
import CheckoutButton from '@/components/checkout/CheckoutButton';

type Product = {
  id: string; slug: string; title: string; for: string;
  type: 'keto' | 'lowcarb' | 'lowcal'; kind: 'metodo' | 'recetario' | 'guia';
  price: number; regular: number;
};
type Bundle = { id: string; slug: string; title: string; includes: string[]; note?: string; price: number; regular: number };

const products = catalog.products as unknown as Product[];
const bundles = catalog.bundles as unknown as Bundle[];

const TESTIMONIALS = [
  { name: 'María José, 56', img: '/testimonios/m1.jpg', quote: 'Bajé 14 kg en dos meses sin pasar hambre. A mis 56 años me siento otra mujer.' },
  { name: 'Carmen, 54', img: '/testimonios/m2.jpg', quote: 'Las recetas son fáciles y hasta a mi marido le encantan. Por fin algo que sí puedo seguir.' },
  { name: 'Rosa, 58', img: '/testimonios/m3.jpg', quote: 'Pensé que a mi edad ya era tarde para mí. Mírame ahora. Lo recomiendo con los ojos cerrados.' },
];

const TYPE = {
  keto: { label: 'Keto', bg: 'bg-[#e9f1e6]', text: 'text-[#3d6b50]' },
  lowcarb: { label: 'Low Carb', bg: 'bg-[#f6ecd8]', text: 'text-[#9a7430]' },
  lowcal: { label: 'Low Cal', bg: 'bg-[#f6e4dc]', text: 'text-[#b25c3c]' },
} as const;

const pct = (p: number, r: number) => Math.round((1 - p / r) * 100);
const byId = (id: string) => products.find((p) => p.id === id);

// CTA verde de marca con efecto "push" suave (respira para llamar la atención).
const CTA =
  'cta-push inline-flex items-center justify-center gap-2 bg-[#2d4a3e] text-[#faf6ef] font-semibold rounded-xl hover:bg-[#22392e] cursor-pointer';

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0 mt-0.5 text-[#7a9b76]" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5 9.5 18 20 6" /></svg>
  );
}
function Arrow() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  );
}
function Stars() {
  return (
    <div className="flex gap-0.5 text-[#e8a93c]">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 20.5l1.4-6.8L2.2 9l6.9-.7z" /></svg>
      ))}
    </div>
  );
}

// Qué obtiene el cliente con cada producto (se lee en la propia tarjeta).
function content(p: Product): { headline: string; desc?: string; includes: string[] } {
  if (p.id === 'met-keto')
    return {
      headline: 'Pierde 20 kg en 70 días',
      desc: 'Para ti si quieres sentirte más ligera, con más energía y volver a mirarte al espejo con cariño.',
      includes: ['Recetas deliciosas y fáciles de preparar', 'Calculadoras y herramientas especializadas', 'Listas de compra personalizadas', 'Acceso de por vida a todo el contenido'],
    };
  if (p.id === 'rec-keto')
    return {
      headline: '64 recetas keto reales con foto',
      desc: 'Las recetas que más me piden, todas a mano y listas para cocinar desde el móvil.',
      includes: ['64 recetas con foto, macros y pasos', 'Desayunos, comidas, cenas, snacks y postres', 'Sin azúcar ni harinas refinadas', 'Acceso de por vida'],
    };
  if (p.kind === 'metodo')
    return { headline: p.for, includes: ['70 días de menús día a día', 'Teoría + 4 fases', 'Listas de compra', 'Acceso de por vida'] };
  if (p.kind === 'guia')
    return { headline: p.for, includes: ['Basado en evidencia', 'Qué sí y qué no', 'Tablas resumen', 'Acceso de por vida'] };
  return { headline: p.for, includes: ['Recetas con foto y macros', 'Paso a paso, fácil', 'Optimizado para el móvil', 'Acceso de por vida'] };
}

// Contador animado: cuenta de 0 al valor cuando entra en viewport (easeOutCubic).
// Acepta '-66', '0', '5+' → conserva signo y sufijo. Respeta prefers-reduced-motion.
function CountUp({ value, className }: { value: string; className?: string }) {
  const m = value.match(/^(-?)(\d+)(\D*)$/);
  const sign = m?.[1] ?? '';
  const target = m ? parseInt(m[2], 10) : 0;
  const suffix = m?.[3] ?? '';
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || target === 0) { setN(target); return; }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && !done.current) {
          done.current = true;
          const dur = 1100;
          const t0 = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - t0) / dur);
            setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      }
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [target]);
  return <span ref={ref} className={className}>{sign}{n}{suffix}</span>;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 mt-3">
      {items.map((b) => (
        <li key={b} className="flex items-start gap-2 text-[#3a4236] text-[14px]">
          <Check /><span>{b}</span>
        </li>
      ))}
    </ul>
  );
}

function PriceRow({ price, regular }: { price: number; regular: number }) {
  return (
    <div className="flex items-baseline gap-2.5 font-sans">
      <span className="text-[#2d4a3e] font-extrabold text-[30px] leading-none tracking-[-0.01em]">{price}€</span>
      <span className="text-[#9aa39a] line-through text-lg">{regular}€</span>
      <span className="text-[#c97b5a] font-bold text-xs bg-[#f6e4dc] rounded-full px-2 py-0.5">-{pct(price, regular)}%</span>
    </div>
  );
}

function ProductCard({ p, featured = false }: { p: Product; featured?: boolean }) {
  const t = TYPE[p.type];
  const c = content(p);
  return (
    <div className={`group bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(45,74,62,.10)] flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_40px_rgba(45,74,62,.20)] ${featured ? 'ring-2 ring-[#d4a574]' : ''}`}>
      <div className="relative aspect-[3/4] bg-[#1d2a22] overflow-hidden">
        <Image src={`/catalog/${p.id}.jpg`} alt={p.title} fill sizes="(max-width:768px) 100vw, 420px" className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-110" />
        <span className={`absolute top-2.5 left-2.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full px-2.5 py-1 ${t.bg} ${t.text}`}>{t.label}</span>
        {featured && <span className="absolute top-2.5 right-2.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full px-2.5 py-1 bg-[#d4a574] text-white">Más vendido</span>}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-sans font-extrabold text-[#2d4a3e] text-xl leading-tight tracking-[-0.01em]">{p.title}</h3>
        <p className="text-[#b8895a] font-bold text-[15px] mt-1">{c.headline}</p>
        {c.desc && <p className="text-[#5d6b5a] text-[14px] mt-2 leading-snug">{c.desc}</p>}
        <Bullets items={c.includes} />
        <div className="mt-4 flex items-center justify-between gap-2">
          <PriceRow price={p.price} regular={p.regular} />
          <span className="text-[#7a9b76] text-[11px] font-bold uppercase tracking-wide bg-[#eef3ec] rounded-full px-2.5 py-1">Oferta de lanzamiento</span>
        </div>
        <CheckoutButton
          productSlug={p.slug}
          cta={`comprar:${p.slug}`}
          className={`mt-4 w-full py-3.5 text-[15px] ${CTA}`}
        >
          Lo quiero · {p.price}€ <Arrow />
        </CheckoutButton>
        <p className="text-center text-[#8a7c63] text-[11px] mt-2.5">Descarga inmediata · pago único · acceso de por vida</p>
      </div>
    </div>
  );
}

export default function Landing() {
  const [kind, setKind] = useState<'todo' | 'metodo' | 'recetario' | 'guia'>('todo');
  const [type, setType] = useState<'todo' | 'keto' | 'lowcarb' | 'lowcal'>('todo');
  const shown = products.filter((p) => (kind === 'todo' || p.kind === kind) && (type === 'todo' || p.type === type));
  const featured = [byId('met-keto'), byId('rec-keto')].filter(Boolean) as Product[];

  const KIND_TABS: [typeof kind, string][] = [['todo', 'Todo'], ['metodo', 'Métodos'], ['recetario', 'Recetarios'], ['guia', 'Guías']];
  const TYPE_TABS: [typeof type, string][] = [['todo', 'Todos'], ['keto', 'Keto'], ['lowcarb', 'Low Carb'], ['lowcal', 'Low Cal']];

  return (
    <main className="bg-[#faf6ef] text-[#2c3028] pb-20 sm:pb-0">
      {/* 1 · HERO + TRANSFORMACIÓN — una sola sección verde */}
      <section data-section="hero" className="bg-[#2d4a3e] text-[#faf6ef] px-5 pt-12 pb-11">
        <div className="max-w-md mx-auto text-center">
          <span className="inline-block text-[12px] font-bold text-[#e8c074] bg-white/10 ring-1 ring-[#e8c074]/30 rounded-full px-4 py-1.5">Método comprobado · +5 años de éxito</span>
          <h1 className="font-sans font-extrabold text-[34px] leading-[1.08] tracking-[-0.015em] mt-5">Pierde peso comiendo rico, sin pasar hambre</h1>

          <p className="text-[#e8c074] font-bold uppercase tracking-wider text-sm mt-9">Una transformación real</p>
          <h2 className="font-sans font-extrabold text-[26px] leading-tight tracking-[-0.015em] mt-1">De 140 kg a 74 kg, sin gimnasio</h2>

          <div className="grid grid-cols-2 gap-3 mt-6 text-left">
            <div className="group bg-[#26412f] rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(0,0,0,.4)]">
              <div className="relative aspect-[3/4] overflow-hidden"><Image src="/before.jpg" alt="Antes: 140 kg" fill sizes="(max-width:768px) 50vw, 220px" className="object-cover transition-transform duration-500 ease-out group-hover:scale-110" /></div>
              <div className="p-4">
                <p className="text-[#a8b8a4] text-xs font-bold uppercase tracking-wider">Antes</p>
                <p className="font-extrabold text-3xl mt-1">140 kg</p>
                <p className="text-[#a8b8a4] text-sm mt-1">Sobrepeso severo</p>
              </div>
            </div>
            <div className="group bg-[#3a5d4a] rounded-2xl overflow-hidden ring-1 ring-[#e8c074]/40 transition-all duration-300 hover:-translate-y-1 hover:ring-[#e8c074]/80 hover:shadow-[0_14px_34px_rgba(0,0,0,.4)]">
              <div className="relative aspect-[3/4] overflow-hidden"><Image src="/after.jpg" alt="Después: 74 kg" fill sizes="(max-width:768px) 50vw, 220px" className="object-cover transition-transform duration-500 ease-out group-hover:scale-110" /></div>
              <div className="p-4">
                <p className="text-[#e8c074] text-xs font-bold uppercase tracking-wider">Después</p>
                <p className="font-extrabold text-3xl mt-1">74 kg</p>
                <p className="text-[#cfe0ca] text-sm mt-1">Peso saludable</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            {[['-66', 'kg perdidos'], ['0', 'ejercicio'], ['5+', 'años keto']].map(([n, l]) => (
              <div key={l} className="bg-[#26412f] rounded-xl py-4 transition-all duration-300 hover:-translate-y-1 hover:bg-[#2d4a3e] hover:shadow-[0_10px_24px_rgba(0,0,0,.3)]">
                <p className="font-extrabold text-2xl text-[#e8c074]"><CountUp value={n} /></p>
                <p className="text-[#a8b8a4] text-xs mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 · DESTACADOS (con el copy de "qué encuentras" dentro) */}
      <section id="destacados" data-section="precio" className="px-4 py-10 bg-[#f3ecdf]">
        <div className="max-w-md mx-auto sm:max-w-3xl">
          <p className="text-[#3a4236] text-[16px] leading-relaxed text-center mb-7">
            Cada mujer tiene su propio camino para sentirse bien en su cuerpo. Por eso aquí lo tienes todo: <strong className="text-[#2d4a3e]">métodos completos</strong>, <strong className="text-[#2d4a3e]">recetarios</strong> con foto y <strong className="text-[#2d4a3e]">guías</strong>, en <strong className="text-[#2d4a3e]">keto, low carb o bajo en calorías</strong>. Elige el tuyo y transfórmate a tu ritmo y a tu presupuesto.
          </p>
          <h2 className="font-serif font-extrabold text-[#2d4a3e] text-2xl text-center mb-1">Empieza por aquí</h2>
          <p className="text-center text-[#5d6b5a] text-sm mb-6">El método y el recetario, lo más vendido.</p>
          <div className="grid sm:grid-cols-2 gap-5">
            {featured.map((p) => <ProductCard key={p.id} p={p} featured />)}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS — prueba social */}
      <section className="px-4 py-11 max-w-md mx-auto">
        <div className="flex items-center justify-center gap-2"><Stars /><span className="text-[#5d6b5a] text-sm font-bold">4,9/5 · +5.000 mujeres</span></div>
        <h2 className="font-serif font-extrabold text-[#2d4a3e] text-2xl text-center mt-3 mb-6">Ya cambiaron su vida. Te toca a ti.</h2>
        <div className="space-y-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl p-5 shadow-[0_4px_18px_rgba(45,74,62,.10)] ring-1 ring-[#e3dccd]">
              <div className="flex items-center gap-3">
                <Image src={t.img} alt={t.name} width={56} height={56} className="w-14 h-14 rounded-full object-cover ring-2 ring-[#e8c074]/60 shrink-0" />
                <div>
                  <p className="font-bold text-[#2d4a3e]">{t.name}</p>
                  <Stars />
                </div>
              </div>
              <p className="text-[#3a4236] text-[14px] mt-3 leading-snug">&ldquo;{t.quote}&rdquo;</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5 · CATÁLOGO COMPLETO */}
      <section className="px-4 py-10 max-w-3xl mx-auto">
        <h2 className="font-serif font-extrabold text-[#2d4a3e] text-2xl text-center mb-1">Todo el catálogo</h2>
        <p className="text-center text-[#5d6b5a] text-sm mb-5">Elige tu camino: keto, low carb o bajo en calorías.</p>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 justify-start sm:justify-center">
          {KIND_TABS.map(([k, l]) => (
            <button key={k} onClick={() => setKind(k)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors ${kind === k ? 'bg-[#2d4a3e] text-[#faf6ef]' : 'bg-white text-[#5d6b5a] ring-1 ring-[#e3dccd]'}`}>{l}</button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 mt-2 -mx-1 px-1 justify-start sm:justify-center">
          {TYPE_TABS.map(([k, l]) => (
            <button key={k} onClick={() => setType(k)} className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${type === k ? 'bg-[#d4a574] text-white' : 'bg-[#f3ecdf] text-[#8a7c63]'}`}>{l}</button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-5 mt-6">
          {shown.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* 6 · BUNDLES */}
      <section className="px-4 py-10 bg-[#f3ecdf]">
        <div className="max-w-md mx-auto">
          <h2 className="font-serif font-extrabold text-[#2d4a3e] text-2xl text-center">Packs que ahorran más</h2>
          <p className="text-center text-[#5d6b5a] text-sm mt-1 mb-5">Llévate varios y paga menos.</p>
          <div className="space-y-3">
            {bundles.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl p-4 shadow-[0_4px_18px_rgba(45,74,62,.08)]">
                <h3 className="font-bold text-[#2d4a3e] text-[16px]">{b.title}</h3>
                {b.note && <p className="text-[#5d6b5a] text-[12px] mt-0.5">{b.note}</p>}
                <ul className="mt-2 mb-3 space-y-1 text-[13px] text-[#5d6b5a]">
                  {(b.includes[0] === 'ALL' ? ['Todo el catálogo'] : b.includes.map((id) => byId(id)?.title ?? id)).map((t) => (
                    <li key={t} className="flex items-start gap-1.5"><Check />{t}</li>
                  ))}
                </ul>
                <div className="flex items-center justify-between gap-3">
                  <PriceRow price={b.price} regular={b.regular} />
                  <CheckoutButton productSlug={b.slug} cta={`comprar:${b.slug}`} className={`px-5 py-3 text-sm whitespace-nowrap ${CTA}`}>Lo quiero <Arrow /></CheckoutButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7 · GARANTÍA + FAQ */}
      <section data-section="cta_final" className="px-5 py-10 max-w-md mx-auto">
        <div className="bg-[#2d4a3e] text-[#faf6ef] rounded-2xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#3a5d4a] mb-3">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#e8c074]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round"><path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3z" /><path d="M9 12l2 2 4-4" strokeLinecap="round" /></svg>
          </div>
          <p className="font-extrabold text-xl">Compra sin riesgo</p>
          <p className="text-[#cfe0ca] text-sm mt-2">Garantía de 7 días: si no es para ti, te devolvemos tu dinero. Sin preguntas.</p>
          <div className="grid grid-cols-3 gap-2 mt-5 text-[12px] font-bold text-[#e8c074]">
            <div className="bg-[#26412f] rounded-xl py-3">Pago seguro</div>
            <div className="bg-[#26412f] rounded-xl py-3">Entrega al instante</div>
            <div className="bg-[#26412f] rounded-xl py-3">Pago único</div>
          </div>
        </div>
        <h2 className="font-serif font-extrabold text-[#2d4a3e] text-2xl text-center mt-9 mb-4">Preguntas frecuentes</h2>
        <div className="space-y-2">
          {[
            ['¿Cómo recibo el libro?', 'Al instante por email, con un enlace de descarga en PDF tras tu compra.'],
            ['¿Es un pago único?', 'Sí. Pagas una vez y es tuyo para siempre.'],
            ['¿Sirve si soy principiante?', 'Totalmente. Está explicado paso a paso, día a día.'],
            ['¿En qué formato está?', 'PDF optimizado para el móvil: lo abres y lo usas desde el teléfono.'],
          ].map(([q, a]) => (
            <details key={q} className="bg-white rounded-xl p-4 ring-1 ring-[#e3dccd]">
              <summary className="font-bold text-[#2d4a3e] cursor-pointer list-none flex justify-between items-center">{q}<span className="text-[#d4a574]">+</span></summary>
              <p className="text-[#5d6b5a] text-sm mt-2">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="px-5 py-8 text-center text-[#8a7c63] text-sm border-t border-[#e3dccd]">
        <p className="font-bold text-[#2d4a3e]">Planeta Keto</p>
        <p className="mt-2">@planetaketo · planetaketo.es</p>
        <div className="mt-3 flex justify-center gap-4 text-[13px]">
          <a href="/privacidad" className="underline">Privacidad</a>
          <a href="/cookies" className="underline">Cookies</a>
          <a href="/aviso-legal" className="underline">Aviso legal</a>
        </div>
      </footer>

      {/* CTA fija en móvil — siempre a un toque de comprar */}
      <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-[#faf6ef]/95 backdrop-blur border-t border-[#e3dccd] px-4 py-3">
        <CheckoutButton productSlug="metodo-keto" cta="comprar:sticky" className={`w-full py-3.5 text-[15px] ${CTA}`}>Empieza hoy · Método Keto · 24€ <Arrow /></CheckoutButton>
      </div>
    </main>
  );
}
