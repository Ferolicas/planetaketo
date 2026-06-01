'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users, Download, UserPlus, Loader2 } from 'lucide-react';

interface Stats {
  customers: number;
  freeDownloads: number;
}

export default function AdminPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/stats', { cache: 'no-store' });
      if (r.ok) setStats(await r.json());
    } catch {
      /* ignore: el siguiente intento de polling lo reintenta */
    }
  }, []);

  // Polling cada 10s (sin WebSocket)
  useEffect(() => {
    loadStats();
    const id = setInterval(loadStats, 10_000);
    return () => clearInterval(id);
  }, [loadStats]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMsg(null);
    try {
      const r = await fetch('/api/admin/create-ketoscan-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await r.json();
      if (r.ok) {
        setMsg({ type: 'ok', text: `Cuenta creada para ${data.email} — contraseña Cliente1234*` });
        setEmail('');
      } else {
        setMsg({ type: 'err', text: data.message || data.error || 'No se pudo crear' });
      }
    } catch {
      setMsg({ type: 'err', text: 'Error de red' });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mb-10 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Clientes (compradores)"
          value={stats?.customers}
        />
        <StatCard
          icon={<Download className="h-5 w-5" />}
          label="Descargas del libro gratis"
          value={stats?.freeDownloads}
        />
      </div>
      <p className="text-center text-xs text-gray-400">Se actualiza solo cada 10 segundos</p>

      <form onSubmit={createUser} className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-1 flex items-center gap-2 font-semibold text-gray-900">
          <UserPlus className="h-5 w-5 text-emerald-600" />
          Crear usuario de ketoscan (sin pago)
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          Crea la cuenta con contraseña <code className="rounded bg-gray-100 px-1">Cliente1234*</code> y
          cambio obligatorio en el primer acceso.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@cliente.com"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Crear'}
          </button>
        </div>
        {msg && (
          <p className={`mt-3 text-sm ${msg.type === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>
            {msg.text}
          </p>
        )}
      </form>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
}) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          {icon}
        </span>
        <div>
          <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
