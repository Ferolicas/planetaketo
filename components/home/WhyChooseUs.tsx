'use client';

import CheckoutButton from '@/components/checkout/CheckoutButton';
import Reveal from '@/components/Reveal';
import { Heart, Trophy, Clock, Leaf, Sparkles, TrendingDown } from 'lucide-react';

const benefits = [
  { icon: Heart, title: 'Sin pasar hambre', description: 'Come delicioso mientras pierdes peso. Recetas pensadas para disfrutar cada comida sin privaciones.' },
  { icon: Trophy, title: 'Resultados comprobados', description: 'Más de 5 años de experiencia y resultados reales. Un método probado que funciona de verdad.' },
  { icon: Clock, title: 'Acceso de por vida', description: 'Paga una vez, accede para siempre. Todas las herramientas y actualizaciones sin costes extra.' },
  { icon: Leaf, title: 'Sin ejercicio obligatorio', description: 'Transforma tu cuerpo solo con alimentación inteligente. El ejercicio es opcional, no obligatorio.' },
  { icon: Sparkles, title: 'Más energía', description: 'Siéntete ligera y llena de vitalidad. Despierta cada día con más ganas y mejor humor.' },
  { icon: TrendingDown, title: 'Método sostenible', description: 'No es una dieta temporal, es un estilo de vida. Mantén tus resultados para siempre.' },
];

export default function WhyChooseUs() {
  return (
    <section data-section="por_que" className="py-20 lg:py-28 bg-cream">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <span className="inline-flex items-center rounded-full bg-mint-pale px-4 py-1.5 text-sm font-semibold text-forest-dark mb-4">
            Por qué funciona
          </span>
          <h2 className="font-serif text-3xl lg:text-5xl font-bold text-forest-dark mb-4">
            Más que una dieta, un <span className="trazo-menta">estilo de vida</span>
          </h2>
          <p className="text-lg text-gray-600">
            Miles de personas han transformado su vida con Planeta Keto. Esto es lo que lo hace distinto.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map(({ icon: Icon, title, description }, i) => (
            <Reveal
              key={title}
              delay={i * 70}
              className="group h-full rounded-3xl bg-white p-7 shadow-soft border border-forest/5 transition-shadow hover:shadow-card"
            >
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-forest text-white transition-colors group-hover:bg-cta group-hover:text-forest-dark">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-forest-dark mb-2">{title}</h3>
              <p className="text-gray-600 leading-relaxed">{description}</p>
            </Reveal>
          ))}
        </div>

        <div className="mt-14 rounded-4xl bg-gradient-to-br from-forest to-forest-dark p-10 lg:p-14 text-center max-w-4xl mx-auto shadow-card">
          <h3 className="font-serif text-2xl lg:text-3xl font-bold text-white mb-3">¿Lista para transformar tu vida?</h3>
          <p className="text-mint-pale/90 mb-7 max-w-xl mx-auto">
            Únete a las miles de personas que ya han logrado sus objetivos con Planeta Keto.
          </p>
          <CheckoutButton cta="empezar_ahora" className="inline-flex items-center rounded-full bg-cta px-9 py-4 text-lg font-bold text-forest-dark shadow-cta transition-colors hover:bg-white cursor-pointer">
            Empezar ahora
          </CheckoutButton>
        </div>
      </div>
    </section>
  );
}
