'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type DownloadStatus = 'loading' | 'success' | 'limit_reached' | 'invalid' | 'error';

interface DownloadState {
  status: DownloadStatus;
  message: string;
  remainingDownloads?: number;
}

export default function PurchaseDownloadPage() {
  const params = useParams();
  const token = params.token as string;

  const [state, setState] = useState<DownloadState>({
    status: 'loading',
    message: 'Preparando tu descarga...'
  });

  const handleDownload = useCallback(async (downloadToken: string) => {
    try {
      // Primero validamos el token
      const validateResponse = await fetch(`/api/download/validate/${downloadToken}`);
      const validateData = await validateResponse.json();

      if (!validateResponse.ok) {
        if (validateResponse.status === 403) {
          setState({
            status: 'limit_reached',
            message: validateData.error || 'Has alcanzado el límite de descargas'
          });
        } else {
          setState({
            status: 'invalid',
            message: validateData.error || 'Enlace de descarga inválido'
          });
        }
        return;
      }

      // Si es válido, procedemos con la descarga
      const response = await fetch(`/api/download/${downloadToken}`);

      if (response.ok) {
        const blob = await response.blob();

        // Crear URL temporal para descargar
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'El_Metodo_Keto_Definitivo_Planeta_Keto.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        setState({
          status: 'success',
          message: '¡Tu descarga ha comenzado!',
          remainingDownloads: validateData.remainingDownloads - 1
        });
      } else {
        const errorData = await response.json();

        if (response.status === 403) {
          setState({
            status: 'limit_reached',
            message: errorData.error || 'Has alcanzado el límite de descargas'
          });
        } else {
          setState({
            status: 'error',
            message: errorData.error || 'Error al descargar el archivo'
          });
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      setState({
        status: 'error',
        message: 'Error de conexión. Por favor, intenta de nuevo.'
      });
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setState({
        status: 'invalid',
        message: 'Enlace de descarga inválido'
      });
      return;
    }

    handleDownload(token);
  }, [token, handleDownload]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white text-center">
          <h1 className="text-2xl font-bold mb-1">Planeta Keto</h1>
          <p className="text-green-100 text-sm">Método Keto 70 Días</p>
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
                ¡Descarga Completada!
              </h2>
              <p className="text-gray-600 mb-4">
                Tu Método Keto se ha descargado correctamente.
              </p>

              {state.remainingDownloads !== undefined && state.remainingDownloads > 0 && (
                <p className="text-sm text-gray-500 mb-4">
                  Descargas restantes: {state.remainingDownloads}
                </p>
              )}

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>¡Gracias por tu compra!</strong> Revisa tu carpeta de descargas para encontrar el PDF.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors w-full justify-center"
                >
                  Ir a Planeta Keto
                </Link>
              </div>
            </div>
          )}

          {state.status === 'limit_reached' && (
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
                Límite de Descargas Alcanzado
              </h2>
              <p className="text-gray-600 mb-6">
                Has utilizado todas las descargas disponibles para este enlace.
              </p>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                <p className="text-sm text-blue-800">
                  <strong>¿Necesitas descargar de nuevo?</strong><br />
                  Contáctanos y te ayudaremos.
                </p>
              </div>

              <a
                href="mailto:hola@planetaketo.es?subject=Necesito%20nuevo%20enlace%20de%20descarga%20-%20Método%20Keto"
                className="inline-flex items-center px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
              >
                Contactar Soporte
              </a>
            </div>
          )}

          {state.status === 'invalid' && (
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Enlace Inválido
              </h2>
              <p className="text-gray-600 mb-6">{state.message}</p>

              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Si compraste el producto y no puedes descargar, contáctanos.
                </p>
                <a
                  href="mailto:hola@planetaketo.es?subject=Problema%20con%20enlace%20de%20descarga"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Contactar Soporte
                </a>
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
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">{state.message}</p>

              <button
                onClick={() => {
                  setState({ status: 'loading', message: 'Reintentando...' });
                  handleDownload(token);
                }}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Reintentar Descarga
              </button>
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
