'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type DownloadStatus = 'loading' | 'success' | 'used' | 'expired' | 'error';

interface DownloadState {
  status: DownloadStatus;
  message: string;
  downloadUrl?: string;
}

// Loading fallback component
function DownloadLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white text-center">
          <h1 className="text-2xl font-bold mb-1">Planeta Keto</h1>
          <p className="text-green-100 text-sm">Plan Keto de 7 Dias</p>
        </div>
        <div className="p-8">
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="animate-spin h-16 w-16 text-green-600 mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inner component that uses useSearchParams
function DownloadContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<DownloadState>({
    status: 'loading',
    message: 'Verificando tu enlace de descarga...'
  });

  const verifyAndDownload = useCallback(async (downloadToken: string) => {
    try {
      const response = await fetch(`/api/lead/download?token=${downloadToken}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setState({
          status: 'success',
          message: 'Descarga lista',
          downloadUrl: data.downloadUrl
        });

        // Auto-start download after a brief delay
        setTimeout(() => {
          window.location.href = data.downloadUrl;
        }, 1500);

      } else if (response.status === 410) {
        // Token used or expired
        const isUsed = data.error?.includes('utilizado');
        setState({
          status: isUsed ? 'used' : 'expired',
          message: data.message || data.error
        });
      } else {
        setState({
          status: 'error',
          message: data.error || 'Error al procesar la descarga'
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      setState({
        status: 'error',
        message: 'Error de conexion. Por favor, intenta de nuevo.'
      });
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setState({
        status: 'error',
        message: 'Token no valido'
      });
      return;
    }

    verifyAndDownload(token);
  }, [token, verifyAndDownload]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white text-center">
          <h1 className="text-2xl font-bold mb-1">Planeta Keto</h1>
          <p className="text-green-100 text-sm">Plan Keto de 7 Dias</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {state.status === 'loading' && (
            <div className="text-center">
              <div className="mb-6">
                <svg
                  className="animate-spin h-16 w-16 text-green-600 mx-auto"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <p className="text-gray-600">{state.message}</p>
            </div>
          )}

          {state.status === 'success' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-10 h-10 text-green-600"
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
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Descarga Iniciada
              </h2>
              <p className="text-gray-600 mb-6">
                Tu descarga comenzara automaticamente...
              </p>

              {state.downloadUrl && (
                <a
                  href={state.downloadUrl}
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Descargar Manualmente
                </a>
              )}

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Este enlace de descarga solo puede usarse una vez
                  por seguridad.
                </p>
              </div>
            </div>
          )}

          {state.status === 'used' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-10 h-10 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Enlace Ya Utilizado
              </h2>
              <p className="text-gray-600 mb-6">{state.message}</p>

              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  ¿Necesitas descargar de nuevo?
                </p>
                <a
                  href="mailto:hola@planetaketo.es?subject=Necesito%20nuevo%20enlace%20de%20descarga"
                  className="inline-flex items-center px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Contactar Soporte
                </a>
              </div>
            </div>
          )}

          {state.status === 'expired' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-10 h-10 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Enlace Expirado
              </h2>
              <p className="text-gray-600 mb-6">{state.message}</p>

              <div className="space-y-4">
                <Link
                  href="/r"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Solicitar Nuevo Enlace
                </Link>
              </div>
            </div>
          )}

          {state.status === 'error' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-10 h-10 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">{state.message}</p>

              <Link
                href="/r"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Volver a Recursos
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-green-600 transition-colors"
          >
            planetaketo.es
          </Link>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function DownloadPage() {
  return (
    <Suspense fallback={<DownloadLoading />}>
      <DownloadContent />
    </Suspense>
  );
}
