// Verificación "sin consentimiento = cero tracking" en un contexto incógnito real.
// Uso: node scripts/analytics/verify-consent.cjs  (con el server en localhost:3000)
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function run() {
  const browser = await chromium.launch();
  let pass = true;
  const log = (...a) => console.log(...a);

  // ---------- 1) SIN consentimiento: NO debe trackear ----------
  const ctx = await browser.newContext(); // contexto limpio = incógnito
  const page = await ctx.newPage();
  const track = [];
  page.on('request', (r) => r.url().includes('/api/track') && track.push(`${r.method()} ${r.url()}`));

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500); // deja pasar hidratación + un posible heartbeat

  const banner = await page.getByText('Tu privacidad es lo primero').isVisible().catch(() => false);
  const sidBefore = (await ctx.cookies()).some((c) => c.name === 'pk_sid');
  const trackBefore = track.length;

  log('── SIN consentimiento ──');
  log('   banner visible:        ', banner);
  log('   cookie pk_sid creada:  ', sidBefore, '(debe ser false)');
  log('   llamadas /api/track:   ', trackBefore, '(debe ser 0)', track);
  if (!banner || sidBefore || trackBefore !== 0) pass = false;

  // ---------- 2) ACEPTAR: debe arrancar el tracking ----------
  await page.getByRole('button', { name: 'Aceptar', exact: true }).click();
  await page.waitForTimeout(2500);

  const cookiesAfter = await ctx.cookies();
  const consentAfter = cookiesAfter.some((c) => c.name === 'pk_consent');
  const sidAfter = cookiesAfter.some((c) => c.name === 'pk_sid');

  log('── TRAS aceptar ──');
  log('   cookie pk_consent:     ', consentAfter, '(debe ser true)');
  log('   cookie pk_sid creada:  ', sidAfter, '(debe ser true)');
  log('   llamadas /api/track:   ', track.length, '(debe ser > 0)', track.slice(0, 4));
  if (!consentAfter || !sidAfter || track.length === 0) pass = false;
  await ctx.close();

  // ---------- 3) RECHAZAR: debe seguir sin trackear ----------
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  const track2 = [];
  page2.on('request', (r) => r.url().includes('/api/track') && track2.push(r.url()));
  await page2.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page2.waitForTimeout(3000);
  await page2.getByRole('button', { name: 'Rechazar', exact: true }).click();
  await page2.waitForTimeout(2500);
  const sidReject = (await ctx2.cookies()).some((c) => c.name === 'pk_sid');
  log('── TRAS rechazar ──');
  log('   cookie pk_sid creada:  ', sidReject, '(debe ser false)');
  log('   llamadas /api/track:   ', track2.length, '(debe ser 0)');
  if (sidReject || track2.length !== 0) pass = false;
  await ctx2.close();

  await browser.close();
  log('\nRESULTADO:', pass ? '✅ PASS — sin consentimiento = cero tracking' : '❌ FAIL');
  process.exit(pass ? 0 : 1);
}

run().catch((e) => {
  console.error(e);
  process.exit(2);
});
