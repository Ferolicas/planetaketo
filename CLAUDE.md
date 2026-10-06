# Planeta Keto — contexto permanente

## Qué es
Tienda mobile-first de métodos, recetarios y bundles digitales keto. Producción: `https://planetaketo.es` · VPS: `/apps/planetaketo` · PM2: `planetaketo` · PostgreSQL: `planetaketo` · puerto: `3011`.

`ketoscan/` es una aplicación independiente: no modificarla, construirla ni reiniciarla cuando el trabajo sea de la tienda.

## Stack
Next.js 15 App Router, React 19, TypeScript, PostgreSQL nativo con `pg`, auth admin propia con bcrypt + cookie HMAC. Stripe para Europa, Mercado Pago para Colombia y Hotmart para el resto. Resend entrega postpago y Sanity aloja los PDF/ZIP privados. Gestor: pnpm.

## Comandos
Desarrollo: `pnpm dev` · typecheck: `pnpm exec tsc --noEmit` · build: `pnpm build` · deploy autorizado: `bash /apps/planetaketo/deploy.sh` en el VPS.

No hacer commit, push ni deploy sin instrucción explícita. `package-lock.json` es legado.

## Estructura esencial
- Páginas y API: `app/`
- Landing/catálogo: `components/home/`, `data/catalog.json`
- Checkout: `components/checkout/`, `components/payment/`
- Pagos/postventa: `lib/payments/`
- Catálogo Hotmart: `data/hotmart-products.json`, `scripts/hotmart-bulk-api.py`
- Descargas: `lib/downloads/`, `app/api/download/`
- Auth admin: `lib/auth/session.ts`, `app/api/auth/`
- PostgreSQL: `lib/db.ts`
- Deploy: `deploy.sh`, `ecosystem.config.js`
- Mapa profundo: `docs/PROJECT-MAP.md`

## Reglas del proyecto
- La interfaz es móvil primero.
- Recalcular producto, precio, moneda y estado de pago en servidor.
- Entregar solo tras pago aprobado verificado por proveedor/webhook.
- `finalizeSale()` debe seguir siendo idempotente por ID externo; fallos parciales quedan `retry_pending` para el cron.
- No registrar secretos, firmas, tarjeta ni payloads sensibles; nunca probar LIVE con cargos reales.
- No reutilizar una URL Hotmart para otro producto.
- Hotmart conserva solo `ENTREGA_POR_EMAIL_PLANETA_KETO.pdf`; los 25 libros, planificador y 6 ZIP se actualizan en Sanity.
- Antes de entregar: `git diff --check`, `pnpm exec tsc --noEmit`, `pnpm build`.
- Conservar `public/` intacto y no construir manualmente sobre el `.next` vivo.
- Componentes de checkout cerrados no consultan región ni cargan SDK; inicios automáticos deben ser cancelables/deduplicados.
- Producción usa credenciales LIVE. `www` redirige permanentemente al dominio canónico.
- Sustitución de libros: subir 32 assets, verificar hashes y cambiar referencias en una mutación; conservar rollback.
