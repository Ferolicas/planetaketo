'use client';

import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import {
  readConsent,
  writeConsent,
  CONSENT_POLICY_VERSION,
  type ConsentRecord,
} from '@/lib/analytics/consent';

// ============================================================
// Estado global del consentimiento. Expone si la analítica está permitida y los
// métodos para aceptar / rechazar / guardar preferencias y reabrir el panel.
// El tracker (components/Analytics.tsx) solo actúa cuando analyticsAllowed === true.
// ============================================================

interface ConsentContextValue {
  /** ¿Ya decidió el usuario? (si no, se muestra el banner) */
  decided: boolean;
  /** ¿Consintió la analítica de comportamiento? */
  analyticsAllowed: boolean;
  /** ¿Está abierto el panel de configuración (2ª capa)? */
  settingsOpen: boolean;
  accept: () => void;
  reject: () => void;
  /** Guarda una elección granular (2ª capa). */
  saveCustom: (analytics: boolean) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

async function logConsent(rec: ConsentRecord) {
  try {
    await fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        consentId: rec.id,
        decision: rec.decision,
        analytics: rec.analytics,
        policyVersion: CONSENT_POLICY_VERSION,
      }),
    });
  } catch {
    /* el registro de accountability es best-effort; no bloquea la navegación */
  }
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Lee la decisión vigente al montar (solo cliente: evita parpadeo en SSR).
  useEffect(() => {
    setConsent(readConsent());
    setHydrated(true);
  }, []);

  const commit = useCallback((rec: ConsentRecord) => {
    setConsent(rec);
    setSettingsOpen(false);
    void logConsent(rec);
  }, []);

  const accept = useCallback(() => commit(writeConsent('accept_all', true)), [commit]);
  const reject = useCallback(() => commit(writeConsent('reject_all', false)), [commit]);
  const saveCustom = useCallback(
    (analytics: boolean) => commit(writeConsent('custom', analytics)),
    [commit]
  );

  const value: ConsentContextValue = {
    // Antes de hidratar tratamos como "ya decidido" para no renderizar el banner en SSR.
    decided: !hydrated ? true : consent !== null,
    analyticsAllowed: consent?.analytics === true,
    settingsOpen,
    accept,
    reject,
    saveCustom,
    openSettings: () => setSettingsOpen(true),
    closeSettings: () => setSettingsOpen(false),
  };

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent debe usarse dentro de <ConsentProvider>');
  return ctx;
}
