/* ============================================================
 * Planeta Keto Scan - Service Worker
 * Estrategia:
 *  - Navegaciones / estaticos: stale-while-revalidate
 *  - API: network-only (datos siempre frescos, nunca cachear)
 * ============================================================ */

const VERSION = "keto-scan-v1";
const STATIC_CACHE = `${VERSION}-static`;
const BASE = "";

const PRECACHE = [
  `${BASE}/alimentos`,
  `${BASE}/menu-dia`,
  `${BASE}/menu-semanal`,
  `${BASE}/yo`,
  `${BASE}/manifest.json`,
  `${BASE}/icons/icon-192.png`,
  `${BASE}/icons/icon-512.png`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Nunca cachear llamadas a la API
  if (url.pathname.startsWith(`${BASE}/api/`)) {
    return; // dejar pasar a la red
  }

  // stale-while-revalidate para el resto
  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
