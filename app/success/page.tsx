import Link from 'next/link';
import { CheckCircle, Download, User } from 'lucide-react';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-6">
            <CheckCircle className="h-10 w-10" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ¡Compra Exitosa!
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            Gracias por tu compra. Hemos enviado un correo electrónico con toda la información.
          </p>

          <div className="bg-primary-50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-4">
              ¿Qué sigue?
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center mt-0.5">
                  <span className="text-primary-600 text-sm font-bold">1</span>
                </div>
                <span className="text-gray-700">
                  Revisa tu correo electrónico para encontrar el enlace de descarga
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center mt-0.5">
                  <span className="text-primary-600 text-sm font-bold">2</span>
                </div>
                <span className="text-gray-700">
                  Descarga tu producto (tienes 30 días y hasta 2 descargas)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center mt-0.5">
                  <span className="text-primary-600 text-sm font-bold">3</span>
                </div>
                <span className="text-gray-700">
                  Accede a tu perfil y únete a nuestra comunidad
                </span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/perfil"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-primary-600 rounded-full hover:bg-primary-700 transition-colors"
            >
              <User className="mr-2 h-4 w-4" />
              Ir a Mi Perfil
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-primary-700 bg-white border-2 border-primary-200 rounded-full hover:bg-gray-50 transition-colors"
            >
              Volver al Inicio
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t text-sm text-gray-500">
            <p>
              ¿Necesitas ayuda?{' '}
              <a
                href="https://wa.me/19176726696"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Contáctanos por WhatsApp
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
