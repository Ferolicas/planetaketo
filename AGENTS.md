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
- Stripe para tarjeta, Mercado Pago para Colombia y Hotmart para checkout local
  de productos que tengan una URL configurada.
- Resend para la entrega postpago y Sanity como origen privado de los PDF.
- Gestor de producción: pnpm (`pnpm-lock.yaml`). `package-lock.json` es legado.

## Comandos

- Desarrollo: `pnpm dev`
- Validación de tipos: `pnpm exec tsc --noEmit`
- Build obligatorio: `pnpm build`
- Despliegue en VPS: `bash /apps/planetaketo/deploy.sh`

No hacer commit, push ni deploy sin una instrucción explícita del usuario.

## Estructura esencial

- Páginas y API: `app/`
- Landing y catálogo: `components/home/`, `data/catalog.json`
- Checkout cliente: `components/checkout/`, `components/payment/`
- Pagos y postventa: `lib/payments/`
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

