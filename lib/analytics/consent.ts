// ============================================================
// Consentimiento de cookies (helpers de navegador, sin I/O de servidor).
// Fuente de verdad en el cliente: la cookie de 1ª parte `pk_consent`.
// La analítica de comportamiento SOLO arranca si analytics === true.
// ============================================================

// Súbela cuando cambie el texto/finalidades del CMP (re-pide consentimiento).
export const CONSENT_POLICY_VERSION = '2026-06-22';

export const CONSENT_COOKIE = 'pk_consent';
export const SID_COOKIE = 'pk_sid';

export type ConsentDecision = 'accept_all' | 'reject_all' | 'custom';

export interface ConsentRecord {
  /** Versión de la política aceptada (si difiere de la actual, se vuelve a preguntar). */
  v: string;
  /** ¿Consintió la analítica de comportamiento? */
  analytics: boolean;
  /** Identificador del consentimiento (UUID), para el registro de accountability. */
  id: string;
  decision: ConsentDecision;
  /** Epoch ms en que se decidió. */
  ts: number;
}

const ONE_YEAR = 60 * 60 * 24 * 365;
// pk_sid = ventana de VISITA: 30 min que se renuevan con la actividad. Tras 30 min
// de inactividad expira y la próxima visita es una sesión nueva (una fila por visita).
const SID_MAX_AGE = 60 * 30;

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Fallback muy improbable (navegadores antiguos).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function setCookie(name: string, value: string, maxAgeSec: number) {
  if (typeof document === 'undefined') return;
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSec}; Path=/; SameSite=Lax${secure}`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

/** Decisión vigente, o null si aún no ha decidido (o cambió la versión de la política). */
export function readConsent(): ConsentRecord | null {
  const raw = getCookie(CONSENT_COOKIE);
  if (!raw) return null;
  try {
    const rec = JSON.parse(raw) as ConsentRecord;
    if (rec.v !== CONSENT_POLICY_VERSION) return null; // política nueva → re-preguntar
    return rec;
  } catch {
    return null;
  }
}

/** Persiste la decisión en la cookie y devuelve el registro (para el log de accountability). */
export function writeConsent(decision: ConsentDecision, analytics: boolean): ConsentRecord {
  const rec: ConsentRecord = {
    v: CONSENT_POLICY_VERSION,
    analytics,
    id: readConsent()?.id ?? uuid(),
    decision,
    ts: Date.now(),
  };
  setCookie(CONSENT_COOKIE, JSON.stringify(rec), ONE_YEAR);
  if (!analytics) clearSessionCookie(); // retiró analítica → borra el id de sesión
  return rec;
}

/** UUID de la visita actual (pk_sid). Solo se crea si hay consentimiento. */
export function getOrCreateSid(): string {
  const existing = getCookie(SID_COOKIE);
  if (existing) return existing;
  const id = uuid();
  setCookie(SID_COOKIE, id, SID_MAX_AGE);
  return id;
}

export function getSid(): string | null {
  return getCookie(SID_COOKIE);
}

/** Renueva la ventana de 30 min mientras la pestaña sigue activa. */
export function refreshSid(sid: string) {
  setCookie(SID_COOKIE, sid, SID_MAX_AGE);
}

export function clearSessionCookie() {
  deleteCookie(SID_COOKIE);
}
