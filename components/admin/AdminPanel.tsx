'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users, Download, UserPlus, Loader2 } from 'lucide-react';
import { countryToFlag } from '@/lib/flag';

interface Stats {
  customers: number;
  freeDownloads: number;
}

interface Person {
  email: string;
  country: string | null;
}

type ListKey = 'customers' | 'free' | null;

export default function AdminPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Lista desplegable (compradores / descargas gratis)
  const [openList, setOpenList] = useState<ListKey>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [listLoading, setListLoading] = useState(false);

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

  async function toggleList(key: 'customers' | 'free') {
    if (openList === key) {
      setOpenList(null);
      return;
    }
    setOpenList(key);
    setListLoading(true);
    setPeople([]);
    try {
      const url = key === 'customers' ? '/api/admin/customers' : '/api/admin/free-downloads';
      const r = await fetch(url, { cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        setPeople(Array.isArray(data.rows) ? data.rows : []);
      }
    } catch {
      /* la UI muestra lista vacía */
    } finally {
      setListLoading(false);
    }
  }

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
      {/* Totales (clicables: muestran la lista de personas) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Clientes (compradores)"
          value={stats?.customers}
          active={openList === 'customers'}
          onClick={() => toggleList('customers')}
        />
        <StatCard
          icon={<Download className="h-5 w-5" />}
          label="Descargas del libro gratis"
          value={stats?.freeDownloads}
          active={openList === 'free'}
          onClick={() => toggleList('free')}
        />
      </div>

      {/* Lista desplegable */}
      {openList && (
        <PeopleList
          loading={listLoading}
          people={people}
          title={openList === 'customers' ? 'Compradores' : 'Descargas del libro gratis'}
        />
      )}

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
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  active?: boolean;
  onClick?: () => void;
}) {
  const clickable = typeof onClick === 'function';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`rounded-xl border bg-white p-6 text-left shadow-sm transition ${
        clickable ? 'cursor-pointer hover:border-emerald-400 hover:shadow' : 'cursor-default'
      } ${active ? 'border-emerald-500 ring-1 ring-emerald-500' : ''}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          {icon}
        </span>
        <div>
          <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
          <p className="text-sm text-gray-500">
            {label}
            {clickable && <span className="ml-1 text-emerald-600">· ver lista</span>}
          </p>
        </div>
      </div>
    </button>
  );
}

function PeopleList({
  loading,
  people,
  title,
}: {
  loading: boolean;
  people: Person[];
  title: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <span className="text-sm text-gray-500">{people.length}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : people.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">Todavía no hay registros.</p>
      ) : (
        <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
          {people.map((p, i) => (
            <li key={`${p.email}-${i}`} className="flex items-center gap-3 py-2">
              <span className="text-2xl leading-none" title={p.country ?? 'desconocido'}>
                {countryToFlag(p.country)}
              </span>
              <span className="truncate text-sm text-gray-700">{p.email}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
