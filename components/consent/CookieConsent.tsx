'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { useConsent } from './ConsentProvider';

// ============================================================
// Banner de consentimiento (CMP) conforme a la Guía de Cookies de la AEPD (2024):
//  · 1ª capa con 3 acciones AL MISMO NIVEL (mismo tamaño, color y contraste):
//    Aceptar · Rechazar · Configurar. Rechazar es tan fácil como Aceptar.
//  · Sin scroll-como-consentimiento, sin casillas premarcadas, sin muro de cookies.
//  · 2ª capa (Configurar): finalidades en lenguaje claro, interruptores OFF por
//    defecto (salvo las técnicas necesarias) y tabla de cookies.
//  · El tracking analítico NO arranca hasta que se acepta (lo controla el tracker).
// ============================================================

export default function CookieConsent() {
  const { decided, analyticsAllowed, settingsOpen, accept, reject, saveCustom, openSettings, closeSettings } =
    useConsent();

  const showBanner = !decided && !settingsOpen;

  return (
    <>
      {showBanner && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Aviso de cookies"
          className="fixed inset-x-0 bottom-0 z-[60] border-t border-forest/15 bg-white shadow-[0_-10px_34px_rgba(0,0,0,0.2)]"
        >
          <div className="container mx-auto max-w-4xl px-4 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 hidden h-6 w-6 shrink-0 text-forest sm:block" />
              <div className="text-sm leading-relaxed text-gray-700">
                <p className="mb-1 font-semibold text-forest-dark">Tu privacidad es lo primero</p>
                <p>
                  Usamos cookies técnicas necesarias y, con tu permiso, una{' '}
                  <strong>analítica 100% propia</strong> (sin Google ni terceros y{' '}
                  <strong>sin guardar tu IP</strong>) para entender cómo se usa la web y mejorarla.
                  Puedes aceptar, rechazar o configurar. Más detalles en nuestra{' '}
                  <a href="/cookies" className="font-medium text-forest underline hover:text-forest-dark">
                    política de cookies
                  </a>
                  .
                </p>
              </div>
            </div>

            {/* 3 botones AL MISMO NIVEL: mismo tamaño, color y contraste (WCAG). */}
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <ConsentButton onClick={reject}>Rechazar</ConsentButton>
              <ConsentButton onClick={openSettings}>Configurar</ConsentButton>
              <ConsentButton onClick={accept}>Aceptar</ConsentButton>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <SettingsPanel
          initialAnalytics={analyticsAllowed}
          onClose={closeSettings}
          onSave={saveCustom}
          onAcceptAll={accept}
          onRejectAll={reject}
        />
      )}
    </>
  );
}

// Botón único reutilizado para los 3: garantiza igualdad visual exacta.
function ConsentButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-full border-2 border-forest bg-forest px-5 py-3 text-center text-base font-bold text-white transition-colors hover:bg-forest-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
    >
      {children}
    </button>
  );
}

interface CookieRow {
  name: string;
  purpose: string;
  duration: string;
  type: string;
}

const COOKIE_TABLE: { category: 'tecnica' | 'analitica'; rows: CookieRow[] }[] = [
  {
    category: 'tecnica',
    rows: [
      { name: 'pk_consent', purpose: 'Recuerda tu decisión sobre las cookies.', duration: '12 meses', type: 'Propia · técnica' },
      { name: 'session', purpose: 'Mantiene la sesión del panel de administración (solo administradores).', duration: '30 días', type: 'Propia · técnica' },
    ],
  },
  {
    category: 'analitica',
    rows: [
      { name: 'pk_sid', purpose: 'Identifica tu visita para medir audiencia de forma anónima y propia (sin IP, sin terceros).', duration: '30 min (se renueva con la actividad)', type: 'Propia · analítica' },
    ],
  },
];

function SettingsPanel({
  initialAnalytics,
  onClose,
  onSave,
  onAcceptAll,
  onRejectAll,
}: {
  initialAnalytics: boolean;
  onClose: () => void;
  onSave: (analytics: boolean) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}) {
  const [analytics, setAnalytics] = useState(initialAnalytics);

  // Cierra con Escape y bloquea el scroll del fondo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Configuración de cookies"
        className="flex max-h-[92vh] w-full flex-col overflow-hidden bg-white sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
          <h2 className="font-serif text-xl font-bold text-forest-dark">Configuración de cookies</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <p className="text-sm leading-relaxed text-gray-600">
            Elige qué cookies permites. Puedes cambiar tu decisión cuando quieras desde el enlace
            «Preferencias de cookies» del pie de página. Base jurídica de la analítica:{' '}
            <strong>tu consentimiento</strong> (art. 6.1.a RGPD y art. 22.2 LSSI-CE).
          </p>

          {/* Finalidad 1: técnicas necesarias (siempre activas) */}
          <PurposeCard
            title="Técnicas necesarias"
            description="Imprescindibles para que la web funcione y para recordar tu decisión sobre las cookies. No requieren consentimiento y están siempre activas."
            checked
            disabled
          />

          {/* Finalidad 2: analítica propia (OFF por defecto) */}
          <PurposeCard
            title="Analítica propia"
            description="Medición de audiencia 100% propia (sin Google ni terceros y sin almacenar tu IP): cuántas personas visitan la web, cuánto tiempo permanecen activas y qué secciones ven. Nos ayuda a mejorar el contenido."
            checked={analytics}
            onChange={setAnalytics}
          />

          {/* Tabla de cookies */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-forest-dark">Cookies utilizadas</h3>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Nombre</th>
                    <th className="px-3 py-2 font-semibold">Finalidad</th>
                    <th className="px-3 py-2 font-semibold">Duración</th>
                    <th className="px-3 py-2 font-semibold">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {COOKIE_TABLE.flatMap((g) => g.rows).map((r) => (
                    <tr key={r.name} className="align-top">
                      <td className="px-3 py-2 font-mono text-[11px] text-gray-800">{r.name}</td>
                      <td className="px-3 py-2 text-gray-600">{r.purpose}</td>
                      <td className="px-3 py-2 text-gray-600">{r.duration}</td>
                      <td className="px-3 py-2 text-gray-600">{r.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="shrink-0 space-y-2 border-t px-5 py-4">
          <button
            type="button"
            onClick={() => onSave(analytics)}
            className="w-full rounded-full bg-cta px-5 py-3 text-base font-bold text-forest-dark transition-colors hover:bg-cta-dark hover:text-white"
          >
            Guardar preferencias
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onRejectAll}
              className="w-full rounded-full border-2 border-forest px-5 py-2.5 text-sm font-bold text-forest transition-colors hover:bg-mint-pale"
            >
              Rechazar todo
            </button>
            <button
              type="button"
              onClick={onAcceptAll}
              className="w-full rounded-full border-2 border-forest bg-forest px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-forest-dark"
            >
              Aceptar todo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PurposeCard({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border bg-gray-50/60 p-4">
      <div>
        <p className="font-semibold text-forest-dark">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-forest' : 'bg-gray-300'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}
