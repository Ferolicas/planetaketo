'use client';

import Image from 'next/image';
import { Star, Quote, Lock, Zap, Infinity as InfinityIcon, ShieldCheck } from 'lucide-react';
import Reveal from '@/components/Reveal';

const testimonials = [
  { name: 'María G.', weight: '-28 kg en 4 meses', photo: '/testimonios/t1.png', text: 'Nunca pensé que podría comer tan rico y bajar de peso. Las recetas son deliciosas y fáciles. ¡Me siento increíble!', rating: 5 },
  { name: 'Carmen R.', weight: '-15 kg en 2 meses', photo: '/testimonios/t2.png', text: 'Lo mejor es que no tengo que hacer ejercicio. Solo sigo las recetas y los resultados llegan solos.', rating: 5 },
  { name: 'Ana P.', weight: '-22 kg en 3 meses', photo: '/testimonios/t3.png', text: 'Tengo más energía que nunca. Me levanto con ganas y me veo al espejo con cariño. Cambió mi vida.', rating: 5 },
];

const stats = [
  { number: '66 kg', label: 'Pérdida del creador' },
  { number: '5+', label: 'Años de éxito' },
  { number: '0', label: 'Ejercicio necesario' },
  { number: '100%', label: 'Satisfacción' },
];

const trust = [
  { icon: Lock, label: 'Pago seguro' },
  { icon: Zap, label: 'Acceso inmediato' },
  { icon: InfinityIcon, label: 'Acceso de por vida' },
  { icon: ShieldCheck, label: 'Garantía total' },
];

export default function SocialProof() {
  return (
    <section data-section="testimonios" className="py-20 lg:py-28 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-20 rounded-4xl bg-gradient-to-br from-forest to-forest-dark shadow-card overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 p-8 lg:p-12">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 80} className="text-center">
                <div className="font-serif text-4xl lg:text-5xl font-bold text-white mb-1">{s.number}</div>
                <div className="text-mint-pale/80 font-medium text-sm">{s.label}</div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="text-center mb-14 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold text-amber-900 mb-4">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> Testimonios reales
          </span>
          <h2 className="font-serif text-3xl lg:text-5xl font-bold text-forest-dark mb-4">
            Historias de <span className="trazo-menta">transformación</span>
          </h2>
          <p className="text-lg text-gray-600">Lo que dicen personas reales que ya han cambiado su vida.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-7 max-w-6xl mx-auto mb-16">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 110} className="relative h-full rounded-3xl bg-cream p-8 shadow-soft border border-forest/5">
              <Quote className="absolute -top-3 left-6 h-9 w-9 rounded-full bg-forest p-2 text-white shadow" />
              <div className="flex gap-1 mb-4 mt-3">
                {Array.from({ length: t.rating }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <blockquote className="text-gray-700 italic mb-6 leading-relaxed">“{t.text}”</blockquote>
              <div className="flex items-center gap-3 pt-4 border-t border-forest/10">
                <Image src={t.photo} alt={t.name} width={48} height={48} className="h-12 w-12 rounded-full object-cover ring-2 ring-mint/40" />
                <div>
                  <p className="font-semibold text-forest-dark">{t.name}</p>
                  <p className="text-sm text-forest">{t.weight}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {trust.map(({ icon: Icon, label }, i) => (
            <Reveal key={label} delay={i * 70} className="flex flex-col items-center gap-2 rounded-2xl bg-mint-pale/40 p-6 text-center">
              <Icon className="h-6 w-6 text-forest" />
              <p className="text-sm font-semibold text-forest-dark">{label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
