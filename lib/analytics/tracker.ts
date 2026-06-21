// ============================================================
// Controlador imperativo del tracking (solo navegador). Lo arranca/para
// components/Analytics.tsx según el consentimiento. Mide TIEMPO ACTIVO real:
// el heartbeat solo cuenta y solo se envía mientras la pestaña está visible y
// con foco (Page Visibility API), de modo que una pestaña olvidada NO suma tiempo.
// ============================================================

import { getOrCreateSid, refreshSid } from './consent';

const ENDPOINT = '/api/track';
const HEARTBEAT_MS = 10_000;

let started = false;
let sid: string | null = null;

// Acumulador de tiempo activo (segundos) + inicio de la racha activa en curso.
let activeSeconds = 0;
let activeSince: number | null = null;
// Foco de la ventana: arranca en true y solo se desactiva con un `blur` real.
// (No usamos document.hasFocus() porque es poco fiable; la Page Visibility API es
//  el mecanismo primario para pausar al cambiar de pestaña o minimizar.)
let focused = true;

let hbTimer: ReturnType<typeof setInterval> | null = null;
let observer: IntersectionObserver | null = null;
const sectionsSeen = new Set<string>();

// --- Envío (no bloquea la navegación) -----------------------------------
function send(payload: Record<string, unknown>) {
  if (!sid) return;
  const body = JSON.stringify({ sid, ...payload });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
      return;
    }
  } catch {
    /* cae a fetch */
  }
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}

// --- Tiempo activo ------------------------------------------------------
function isActive(): boolean {
  return document.visibilityState === 'visible' && focused;
}
function markActive() {
  if (activeSince === null) activeSince = Date.now();
}
function markInactive() {
  if (activeSince !== null) {
    activeSeconds += (Date.now() - activeSince) / 1000;
    activeSince = null;
  }
}
function currentTotal(): number {
  const live = activeSince !== null ? (Date.now() - activeSince) / 1000 : 0;
  return Math.round(activeSeconds + live);
}

// --- Manejadores --------------------------------------------------------
function onHeartbeat() {
  if (!isActive()) return; // SOLO mientras la pestaña está activa
  send({ event: 'heartbeat', activeSeconds: currentTotal() });
  if (sid) refreshSid(sid); // desliza la ventana de 30 min con la actividad
}
function flush() {
  const total = currentTotal();
  if (total > 0) send({ event: 'heartbeat', activeSeconds: total });
}
function onVisibility() {
  if (isActive()) markActive();
  else {
    markInactive(); // pausa: cambió de pestaña / minimizó
    flush();
  }
}
function onFocus() {
  focused = true;
  if (document.visibilityState === 'visible') markActive();
}
function onBlur() {
  focused = false; // cambió a otra ventana/app
  markInactive();
  flush();
}
function onPageHide() {
  markInactive();
  flush();
}
function onClick(e: MouseEvent) {
  const target = e.target as HTMLElement | null;
  const el = target?.closest?.('[data-cta]') as HTMLElement | null;
  if (!el) return;
  const button = el.dataset.cta?.trim();
  if (button) send({ event: 'click', button: button.slice(0, 64) });
}

function readUtm() {
  try {
    const q = new URLSearchParams(location.search);
    const pick = (k: string) => q.get(k)?.slice(0, 128) || undefined;
    const source = pick('utm_source');
    const medium = pick('utm_medium');
    const campaign = pick('utm_campaign');
    if (!source && !medium && !campaign) return undefined;
    return { source, medium, campaign };
  } catch {
    return undefined;
  }
}

// --- Secciones (scroll depth) -------------------------------------------
function observeSections() {
  observer?.disconnect();
  sectionsSeen.clear();
  if (!('IntersectionObserver' in window)) return;
  const els = document.querySelectorAll<HTMLElement>('[data-section]');
  if (!els.length) return;
  observer = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const name = (en.target as HTMLElement).dataset.section;
        if (name && !sectionsSeen.has(name)) {
          sectionsSeen.add(name);
          send({ event: 'section', section: name.slice(0, 64) });
        }
        observer?.unobserve(en.target);
      }
    },
    { threshold: 0.01 } // "alcanzó la sección" en cuanto entra en pantalla
  );
  els.forEach((el) => observer?.observe(el));
}

// --- API pública --------------------------------------------------------
export function startTracking() {
  if (started || typeof window === 'undefined') return;
  sid = getOrCreateSid();
  started = true;
  activeSeconds = 0;
  activeSince = null;
  focused = true;
  if (isActive()) markActive();

  send({
    event: 'session_start',
    utm: readUtm(),
    referrer: document.referrer || undefined,
    path: location.pathname,
  });

  hbTimer = setInterval(onHeartbeat, HEARTBEAT_MS);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('focus', onFocus);
  window.addEventListener('blur', onBlur);
  window.addEventListener('pagehide', onPageHide);
  document.addEventListener('click', onClick, true);

  // Las secciones del DOM ya están montadas cuando consienten.
  observeSections();
}

export function stopTracking() {
  if (!started) return;
  flush();
  if (hbTimer) clearInterval(hbTimer);
  hbTimer = null;
  document.removeEventListener('visibilitychange', onVisibility);
  window.removeEventListener('focus', onFocus);
  window.removeEventListener('blur', onBlur);
  window.removeEventListener('pagehide', onPageHide);
  document.removeEventListener('click', onClick, true);
  observer?.disconnect();
  observer = null;
  sectionsSeen.clear();
  started = false;
  sid = null;
  activeSeconds = 0;
  activeSince = null;
}

/** Nueva página en navegación SPA: cuenta el pageview y re-observa secciones. */
export function trackPageview(path: string) {
  if (!started) return;
  send({ event: 'pageview', path });
  // Espera al pintado de la nueva ruta para observar sus secciones.
  setTimeout(observeSections, 300);
}
