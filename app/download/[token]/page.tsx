'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DownloadPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [status, setStatus] = useState<'loading' | 'valid' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [remainingDownloads, setRemainingDownloads] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/download/validate/${token}`);
      const data = await response.json();

      if (data.valid) {
        setStatus('valid');
        setDownloadUrl(data.downloadUrl);
        setRemainingDownloads(data.remainingDownloads);
        setMessage('Tu enlace de descarga es válido');
      } else {
        setStatus('error');
        setMessage(data.error || 'Enlace de descarga inválido');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error al validar el enlace de descarga');
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch(`/api/download/${token}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al descargar');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'El Metodo keto Definitivo - Planeta Keto.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Refresh to update remaining downloads
      await validateToken();
    } catch (error: any) {
      alert(error.message || 'Error al descargar el archivo');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="h-16 w-16 text-emerald-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Validando enlace...
            </h2>
            <p className="text-gray-600">Por favor espera un momento</p>
          </div>
        )}

        {status === 'valid' && (
          <div className="text-center">
            <div className="bg-emerald-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Download className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Listo para descargar!
            </h2>
            <p className="text-gray-600 mb-6">
              {message}
            </p>

            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-emerald-800 mb-1">
                📥 Descargas disponibles
              </p>
              <p className="text-sm text-emerald-700">
                Te quedan <strong>{remainingDownloads + 1}</strong> descargas con este enlace
              </p>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 px-6 rounded-full font-bold text-lg hover:from-emerald-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Descargando...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Descargar PDF
                </>
              )}
            </button>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                ¿Tienes dudas o necesitas ayuda?
              </p>
              <a
                href="https://wa.me/19176726696"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
              >
                💬 Contactar por WhatsApp
              </a>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Enlace no válido
            </h2>
            <p className="text-gray-600 mb-6">
              {message}
            </p>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-yellow-800 mb-2">
                Posibles razones:
              </p>
              <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                <li>El enlace ha expirado</li>
                <li>Ya se alcanzó el límite de descargas (2 máximo)</li>
                <li>El enlace no es correcto</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link
                href="/"
                className="block w-full bg-emerald-600 text-white py-3 px-6 rounded-full font-semibold hover:bg-emerald-700 transition-colors"
              >
                Volver al inicio
              </Link>
              <a
                href="https://wa.me/19176726696"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-green-600 text-white py-3 px-6 rounded-full font-semibold hover:bg-green-700 transition-colors"
              >
                💬 Contactar Soporte
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
