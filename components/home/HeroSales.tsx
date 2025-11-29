'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star, TrendingDown, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import StripeCheckout from '@/components/checkout/StripeCheckout';

interface PriceSettings {
  regularPrice: number;
  discountPrice: number;
  discountPercentage: number;
}

export default function HeroSales() {
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
    <section className="relative bg-gradient-to-br from-emerald-50 via-white to-green-50 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-emerald-100/30 bg-[size:32px_32px]" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <Image
            src="/LOGO.png"
            alt="Planeta Keto"
            width={200}
            height={80}
            className="h-16 w-auto"
            priority
          />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left Column - Sales Copy */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold mb-6 shadow-sm">
              <Star className="w-4 h-4 mr-2 fill-emerald-600" />
              Método Comprobado - Más de 5 Años de Éxito
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              ¡Recetas Keto para <span className="text-emerald-600">todos</span>!
            </h1>

            <p className="text-xl md:text-2xl text-gray-700 mb-6 font-medium">
              Transforma tu cuerpo y tu vida con nuestras recetas keto deliciosas y fáciles de seguir
            </p>

            <p className="text-lg text-gray-600 mb-8">
              Acceso de por vida a herramientas que incluyen: seguimiento de progreso, calculadoras especializadas, listas de compras personalizadas y todo lo que necesitas para perder peso de forma cómoda y con tu presupuesto.
            </p>

            {/* Key Benefits */}
            <div className="grid gap-4 mb-8">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mt-1">
                  <TrendingDown className="w-4 h-4 text-white" />
                </div>
                <p className="text-gray-700 font-medium">Pierde hasta 20kg en 70 días sin pasar hambre</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mt-1">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <p className="text-gray-700 font-medium">Sin ejercicio requerido - Solo alimentación inteligente</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mt-1">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <p className="text-gray-700 font-medium">Método sostenible que puedes seguir de por vida</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <StripeCheckout className="group inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-full hover:from-emerald-700 hover:to-green-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105">
                ⚡ Comprar Ahora - {prices.discountPercentage}% OFF
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </StripeCheckout>
            </div>

            {/* Price */}
            <div className="mt-6 flex items-center justify-center lg:justify-start gap-4">
              <span className="text-3xl font-bold text-gray-900">€{prices.discountPrice.toFixed(2)}</span>
              <span className="text-2xl text-gray-400 line-through">€{prices.regularPrice.toFixed(2)}</span>
              <span className="px-3 py-1 bg-red-500 text-white font-bold rounded-full text-sm">
                -{prices.discountPercentage}%
              </span>
            </div>
          </motion.div>

          {/* Right Column - Transformation Images */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            {/* Transformation Card */}
            <div className="relative bg-white rounded-3xl shadow-2xl p-6 lg:p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  Mi Transformación Real
                </h3>
                <p className="text-gray-600 font-medium">
                  De 140kg a 74kg sin hacer ejercicio
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Before */}
                <div className="relative group">
                  <div className="absolute -top-3 -left-3 z-10 bg-red-500 text-white px-4 py-1 rounded-full font-bold text-sm shadow-lg">
                    ANTES
                  </div>
                  <div className="relative overflow-hidden rounded-2xl shadow-xl">
                    <Image
                      src="/before.jpg"
                      alt="Antes: 140kg"
                      width={400}
                      height={500}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-3xl font-bold text-red-600">140kg</p>
                    <p className="text-sm text-gray-600">Altura: 1.79m</p>
                    <p className="text-xs text-gray-500 mt-1">Sobrepeso severo</p>
                  </div>
                </div>

                {/* After */}
                <div className="relative group">
                  <div className="absolute -top-3 -right-3 z-10 bg-emerald-500 text-white px-4 py-1 rounded-full font-bold text-sm shadow-lg">
                    DESPUÉS
                  </div>
                  <div className="relative overflow-hidden rounded-2xl shadow-xl">
                    <Image
                      src="/after.jpg"
                      alt="Después: 74kg"
                      width={400}
                      height={500}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-3xl font-bold text-emerald-600">74kg</p>
                    <p className="text-sm text-gray-600">Altura: 1.79m</p>
                    <p className="text-xs text-gray-500 mt-1">Peso saludable</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-3xl lg:text-4xl font-bold text-emerald-600 mb-1">-66kg</p>
                  <p className="text-xs lg:text-sm text-gray-600 font-medium">Pérdida Total</p>
                </div>
                <div className="text-center border-x border-gray-200">
                  <p className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">0</p>
                  <p className="text-xs lg:text-sm text-gray-600 font-medium">Ejercicio</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl lg:text-4xl font-bold text-emerald-600 mb-1">5+</p>
                  <p className="text-xs lg:text-sm text-gray-600 font-medium">Años Keto</p>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="mt-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-gray-700">
                  ✨ Es para ti si quieres sentirte más ligera, con más energía y volver a mirarte al espejo con cariño 💫
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Book Product Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 max-w-5xl mx-auto"
        >
          <div className="bg-gradient-to-br from-white to-emerald-50 rounded-3xl shadow-2xl overflow-hidden border-2 border-emerald-100">
            <div className="grid lg:grid-cols-2 gap-8 items-center p-8 lg:p-12">
              {/* Book Image */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400 to-green-400 rounded-3xl blur-2xl opacity-30 animate-pulse" />
                <div className="relative">
                  <Image
                    src="/libro.png"
                    alt="Método Keto 70 Días"
                    width={500}
                    height={600}
                    className="w-full h-auto rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute -top-4 -right-4 bg-red-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-xl rotate-12">
                    -50% HOY
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div>
                <div className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-bold mb-4 shadow-lg">
                  💚 Método Keto 70 Días
                </div>

                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  Pierde 20KG en 70 Días
                </h2>

                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Es para ti si quieres sentirte más ligera, con más energía y volver a mirarte al espejo con cariño 💫
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <p className="text-gray-700">Recetas deliciosas y fáciles de preparar</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <p className="text-gray-700">Calculadoras y herramientas especializadas</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <p className="text-gray-700">Listas de compras personalizadas</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <p className="text-gray-700">Acceso de por vida a todo el contenido</p>
                  </div>
                </div>

                <div className="bg-emerald-50 rounded-2xl p-6 mb-6">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-4xl font-bold text-emerald-600">€{prices.discountPrice.toFixed(2)}</span>
                    <span className="text-2xl text-gray-400 line-through">€{prices.regularPrice.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    Oferta especial - ¡Solo por tiempo limitado!
                  </p>
                </div>

                <StripeCheckout className="block w-full text-center px-8 py-5 text-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-full hover:from-emerald-700 hover:to-green-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                  ⚡ Comprar Ahora
                </StripeCheckout>

                <p className="text-center text-sm text-gray-500 mt-4">
                  🔒 Pago seguro • Acceso inmediato • Garantía de satisfacción
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
