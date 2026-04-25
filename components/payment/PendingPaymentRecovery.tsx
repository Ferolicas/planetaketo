'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

const STORAGE_KEY = 'pendingPayment';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

interface PendingPayment {
  paymentIntentId: string;
  timestamp: number;
}

/**
 * Globally mounted recovery modal.
 *
 * If the user paid but never submitted their name+email (refresh, closed tab,
 * navigated away, etc.), the paymentIntentId is in localStorage. On any page
 * load we detect it and reopen the data form so the magic link can be sent.
 *
 * Belt-and-suspenders: a server-side cron will also rescue payments that
 * never get completed via the frontend.
 */
export default function PendingPaymentRecovery() {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const pending: PendingPayment = JSON.parse(raw);
      if (!pending?.paymentIntentId || !pending?.timestamp) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const age = Date.now() - pending.timestamp;
      if (age > MAX_AGE_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      setPendingId(pending.paymentIntentId);
    } catch {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    }
  }, []);

  const validate = () => {
    const next: { name?: string; email?: string } = {};
    if (!name.trim() || name.trim().length < 2) {
      next.name = 'Por favor ingresa tu nombre';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      next.email = 'Por favor ingresa un email válido';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !pendingId) return;

    setIsSending(true);
    setServerError(null);

    try {
      const response = await fetch('/api/stripe/complete-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: pendingId,
          customerName: name,
          customerEmail: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al completar la compra');
      }

      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      setIsSuccess(true);
    } catch (err: any) {
      setServerError(err.message || 'Error inesperado');
    } finally {
      setIsSending(false);
    }
  };

  // User clicks X — leave the localStorage entry so the cron rescues it.
  const handleDismiss = () => setPendingId(null);

  if (!pendingId) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Tu pago se completó ✅
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Solo nos faltan tus datos para enviarte el producto.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Listo!</h3>
              <p className="text-gray-600 mb-6">
                Hemos enviado el enlace de descarga a<br />
                <strong className="text-gray-900">{email}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Revisa tu bandeja de entrada (y spam) en los próximos minutos.
              </p>
              <button
                onClick={handleDismiss}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-semibold">¡Pago exitoso!</p>
                <p className="text-green-700 text-sm mt-1">
                  Ingresa tus datos para recibir el producto
                </p>
              </div>

              <div>
                <label htmlFor="recovery-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Tu nombre
                </label>
                <input
                  id="recovery-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 ${
                    errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: María García"
                  autoFocus
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="recovery-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Tu email
                </label>
                <input
                  id="recovery-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 ${
                    errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="tu@email.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>📧 Importante:</strong> A este email recibirás el enlace de descarga del producto.
                </p>
              </div>

              {serverError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {serverError}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSending}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSending ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enviando...
                  </span>
                ) : (
                  'Recibir mi producto'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
