'use client';

import { useState } from 'react';
import Link from 'next/link';
import LeadModal from '@/components/lead/LeadModal';

export default function RecursosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            🥑 Recursos Keto de Planeta Keto
          </h1>
          <p className="text-xl text-gray-600">
            Elige el plan que mejor se adapte a ti
          </p>
        </div>

        {/* Two Options Container */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* FREE OPTION - Lead Magnet */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-green-200 hover:border-green-400 transition-all duration-300 flex flex-col">
            {/* Badge */}
            <div className="bg-green-100 text-green-800 text-center py-2 font-semibold text-sm">
              GRATIS
            </div>

            {/* Content */}
            <div className="p-8 flex-1 flex flex-col">
              <div className="mb-6">
                <div className="text-5xl mb-4 text-center">🎁</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                  Plan Keto de 7 Días
                </h2>
                <p className="text-gray-600 text-center mb-6">
                  Perfecto para empezar tu viaje keto
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8 flex-1">
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">Menú completo de 7 días</span>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">Recetas paso a paso</span>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">Lista de compras incluida</span>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">Tips diarios por email</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                DESCARGAR GRATIS
              </button>

              <p className="text-center text-xs text-gray-500 mt-4">
                Sin tarjeta de crédito requerida
              </p>
            </div>
          </div>

          {/* PAID OPTION - Full Method */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl shadow-xl overflow-hidden border-2 border-green-800 hover:shadow-2xl transition-all duration-300 flex flex-col relative">
            {/* Popular Badge */}
            <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
              MÁS POPULAR
            </div>

            {/* Badge */}
            <div className="bg-green-800 text-white text-center py-2 font-semibold text-sm">
              MÉTODO COMPLETO
            </div>

            {/* Content */}
            <div className="p-8 flex-1 flex flex-col text-white">
              <div className="mb-6">
                <div className="text-5xl mb-4 text-center">📖</div>
                <h2 className="text-2xl font-bold mb-3 text-center">
                  70 Días Estructurados
                </h2>
                <p className="text-green-100 text-center mb-6">
                  Todo lo que necesitas para perder peso
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8 flex-1">
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-200 mr-3 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>70 días de menús completos</span>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-200 mr-3 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Más de 100 recetas variadas</span>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-200 mr-3 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Listas de compras semanales</span>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-200 mr-3 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Plan de transición incluido</span>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-200 mr-3 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Guía de errores comunes</span>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-200 mr-3 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-semibold">Pérdida promedio: 8-12 kg</span>
                </div>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="text-4xl font-bold mb-1">10€</div>
                <p className="text-green-100 text-sm">Pago único, sin suscripciones</p>
              </div>

              {/* CTA Button */}
              <Link
                href="/"
                className="block w-full py-4 bg-white text-green-700 font-bold rounded-xl hover:bg-green-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 text-center"
              >
                COMPRAR - 10€
              </Link>

              <p className="text-center text-xs text-green-100 mt-4">
                Pago seguro con Stripe
              </p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              ¿Por qué elegir Planeta Keto?
            </h3>
            <p className="text-gray-600">
              Miles de personas ya han transformado su vida con nuestros planes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">100+</div>
              <p className="text-gray-600">Recetas deliciosas</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">10K+</div>
              <p className="text-gray-600">Seguidores en YouTube</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">4.8★</div>
              <p className="text-gray-600">Valoración promedio</p>
            </div>
          </div>
        </div>

        {/* YouTube CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            ¿Quieres ver más recetas antes de decidir?
          </p>
          <a
            href="https://youtube.com/@planetaketo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            <svg
              className="w-6 h-6 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Visitar Canal de YouTube
          </a>
        </div>
      </div>

      {/* Lead Modal */}
      <LeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
