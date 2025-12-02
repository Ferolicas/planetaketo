'use client';

import StripeCheckout from '@/components/checkout/StripeCheckout';
import { Heart, Trophy, Clock, Shield, Sparkles, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

const benefits = [
  {
    icon: Heart,
    title: 'Sin Pasar Hambre',
    description: 'Come delicioso mientras pierdes peso. Recetas diseñadas para que disfrutes cada comida sin privaciones.',
    color: 'from-red-500 to-pink-500',
  },
  {
    icon: Trophy,
    title: 'Resultados Comprobados',
    description: 'Más de 5 años de experiencia y resultados reales. Método probado que funciona de verdad.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Clock,
    title: 'Acceso de Por Vida',
    description: 'Paga una vez, accede para siempre. Todas las herramientas y actualizaciones sin costos adicionales.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Shield,
    title: 'Sin Ejercicio Obligatorio',
    description: 'Transforma tu cuerpo solo con alimentación inteligente. El ejercicio es opcional, no obligatorio.',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    icon: Sparkles,
    title: 'Más Energía',
    description: 'Siéntete ligera y llena de vitalidad. Despierta cada día con más ganas y mejor humor.',
    color: 'from-emerald-500 to-green-500',
  },
  {
    icon: TrendingDown,
    title: 'Método Sostenible',
    description: 'No es una dieta temporal, es un estilo de vida. Mantén tus resultados para siempre.',
    color: 'from-rose-500 to-red-500',
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-white to-emerald-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-bold mb-4">
            ✨ Por Qué Funciona
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Más que una Dieta,
            <span className="text-emerald-600"> un Estilo de Vida</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descubre por qué miles de personas han transformado sus vidas con Planeta Keto
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative h-full bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-emerald-200">
                {/* Icon */}
                <div className="mb-6">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${benefit.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <benefit.icon className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>

                {/* Decorative element */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${benefit.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-br from-emerald-600 to-green-600 rounded-3xl shadow-2xl p-12 max-w-4xl mx-auto">
            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              ¿Lista para Transformar tu Vida?
            </h3>
            <p className="text-xl text-emerald-100 mb-8">
              Únete a las miles de personas que ya han logrado sus objetivos con Planeta Keto
            </p>
            <StripeCheckout
              amount={10}
              currency="eur"
              productName="Método Keto 70 Días"
              className="inline-flex items-center px-10 py-5 text-xl font-bold text-emerald-600 bg-white rounded-full hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              ⚡ Comenzar Ahora - 50% OFF
            </StripeCheckout>
            <p className="text-emerald-100 text-sm mt-6">
              Oferta por tiempo limitado • Acceso inmediato
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
