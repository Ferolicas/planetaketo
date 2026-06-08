'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function GraciasClient() {
  // ¿Estamos embebidos dentro del modal de pago (iframe)?
  const [embedded, setEmbedded] = useState(false);

  useEffect(() => {
    const inIframe = typeof window !== 'undefined' && window.parent !== window;
    setEmbedded(inIframe);

    if (inIframe) {
      // El padre está en nuestro mismo dominio: avisamos del pago confirmado.
      try {
        window.parent.postMessage({ type: 'planetaketo:pago-ok' }, window.location.origin);
      } catch {
        /* noop */
      }
    }
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-16 bg-white">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">¡Gracias por tu compra! 💚</h1>
        <p className="text-gray-600 mb-2">
          Tu pago se ha confirmado. En unos minutos recibirás en tu correo el enlace
          para descargar <strong>El Método Keto Definitivo</strong>.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Si no lo ves, revisa la carpeta de spam o promociones.
        </p>

        {/* Si está embebido, el botón solo cierra visualmente desde el padre.
            Si es página normal, ofrecemos volver al inicio. */}
        {!embedded && (
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Volver al inicio
          </Link>
        )}
      </div>
    </div>
  );
}
