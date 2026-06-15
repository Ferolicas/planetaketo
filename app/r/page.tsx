'use client';

import { useState } from 'react';
import { Check, Gift, Sparkles, Youtube } from 'lucide-react';
import LeadModal from '@/components/lead/LeadModal';
import CheckoutButton from '@/components/checkout/CheckoutButton';
import { useCheckoutRegion, regionDisplay } from '@/lib/hooks/useCheckoutRegion';

const freeFeatures = ['Menú completo de 7 días', 'Recetas paso a paso', 'Lista de compra incluida', 'Tips diarios por correo'];
const paidFeatures = [
  '70 días de menús completos',
  'Más de 100 recetas variadas',
  'Listas de compra semanales',
  'Plan de transición incluido',
  'Guía de errores comunes',
  'Pérdida promedio: 8-12 kg',
];

export default function RecursosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { region } = useCheckoutRegion();
  const p = regionDisplay(region);

  return (
    <div className="min-h-screen bg-gradient-to-b from-mint-pale/40 via-cream to-cream py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full bg-mint-pale px-4 py-1.5 text-sm font-semibold text-forest-dark mb-4">
            <Sparkles className="h-4 w-4 text-forest" /> Recursos Keto
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-forest-dark mb-3">
            Elige tu <span className="trazo-menta">plan keto</span>
          </h1>
          <p className="text-lg text-gray-600">Empieza gratis o ve directo al método completo de 70 días.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-7 mb-14">
          {/* Gratis */}
          <div className="flex flex-col rounded-4xl bg-white border border-forest/5 shadow-soft overflow-hidden">
            <div className="bg-mint-pale text-forest-dark text-center py-2.5 text-sm font-semibold">GRATIS</div>
            <div className="p-8 flex-1 flex flex-col">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-mint text-forest-dark">
                  <Gift className="h-7 w-7" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-forest-dark mb-2">Plan Keto de 7 Días</h2>
                <p className="text-gray-600">Perfecto para empezar tu viaje keto</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint text-forest-dark"><Check className="h-3.5 w-3.5" /></span>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full rounded-full bg-forest py-3.5 font-semibold text-white transition-colors hover:bg-forest-dark cursor-pointer"
              >
                Descargar gratis
              </button>
              <p className="text-center text-xs text-gray-500 mt-3">Sin tarjeta de crédito</p>
            </div>
          </div>

          {/* Pago */}
          <div className="relative flex flex-col rounded-4xl bg-gradient-to-br from-forest to-forest-dark shadow-card overflow-hidden text-white">
            <span className="absolute top-4 right-4 rounded-full bg-cta px-3 py-1 text-xs font-bold text-forest-dark">MÁS POPULAR</span>
            <div className="bg-white/10 text-center py-2.5 text-sm font-semibold">MÉTODO COMPLETO</div>
            <div className="p-8 flex-1 flex flex-col">
              <div className="mb-6 text-center">
                <h2 className="font-serif text-2xl font-bold mb-2">70 Días Estructurados</h2>
                <p className="text-mint-pale/90">Todo lo que necesitas para perder peso</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {paidFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint text-forest-dark"><Check className="h-3.5 w-3.5" /></span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="text-center mb-5">
                <div className="flex items-baseline justify-center gap-2.5">
                  <span className="text-4xl font-bold">{p.fmt(p.discount)}</span>
                  <span className="text-xl text-mint-pale/60 line-through">{p.fmt(p.regular)}</span>
                </div>
                <p className="text-mint-pale/80 text-sm mt-1">Pago único, sin suscripciones</p>
              </div>
              <CheckoutButton className="w-full rounded-full bg-cta py-4 text-lg font-bold text-forest-dark shadow-cta transition-colors hover:bg-white cursor-pointer">
                Comprar · {p.fmt(p.discount)}
              </CheckoutButton>
            </div>
          </div>
        </div>

        {/* Prueba social */}
        <div className="rounded-4xl bg-white border border-forest/5 shadow-soft p-8 mb-8">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div><p className="font-serif text-3xl font-bold text-forest mb-1">100+</p><p className="text-gray-600 text-sm">Recetas</p></div>
            <div className="border-x border-forest/10"><p className="font-serif text-3xl font-bold text-forest mb-1">10K+</p><p className="text-gray-600 text-sm">En YouTube</p></div>
            <div><p className="font-serif text-3xl font-bold text-forest mb-1">4.8★</p><p className="text-gray-600 text-sm">Valoración</p></div>
          </div>
        </div>

        <div className="text-center">
          <a
            href="https://youtube.com/@planetaketo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
          >
            <Youtube className="h-5 w-5" /> Visitar el canal de YouTube
          </a>
        </div>
      </div>

      <LeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
