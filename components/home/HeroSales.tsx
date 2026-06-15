'use client';

import Image from 'next/image';
import { ArrowRight, Sparkles, TrendingDown, Leaf, ShieldCheck, Check } from 'lucide-react';
import CheckoutButton from '@/components/checkout/CheckoutButton';
import { useCheckoutRegion, regionDisplay } from '@/lib/hooks/useCheckoutRegion';

const heroBenefits = [
  { icon: TrendingDown, text: 'Pierde hasta 20 kg en 70 días sin pasar hambre' },
  { icon: Leaf, text: 'Sin ejercicio obligatorio: solo alimentación inteligente' },
  { icon: ShieldCheck, text: 'Método sostenible que puedes seguir de por vida' },
];

const bookFeatures = [
  'Recetas deliciosas y fáciles de preparar',
  'Calculadoras y herramientas especializadas',
  'Listas de compra personalizadas',
  'Acceso de por vida a todo el contenido',
];

export default function HeroSales() {
  const { region } = useCheckoutRegion();
  const p = regionDisplay(region);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-mint-pale/40 via-cream to-cream">
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-mint/20 blur-3xl animate-float-slow" />
      <div aria-hidden className="pointer-events-none absolute top-32 -right-24 h-96 w-96 rounded-full bg-cta/10 blur-3xl animate-float-slow" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center max-w-7xl mx-auto">
          {/* Copy */}
          <div className="text-center lg:text-left animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-mint-pale px-4 py-1.5 text-sm font-semibold text-forest-dark mb-6">
              <Sparkles className="h-4 w-4 text-forest" /> Método comprobado · +5 años de éxito
            </span>

            <h1 className="font-serif text-4xl md:text-5xl lg:text-[3.4rem] font-bold text-forest-dark leading-[1.1] mb-5">
              Pierde peso comiendo <span className="trazo-menta">rico</span>, sin pasar hambre
            </h1>

            <p className="text-lg md:text-xl text-gray-600 mb-7 max-w-xl mx-auto lg:mx-0">
              El Método Keto de 70 días con recetas, calculadoras y listas de compra. Todo lo que
              necesitas para transformar tu cuerpo, a tu ritmo y tu presupuesto.
            </p>

            <ul className="space-y-3.5 mb-8 max-w-xl mx-auto lg:mx-0 text-left">
              {heroBenefits.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-gray-700 font-medium">{text}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start">
              <CheckoutButton className="group inline-flex items-center justify-center gap-2 rounded-full bg-cta px-8 py-4 text-lg font-bold text-forest-dark shadow-cta transition-colors hover:bg-cta-dark hover:text-white cursor-pointer">
                Quiero mi método · -{p.percentage}%
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </CheckoutButton>

              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-bold text-forest-dark">{p.fmt(p.discount)}</span>
                <span className="text-xl text-gray-400 line-through">{p.fmt(p.regular)}</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-500 text-center lg:text-left">Pago único · Acceso inmediato por correo</p>
          </div>

          {/* Transformación */}
          <div className="relative animate-fade-in">
            <div className="relative bg-white rounded-4xl shadow-card p-5 sm:p-7 border border-forest/5">
              <div className="text-center mb-5">
                <h2 className="font-serif text-2xl font-bold text-forest-dark">Una transformación real</h2>
                <p className="text-gray-500 text-sm mt-1">De 140 kg a 74 kg, sin gimnasio</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { src: '/before.jpg', label: 'ANTES', kg: '140 kg', tone: 'bg-stone-500', kgColor: 'text-stone-600', note: 'Sobrepeso severo' },
                  { src: '/after.jpg', label: 'DESPUÉS', kg: '74 kg', tone: 'bg-forest', kgColor: 'text-forest', note: 'Peso saludable' },
                ].map((it) => (
                  <div key={it.label} className="relative">
                    <span className={`absolute -top-2.5 left-2 z-10 rounded-full ${it.tone} text-white px-3 py-0.5 text-xs font-bold shadow`}>{it.label}</span>
                    <div className="overflow-hidden rounded-2xl shadow-soft">
                      <Image src={it.src} alt={`${it.label}: ${it.kg}`} width={400} height={500} className="w-full h-auto object-cover" />
                    </div>
                    <div className="mt-2.5 text-center">
                      <p className={`text-2xl font-bold ${it.kgColor}`}>{it.kg}</p>
                      <p className="text-xs text-gray-500">{it.note}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-mint-pale/60 p-4 text-center">
                <div><p className="text-2xl font-bold text-forest">-66</p><p className="text-[11px] text-gray-600">kg perdidos</p></div>
                <div className="border-x border-forest/10"><p className="text-2xl font-bold text-forest-dark">0</p><p className="text-[11px] text-gray-600">ejercicio</p></div>
                <div><p className="text-2xl font-bold text-forest">5+</p><p className="text-[11px] text-gray-600">años keto</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* Producto: libro */}
        <div className="mt-16 lg:mt-24 max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center rounded-4xl bg-white border border-forest/5 shadow-card p-6 sm:p-10">
            <div className="relative">
              <div aria-hidden className="absolute -inset-3 rounded-4xl bg-mint/20 blur-2xl" />
              <Image src="/libro.png" alt="Método Keto 70 Días" width={500} height={600} className="relative w-full h-auto rounded-2xl shadow-card" />
              <span className="absolute -top-3 -right-2 rounded-full bg-cta px-4 py-2 text-sm font-bold text-forest-dark shadow-cta -rotate-6">-{p.percentage}% hoy</span>
            </div>

            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-1.5 text-xs font-bold text-white mb-4">
                <Leaf className="h-3.5 w-3.5" /> Método Keto · 70 Días
              </span>
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-forest-dark mb-3">Pierde 20 kg en 70 días</h2>
              <p className="text-gray-600 mb-6">
                Para ti si quieres sentirte más ligera, con más energía y volver a mirarte al espejo con cariño.
              </p>
              <ul className="space-y-3 mb-7">
                {bookFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint text-forest-dark"><Check className="h-3.5 w-3.5" /></span>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-4xl font-bold text-forest-dark">{p.fmt(p.discount)}</span>
                <span className="text-2xl text-gray-400 line-through">{p.fmt(p.regular)}</span>
              </div>
              <CheckoutButton className="block w-full text-center rounded-full bg-cta px-8 py-4 text-lg font-bold text-forest-dark shadow-cta transition-colors hover:bg-cta-dark hover:text-white cursor-pointer">
                Comprar ahora
              </CheckoutButton>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-gray-500">
                <ShieldCheck className="h-4 w-4 text-forest" /> Pago seguro · Acceso inmediato · Garantía
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
