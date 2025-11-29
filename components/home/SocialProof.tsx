'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'María G.',
    weight: '-28kg en 4 meses',
    text: 'Nunca pensé que podría comer tan rico y bajar de peso. Las recetas son deliciosas y fáciles de hacer. ¡Me siento increíble!',
    rating: 5,
  },
  {
    name: 'Carmen R.',
    weight: '-15kg en 2 meses',
    text: 'Lo mejor es que no tengo que hacer ejercicio. Solo sigo las recetas y los resultados llegan solos. Mis amigas me preguntan cuál es mi secreto.',
    rating: 5,
  },
  {
    name: 'Ana P.',
    weight: '-22kg en 3 meses',
    text: 'Tengo más energía que nunca. Me levanto con ganas y me veo al espejo con cariño. Esto ha cambiado mi vida completamente.',
    rating: 5,
  },
];

const stats = [
  { number: '66kg', label: 'Pérdida del Creador' },
  { number: '5+', label: 'Años de Éxito' },
  { number: '0', label: 'Ejercicio Necesario' },
  { number: '100%', label: 'Satisfacción' },
];

export default function SocialProof() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="bg-gradient-to-br from-emerald-600 to-green-600 rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 p-8 lg:p-12">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl lg:text-5xl font-bold text-white mb-2">
                    {stat.number}
                  </div>
                  <div className="text-emerald-100 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold mb-4">
            ⭐ Testimonios Reales
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Historias de <span className="text-emerald-600">Transformación</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Lee lo que dicen personas reales que han transformado sus vidas con Planeta Keto
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative h-full bg-gradient-to-br from-white to-emerald-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-emerald-100">
                {/* Quote Icon */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <Quote className="w-6 h-6 text-white" />
                </div>

                {/* Stars */}
                <div className="flex gap-1 mb-4 mt-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  &ldquo;{testimonial.text}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center justify-between pt-4 border-t border-emerald-200">
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-emerald-600 font-semibold">{testimonial.weight}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-400 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    ✓
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto"
        >
          <div className="flex flex-col items-center p-6 bg-gray-50 rounded-xl">
            <div className="text-3xl mb-2">🔒</div>
            <p className="text-sm font-semibold text-gray-700 text-center">Pago Seguro</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-gray-50 rounded-xl">
            <div className="text-3xl mb-2">⚡</div>
            <p className="text-sm font-semibold text-gray-700 text-center">Acceso Inmediato</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-gray-50 rounded-xl">
            <div className="text-3xl mb-2">♾️</div>
            <p className="text-sm font-semibold text-gray-700 text-center">Acceso de Por Vida</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-gray-50 rounded-xl">
            <div className="text-3xl mb-2">✨</div>
            <p className="text-sm font-semibold text-gray-700 text-center">Garantía Total</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
