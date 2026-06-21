'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, MousePointerClick, ShoppingCart, Timer, Loader2, RefreshCw } from 'lucide-react';
import { countryToFlag } from '@/lib/flag';

// ============================================================
// Panel de analítica de /ferney: métricas agregadas + selector de rango con
// desglose por día + tabla de sesiones individuales. Mobile-first.
// ============================================================

type Range = 'today' | 'week' | 'month' | 'year' | 'all';
type Granularity = 'hour' | 'day' | 'month';

const RANGE_TABS: { key: Range; label: string }[] = [
  { key: 'today', label: 'Día' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'year', label: 'Año' },
  { key: 'all', label: 'Histórico' },
];

interface Bucket { key: string; visits: number; checkouts: number; sales: number }
interface Analytics {
  range: Range;
  granularity: Granularity;
  total: { visits: number; checkouts: number; sales: number; avgDuration: number };
  aggregates: {
    checkoutRate: number;
    purchaseRate: number;
    avgDurationSeconds: number;
    topCountries: { country: string; n: number }[];
    topSources: { traffic_source: string; n: number }[];
  };
  buckets: Bucket[];
}
interface SessionRow {
  id: string;
  country: string | null;
  traffic_source: string | null;
  duration_seconds: number;
  sections_viewed: string[];
  buttons_clicked: string[];
  transaction_state: string;
  entered_at: string;
}

// --- Formateadores -------------------------------------------------------
const regionNames = typeof Intl !== 'undefined' ? new Intl.DisplayNames(['es'], { type: 'region' }) : null;
function countryName(code: string | null): string {
  if (!code) return 'Desconocido';
  try {
    return regionNames?.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

const SOURCE_LABELS: Record<string, string> = {
  tiktok: 'TikTok', youtube: 'YouTube', instagram: 'Instagram', facebook: 'Facebook',
  twitter: 'X / Twitter', google: 'Búsqueda', referral: 'Referido', direct: 'Directo',
};
const sourceLabel = (s: string | null) =>
  !s ? '—' : SOURCE_LABELS[s] ?? s.charAt(0).toUpperCase() + s.slice(1);

const BUTTON_LABELS: Record<string, string> = {
  comprar_ahora: 'Comprar ahora', quiero_mi_metodo: 'Quiero mi método',
  empezar_ahora: 'Empezar ahora', si_quiero_transformarme: 'Sí quiero transformarme',
};
const humanize = (s: string) => s.replace(/_/g, ' ');
const buttonLabel = (b: string) => BUTTON_LABELS[b] ?? humanize(b);

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero', antes_despues: 'Antes/después', por_que: 'Por qué',
  testimonios: 'Testimonios', precio: 'Precio', cta_final: 'CTA final',
};
const sectionLabel = (s: string) => SECTION_LABELS[s] ?? humanize(s);

function bucketLabel(key: string, g: Granularity): string {
  if (g === 'hour') return `${key}:00`;
  if (g === 'month') {
    const d = new Date(`${key}-01T00:00:00`);
    return d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  }
  const d = new Date(`${key}T00:00:00`);
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });
}

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const minutes = (sec: number) => `${(sec / 60).toFixed(1)} min`;
const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
const dmy = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Madrid' });

const TX: Record<string, { label: string; cls: string }> = {
  venta_completada: { label: 'Venta', cls: 'bg-emerald-100 text-emerald-700' },
  checkout_iniciado_no_completado: { label: 'Checkout sin pagar', cls: 'bg-amber-100 text-amber-700' },
  sin_checkout: { label: 'Sin venta', cls: 'bg-gray-100 text-gray-500' },
};

