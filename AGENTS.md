# Planeta Keto — instrucciones del proyecto

## Producto y producción

Planeta Keto es una tienda de métodos, recetarios y bundles digitales sobre
alimentación keto. Producción: `https://planetaketo.es` · VPS:
`/apps/planetaketo` · PM2: `planetaketo` · PostgreSQL: `planetaketo` · puerto:
`3011`.

El repositorio también contiene `ketoscan/`, una aplicación independiente. No
se modifica, construye ni reinicia Ketoscan cuando el trabajo corresponde a la
tienda.

## Stack real

- Next.js 15 App Router, React 19 y TypeScript.
- PostgreSQL nativo mediante `pg` y `lib/db.ts`.
- Autenticación propia del panel: bcrypt + cookie HMAC `session`.
- Stripe solo para Europa, Mercado Pago para Colombia y Hotmart para el resto
  (incluido LATAM excepto Colombia). Los 31 checkouts Hotmart viven en
  `data/hotmart-products.json`.
- Resend para la entrega postpago y Sanity como origen privado de los PDF.
- Gestor de producción: pnpm (`pnpm-lock.yaml`). `package-lock.json` es legado.

## Comandos

- Desarrollo: `pnpm dev`
- Validación de tipos: `pnpm exec tsc --noEmit`
- Build obligatorio: `pnpm build`
- Despliegue en VPS: `bash /apps/planetaketo/deploy.sh`

No hacer commit, push ni deploy sin una instrucción explícita del usuario.

## SEO (agosto 2026)

- **Página pilar `/dieta-keto`**: la guía que compite por «dieta keto / dieta
  cetogénica / keto para principiantes» (patrón de Diet Doctor: definición
  directa en el primer párrafo + guía completa). Enlazada desde la tira
  `GuideStrip` (todas las recetas y blogs), el footer y el sitemap (0.95).
- Home con título keyword-first («Dieta Keto: …»), hreflang es/x-default,
  BreadcrumbList en recetas, `/llms.txt` dinámico desde BD (guía + recetas +
  blog, para asistentes de IA) y robots.txt con los rastreadores de IA
  permitidos. ⚠️ Si Cloudflare tiene activado el bloqueo de bots de IA, ese
  ajuste ANULA los permisos: apagarlo en el panel para visibilidad en IAs.
- **Enlaces cruzados del holding**: footer y guía enlazan las calculadoras de
  olcas.app (macros, calorías); olcas enlaza de vuelta a /recetas y /dieta-keto.
  NO crear granjas de enlaces ni páginas vacías: penalización de Google.
- Build local: requiere `.env.local` con DATABASE_URL y RESEND_API_KEY de
  relleno (gitignorado); el build real corre en el VPS con el `.env` completo.

## Estructura esencial

- Páginas y API: `app/`
- Landing y catálogo: `components/home/`, `data/catalog.json`
- Checkout cliente: `components/checkout/`, `components/payment/`
- Pagos y postventa: `lib/payments/`
- Catálogo operativo Hotmart: `data/hotmart-products.json`,
  `scripts/hotmart-bulk-api.py`
- Descargas: `lib/downloads/`, `app/api/download/`
- Autenticación admin: `lib/auth/session.ts`, `app/api/auth/`
- PostgreSQL: `lib/db.ts`
- Deploy: `deploy.sh`, `ecosystem.config.js`
- Mapa profundo: `docs/PROJECT-MAP.md`

## Reglas quirúrgicas

- La interfaz es móvil primero.
- Nunca confiar en precio, moneda, estado de pago ni producto enviados por el
  navegador; deben resolverse otra vez en el servidor.
- Nunca entregar un producto por el resultado del cliente: solo por un pago
  aprobado verificado por el proveedor o su webhook.
- `finalizeSale()` debe seguir siendo idempotente por ID externo.
- No registrar tokens, secretos, firmas, datos de tarjeta ni payloads sensibles.
- No reutilizar una URL de Hotmart para un producto distinto del que vende.
- No probar el checkout con credenciales LIVE haciendo cargos reales.
- `.env.local` contiene secretos LIVE y está fuera de Git.
- Antes de entregar cambios: `git diff --check`, `pnpm exec tsc --noEmit` y
  `pnpm build`.
- Conservar intacto `public/`: Caddy y el despliegue atómico dependen de los
  estáticos del repositorio.

## Gotchas

- El deploy usa un `distDir` temporal y cambia el symlink `.next` de forma
  atómica; no construir manualmente sobre el `.next` vivo.
- El build del VPS omite el typecheck por la interacción entre Next y el symlink;
  el typecheck local es obligatorio.
- La home contiene muchas instancias de `CheckoutButton`; ningún componente
  cerrado debe iniciar consultas de región ni cargar SDKs de pago.
- React Strict Mode puede remontar efectos. Todo inicio automático de checkout
  debe ser cancelable o deduplicado.
- Stripe, Mercado Pago y Hotmart en producción usan credenciales LIVE.
- `www.planetaketo.es` redirige de forma permanente al dominio canónico sin
  `www`.
- Los webhooks y los efectos postventa pueden repetirse; la idempotencia no es
  opcional.
- Una venta confirmada pero incompleta debe quedar en `retry_pending`; el cron
  ejecuta `scripts/reconcile-deliveries.sh` y repara la entrega.
