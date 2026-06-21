'use client';

import { ArrowRight, Check } from 'lucide-react';
import CheckoutButton from '@/components/checkout/CheckoutButton';
import Reveal from '@/components/Reveal';
import { useCheckoutRegion, regionDisplay } from '@/lib/hooks/useCheckoutRegion';

const features = [
  'Recetas keto deliciosas y fáciles de seguir',
  'Calculadoras de macros personalizadas',
  'Listas de compra inteligentes',
  'Seguimiento de progreso detallado',
  'Acceso de por vida sin costes adicionales',
  'Actualizaciones y contenido nuevo gratis',
];

export default function FinalCTA() {
  const { region } = useCheckoutRegion();
  const p = regionDisplay(region);

  return (
    <section data-section="cta_final" className="relative py-20 lg:py-28 bg-gradient-to-br from-forest to-forest-dark overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-20 right-0 h-80 w-80 rounded-full bg-mint/10 blur-3xl" />
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="text-center mb-12">
          <span className="inline-flex items-center rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white mb-6">
            Oferta especial · por tiempo limitado
          </span>
          <h2 className="font-serif text-4xl lg:text-6xl font-bold text-white mb-5 leading-tight">
            Empieza tu transformación <span className="text-mint-soft">hoy mismo</span>
          </h2>
          <p className="text-lg text-mint-pale/90 max-w-2xl mx-auto">
            Pago único, acceso para siempre. Sin suscripciones ni costes ocultos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-12 max-w-3xl mx-auto">
          {features.map((f, i) => (
            <Reveal key={f} delay={i * 60} className="flex items-start gap-3 rounded-2xl bg-white/10 p-4">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint text-forest-dark">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span className="text-white font-medium">{f}</span>
            </Reveal>
          ))}
        </div>

        <Reveal className="rounded-4xl bg-cream p-8 lg:p-12 text-center shadow-card">
          <div className="flex items-baseline justify-center gap-3 mb-3">
            <span className="text-5xl lg:text-6xl font-bold text-forest-dark">{p.fmt(p.discount)}</span>
            <span className="text-3xl text-gray-400 line-through">{p.fmt(p.regular)}</span>
          </div>
          <span className="inline-flex items-center rounded-full bg-cta px-5 py-1.5 text-sm font-bold text-forest-dark mb-7">
            Ahorra {p.percentage}% hoy
          </span>
          <CheckoutButton cta="si_quiero_transformarme" className="group mx-auto flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-cta px-12 py-5 text-xl font-bold text-forest-dark shadow-cta transition-colors hover:bg-cta-dark hover:text-white cursor-pointer">
            Sí, quiero transformarme
            <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1.5" />
          </CheckoutButton>
          <p className="mt-5 text-sm text-gray-500">Pago seguro · Acceso inmediato · Garantía de satisfacción</p>
        </Reveal>
      </div>
    </section>
  );
}