export default function AnalyticsDashboard() {
  const [range, setRange] = useState<Range>('week');
  const [data, setData] = useState<Analytics | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (r: Range) => {
    setLoading(true);
    try {
      const [a, s] = await Promise.all([
        fetch(`/api/admin/analytics?range=${r}`, { cache: 'no-store' }),
        fetch(`/api/admin/sessions?range=${r}&limit=100`, { cache: 'no-store' }),
      ]);
      if (a.ok) setData(await a.json());
      if (s.ok) setSessions((await s.json()).rows ?? []);
    } catch {
      /* reintento manual con el botón de refrescar */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range);
  }, [range, load]);

  const maxVisits = useMemo(
    () => Math.max(1, ...(data?.buckets.map((b) => b.visits) ?? [1])),
    [data]
  );

  return (
    <div className="space-y-6">
      {/* Selector de rango */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {RANGE_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setRange(t.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                range === t.key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-emerald-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => load(range)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-gray-500 ring-1 ring-gray-200 hover:text-emerald-600"
          aria-label="Refrescar"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </button>
      </div>

      {/* Métricas agregadas */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={<Eye className="h-5 w-5" />} label="Visitas totales" value={data?.total.visits ?? '—'} />
        <Metric
          icon={<MousePointerClick className="h-5 w-5" />}
          label="Llegó al checkout"
          value={data ? pct(data.aggregates.checkoutRate) : '—'}
          sub={data ? `${data.total.checkouts} sesiones` : undefined}
        />
        <Metric
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Conversión (compró)"
          value={data ? pct(data.aggregates.purchaseRate) : '—'}
          sub={data ? `${data.total.sales} ventas` : undefined}
        />
        <Metric
          icon={<Timer className="h-5 w-5" />}
          label="Duración media"
          value={data ? minutes(data.aggregates.avgDurationSeconds) : '—'}
        />
      </div>

      {/* Top países / fuentes */}
      <div className="grid gap-3 sm:grid-cols-2">
        <TopList
          title="Top países"
          rows={(data?.aggregates.topCountries ?? []).map((c) => ({
            label: `${countryToFlag(c.country)} ${countryName(c.country)}`,
            n: c.n,
          }))}
        />
        <TopList
          title="Top fuentes"
          rows={(data?.aggregates.topSources ?? []).map((s) => ({
            label: sourceLabel(s.traffic_source),
            n: s.n,
          }))}
        />
      </div>

      {/* Desglose por intervalo */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          {range === 'today' ? 'Por hora (hoy)' : data?.granularity === 'month' ? 'Por mes' : 'Por día'}
          {data ? <span className="ml-2 font-normal text-gray-400">· {data.total.visits} visitas en total</span> : null}
        </h3>
        {!data ? (
          <BarsSkeleton />
        ) : data.buckets.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Aún no hay datos en este periodo.</p>
        ) : (
          <ul className="space-y-1.5">
            {data.buckets.map((b) => (
              <li key={b.key} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-xs text-gray-500">{bucketLabel(b.key, data.granularity)}</span>
                <div className="relative h-5 flex-1 overflow-hidden rounded bg-gray-100">
                  <div
                    className="h-full rounded bg-emerald-500"
                    style={{ width: `${Math.round((b.visits / maxVisits) * 100)}%` }}
                  />
                  {b.sales > 0 && (
                    <span className="absolute inset-y-0 right-1 flex items-center text-[10px] font-bold text-emerald-700">
                      🛒 {b.sales}
                    </span>
                  )}
                </div>
                <span className="w-8 shrink-0 text-right text-sm font-semibold text-gray-700">{b.visits}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tabla de sesiones individuales */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Sesiones individuales</h3>
          <span className="text-xs text-gray-400">{sessions.length}</span>
        </div>
        {sessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            {loading ? 'Cargando…' : 'Sin sesiones en este periodo.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-4 py-2 font-semibold">País</th>
                  <th className="px-4 py-2 font-semibold">Duración</th>
                  <th className="px-4 py-2 font-semibold">Botones</th>
                  <th className="px-4 py-2 font-semibold">Scroll</th>
                  <th className="px-4 py-2 font-semibold">Estado</th>
                  <th className="px-4 py-2 font-semibold">Fuente</th>
                  <th className="px-4 py-2 font-semibold">Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((s) => {
                  const tx = TX[s.transaction_state] ?? TX.sin_checkout;
                  return (
                    <tr key={s.id} className="align-top hover:bg-gray-50/60">
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span className="mr-1">{countryToFlag(s.country)}</span>
                        {countryName(s.country)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-gray-600">{minutes(s.duration_seconds)}</td>
                      <td className="px-4 py-2.5">
                        {s.buttons_clicked.length ? (
                          <div className="flex flex-wrap gap-1">
                            {s.buttons_clicked.map((b) => (
                              <span key={b} className="rounded bg-cta/20 px-1.5 py-0.5 text-[11px] text-forest-dark">
                                {buttonLabel(b)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {s.sections_viewed.length ? (
                          <span className="text-xs text-gray-500">{s.sections_viewed.map(sectionLabel).join(' · ')}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tx.cls}`}>{tx.label}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-gray-600">{sourceLabel(s.traffic_source)}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">
                        {hhmm(s.entered_at)}
                        {range !== 'today' && <span className="ml-1 text-xs text-gray-400">{dmy(s.entered_at)}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({
  icon, label, value, sub,
}: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        {icon}
      </span>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>}
    </div>
  );
}

function TopList({ title, rows }: { title: string; rows: { label: string; n: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
      {rows.length === 0 ? (
        <p className="py-3 text-center text-sm text-gray-400">Sin datos.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center gap-3">
              <span className="w-32 shrink-0 truncate text-sm text-gray-700">{r.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.round((r.n / max) * 100)}%` }} />
              </div>
              <span className="w-8 shrink-0 text-right text-sm font-semibold text-gray-700">{r.n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BarsSkeleton() {
  return (
    <ul className="space-y-1.5">
      {Array.from({ length: 7 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3">
          <span className="w-24 shrink-0" />
          <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
        </li>
      ))}
    </ul>
  );
}
