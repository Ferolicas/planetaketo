'use client';

import { useEffect, useState } from 'react';

interface WebhookLog {
  id: string;
  event_id: string;
  event_type: string;
  stripe_session_id: string;
  stripe_payment_intent: string;
  customer_email: string;
  amount: number;
  currency: string;
  status: string;
  processing_step: string;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  completed_at: string | null;
}

export default function WebhooksAdminPage() {
  const [webhooks, setWebhooks] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/retry-webhook');
      const data = await res.json();
      setWebhooks(data.failedWebhooks || []);
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleRetry = async (webhookLogId: string) => {
    setRetrying(webhookLogId);
    try {
      const res = await fetch('/api/admin/retry-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookLogId }),
      });

      const data = await res.json();

      if (data.success) {
        alert('✅ Webhook procesado exitosamente');
        fetchWebhooks(); // Refresh list
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setRetrying(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'retrying':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando webhooks...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Monitor de Webhooks</h1>
        <button
          onClick={fetchWebhooks}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🔄 Actualizar
        </button>
      </div>

      {webhooks.length === 0 ? (
        <div className="text-center py-12 bg-green-50 rounded-lg">
          <p className="text-xl text-green-800">
            ✅ No hay webhooks fallidos o en proceso
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                        webhook.status
                      )}`}
                    >
                      {webhook.status.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      Retry: {webhook.retry_count}
                    </span>
                  </div>
                  <p className="font-semibold text-lg">{webhook.customer_email}</p>
                  <p className="text-sm text-gray-600">
                    {webhook.amount} {webhook.currency?.toUpperCase()} •{' '}
                    {webhook.event_type}
                  </p>
                </div>
                <button
                  onClick={() => handleRetry(webhook.id)}
                  disabled={retrying === webhook.id}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {retrying === webhook.id ? '⏳ Procesando...' : '🔄 Reintentar'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Event ID</p>
                  <p className="font-mono text-xs">{webhook.event_id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Session ID</p>
                  <p className="font-mono text-xs">{webhook.stripe_session_id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment Intent</p>
                  <p className="font-mono text-xs">{webhook.stripe_payment_intent}</p>
                </div>
                <div>
                  <p className="text-gray-500">Paso de Procesamiento</p>
                  <p className="font-semibold">{webhook.processing_step}</p>
                </div>
              </div>

              {webhook.error_message && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm font-semibold text-red-800 mb-1">
                    Error:
                  </p>
                  <p className="text-sm text-red-700">{webhook.error_message}</p>
                </div>
              )}

              <div className="mt-4 text-xs text-gray-500">
                <p>
                  Creado: {new Date(webhook.created_at).toLocaleString('es-ES')}
                </p>
                {webhook.completed_at && (
                  <p>
                    Completado:{' '}
                    {new Date(webhook.completed_at).toLocaleString('es-ES')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
