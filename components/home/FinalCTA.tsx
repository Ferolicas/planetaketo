'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import StripeCheckout from '@/components/checkout/StripeCheckout';

interface PriceSettings {
  regularPrice: number;
  discountPrice: number;
  discountPercentage: number;
}

const features = [
  'Recetas keto deliciosas y fáciles de seguir',
  'Calculadoras de macros personalizadas',
  'Listas de compras inteligentes',
  'Seguimiento de progreso detallado',
  'Acceso de por vida sin costos adicionales',
  'Actualizaciones y nuevo contenido gratis',
];

export default function FinalCTA() {
  const [prices, setPrices] = useState<PriceSettings>({
    regularPrice: 39.75,
    discountPrice: 19.75,
    discountPercentage: 50,
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setPrices(data))
      .catch(err => console.error('Error fetching prices:', err));
  }, []);

  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700" />
      <div className="absolute inset-0 bg-grid-white/10 bg-[size:32px_32px]" />

      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-400/20 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-bold mb-6 shadow-lg">
              ⚡ Oferta Especial - Solo Por Tiempo Limitado
            </div>

            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Comienza Tu Transformación
              <br />
              <span className="text-emerald-200">Hoy Mismo</span>
            </h2>

            <p className="text-xl lg:text-2xl text-emerald-100 mb-4 font-medium">
              Únete a miles de personas que ya han transformado sus vidas
            </p>

            <p className="text-lg text-emerald-200 max-w-2xl mx-auto">
              Paga una vez, accede para siempre. Sin suscripciones, sin costos ocultos.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-4 mb-12 max-w-3xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start space-x-3 bg-white/10 backdrop-blur-sm rounded-xl p-4"
              >
                <CheckCircle2 className="w-6 h-6 text-emerald-300 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">{feature}</span>
              </motion.div>
            ))}
          </div>

          {/* Price Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 mb-8"
          >
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center gap-4 mb-4">
                  <span className="text-5xl lg:text-6xl font-bold text-emerald-600">€{prices.discountPrice.toFixed(2)}</span>
                  <span className="text-3xl lg:text-4xl text-gray-400 line-through">€{prices.regularPrice.toFixed(2)}</span>
                </div>
                <div className="inline-flex items-center px-6 py-2 bg-red-500 text-white rounded-full font-bold text-lg shadow-lg">
                  ¡Ahorra {prices.discountPercentage}% HOY!
                </div>
              </div>

              <p className="text-gray-600 text-lg mb-8">
                Pago único • Acceso de por vida • Sin costos adicionales
              </p>

              <StripeCheckout className="group inline-flex items-center justify-center px-12 py-6 text-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-full hover:from-emerald-700 hover:to-green-700 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-105 mb-6 w-full sm:w-auto">
                ⚡ Sí, Quiero Transformarme Ahora
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </StripeCheckout>

              <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Pago seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Acceso inmediato</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Garantía total</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Final Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center"
          >
            <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
              No esperes más para sentirte ligera, con energía y volver a mirarte al espejo con cariño.
              <span className="font-bold text-white"> Tu transformación comienza hoy. 💫</span>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
