// Verifica el heartbeat con PAUSA por Page Visibility API (mide tiempo REAL).
// Como en headless no se puede mandar una pestaña al fondo de verdad, simulamos
// EXACTAMENTE lo que hace el navegador al cambiar de pestaña: forzamos
// document.visibilityState='hidden' y disparamos 'visibilitychange' (que es el
// evento que escucha el tracker). Contamos llamadas a /api/track por fase
// (sendBeacon no expone el cuerpo; sin scroll no hay secciones nuevas → las extra
// son heartbeats).
const { chromium } = require('playwright');
const BASE = process.env.BASE_URL || 'http://localhost:3100';

const setVisibility = (state) => {
  const hidden = state === 'hidden';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event('visibilitychange'));
};

async function run() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  let n = 0;
  page.on('request', (r) => r.url().includes('/api/track') && n++);

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: 'Aceptar', exact: true }).click();
  await page.waitForTimeout(3000); // session_start + secciones iniciales
  const base = n;

  // 1) ACTIVA ~22s → ~2 heartbeats (a los 10s y 20s).
  await page.waitForTimeout(22000);
  const active = n - base;

  // 2) OCULTA ~22s → al ocultar hay 1 flush puntual; después 0 periódicos (pausa).
  await page.evaluate(setVisibility, 'hidden');
  await page.waitForTimeout(1500); // deja que el flush del momento de ocultar se registre
  const c1 = n;
  await page.waitForTimeout(22000);
  const hidden = n - c1; // a partir del flush, no debe haber más heartbeats

  // 3) VISIBLE de nuevo ~13s → reanuda (≥1 heartbeat).
  await page.evaluate(setVisibility, 'visible');
  const c2 = n;
  await page.waitForTimeout(13000);
  const resumed = n - c2;

  console.log('heartbeats ACTIVA (~22s):   ', active, '(esperado ≥ 2)');
  console.log('heartbeats OCULTA (~22s):   ', hidden, '(esperado 0 → pausa real, sin contar tiempo de fondo)');
  console.log('heartbeats REACTIVADA(~13s):', resumed, '(esperado ≥ 1)');

  const pass = active >= 2 && hidden === 0 && resumed >= 1;
  console.log('\nRESULTADO heartbeat:', pass ? '✅ PASS — mide tiempo real y pausa al ocultar' : '❌ FAIL');
  await browser.close();
  process.exit(pass ? 0 : 1);
}
run().catch((e) => { console.error(e); process.exit(2); });
