# Planeta Keto — mapa vivo del proyecto

Actualizado: 2026-10-07 · Rama: `main`

## 1. Resumen operativo

Planeta Keto vende 25 productos digitales individuales y 6 bundles desde una
landing mobile-first. El visitante escoge un producto, el servidor determina
país, pasarela y precio, y el proveedor confirma el pago. Después,
`lib/payments/process-sale.ts` registra la venta y ejecuta una entrega
reconciliable: enlace mágico, correo Resend, newsletter y cuenta Ketoscan. Los
fallos parciales quedan pendientes y un cron los reintenta sin cobrar otra vez.

Producción:

| Pieza | Valor |
|---|---|
| Dominio canónico | `https://planetaketo.es` |
| Directorio VPS | `/apps/planetaketo` |
| PM2 | `planetaketo` |
| Puerto | `3011` |
| Base de datos | PostgreSQL `planetaketo` |
| Proxy/TLS | Caddy |
| Rama desplegable | `main` |
| Deploy | `/apps/planetaketo/deploy.sh` |

`ketoscan/` comparte repositorio, pero es otra aplicación, con proceso,
despliegue y dominio propios.

## 2. Arquitectura y dependencias

```text
Navegador (producto identificado solo por slug de catálogo)
  ├─ Landing / catálogo ──> /api/checkout/region
  ├─ Europa ──> Stripe Payment Element ──> /api/checkout/stripe
  ├─ Colombia ──> Mercado Pago Brick ──> /api/checkout/mercadopago/pay
  └─ Resto/LATAM no CO ──> checkout Hotmart específico del producto

Stripe / Hotmart ──> webhook firmado
Mercado Pago ──────> Webhook firmado o IPN verificada contra API
       └─ finalizeSale()
            ├─ PostgreSQL: customers + payments + download_links
            ├─ newsletter + ketoscan_accounts
            ├─ Sanity: PDF individual o ZIP completo del bundle
            ├─ Resend: correo de compra
            └─ analytics_sessions: venta_completada

Cron cada 5 minutos
  ├─ reconcileApprovedMpPayments()
  │    └─ rescata aprobados MP que perdieron todos sus callbacks
  └─ reconcilePendingDeliveries()
       └─ repara efectos incompletos con locks e idempotencia
```

Componentes centrales:

| Área | Archivos |
|---|---|
| Entrada pública | `app/page.tsx`, `components/home/Landing.tsx` |
| Fuente del catálogo | `data/catalog.json` |
| Botón/modal | `components/checkout/CheckoutButton.tsx`, `components/payment/PaymentModal.tsx` |
| Proveedores cliente | `StripeEmbedded.tsx`, `MercadoPagoBrick.tsx`, `HotmartEmbed.tsx` |
| Precio/región | `app/api/checkout/region/route.ts`, `lib/payments/country-currency.ts`, `lib/payments/fx.ts` |
| Stripe | `app/api/checkout/stripe/route.ts`, `app/api/stripe/webhook/route.ts`, `lib/payments/stripe.ts` |
| Mercado Pago | `app/api/checkout/mercadopago/pay/route.ts`, `app/api/mercadopago/webhook/route.ts`, `lib/payments/mercadopago.ts` |
| Hotmart | `app/api/checkout/hotmart/start/route.ts`, `app/api/hotmart/webhook/route.ts`, `lib/payments/hotmart.ts`, `lib/payments/hotmart-checkouts.ts`, `data/hotmart-products.json` |
| Postventa común | `lib/payments/process-sale.ts` |
| Descarga | `lib/downloads/magic-link.ts`, `app/api/download/[token]/route.ts` |
| Recuperación postventa | `scripts/reconcile-deliveries.ts`, `scripts/reconcile-deliveries.sh` |
| Admin | `app/admin/page.tsx`, `app/api/admin/`, `lib/auth/session.ts` |
| Analítica propia | `lib/analytics/`, `app/api/track/route.ts`, `app/api/consent/route.ts` |

## 3. Rutas

Páginas públicas:

| Ruta | Propósito |
|---|---|
| `/` | Landing y catálogo completo |
| `/catalogo` | Catálogo |
| `/comprar/[slug]` | Ficha/compra de un producto |
| `/recetas`, `/recetas/[slug]` | Recetas publicadas |
| `/blog`, `/blog/[slug]` | Blog |
| `/download/[token]` | Validación y descarga postventa |
| `/gracias` | Retorno de proveedor y confirmación visual |
| `/r`, `/download` | Captación y descarga gratuita |
| `/privacidad`, `/cookies`, `/terminos`, `/aviso-legal`, `/desistimiento` | Documentos legales |
| `/login`, `/admin` | Acceso y panel administrativo |

API de negocio:

| Ruta | Escritura/efecto |
|---|---|
| `GET /api/checkout/region` | Resuelve país, proveedor y precios |
| `POST /api/checkout/stripe` | Crea PaymentIntent con importe recalculado |
| `POST /api/checkout/mercadopago/pay` | Crea pago MP con importe recalculado |
| `POST /api/checkout/hotmart/start` | Marca inicio de checkout |
| `POST /api/{stripe,mercadopago,hotmart}/webhook` | Verifica proveedor y finaliza venta |
| `GET /api/download/validate/[token]` | Valida enlace mágico |
| `GET /api/download/[token]` | Sirve PDF o ZIP y reserva una de 2 descargas de forma atómica |
| `POST /api/lead/{subscribe,download}` | Alta de lead/descarga gratuita |
| `/api/admin/*` | CRUD y métricas del panel; requiere sesión admin |
| `/api/auth/*` | Login, logout y sesión admin |
| `/api/track`, `/api/consent` | Analítica propia sujeta a consentimiento |
| `/api/blog/{daily,ingest}` | Generación/ingesta editorial automatizada |

El `middleware.ts` devuelve 410 para rutas retiradas (`/tienda`, `/foro`,
`/perfil`, `/register`, `/success`) y nunca intercepta `/api/*`.

## 4. Datos

Tablas de venta:

- `customers`: identidad y referencia del cliente en el proveedor.
- `payments`: pago, proveedor, estado, importe, moneda, `product_slug` y estado
  detallado de cumplimiento/reintentos.
- `download_links`: token, producto, caducidad y límite de descargas.
- `newsletter`: alta postventa/captación.
- `ketoscan_accounts`: cuenta creada después de la compra.
- `homeContent`: precio del método principal y contenido editable.

Contenido y operación:

- `blog_posts`, `published_recipes`, `uploads`.
- `admins`.
- `analytics_consent`, `analytics_events`, `analytics_sessions`.
- `leads`, `download_tokens`.
- `users`, `foods`, `daily_menu`, `weekly_menu` pertenecen a funcionalidades
  nutricionales históricas/relacionadas.

Invariantes:

- `payments.stripe_payment_id` conserva el ID externo de cualquier proveedor y
  funciona como clave de idempotencia histórica.
- El nombre `stripe_*` de columnas antiguas no significa que la tabla sea
  exclusiva de Stripe.
- El slug y el precio se validan contra `data/catalog.json` o `homeContent` en
  servidor.
- `download_links.payment_id` es único y cada enlace permite exactamente 2
  descargas, tanto para un PDF como para un ZIP.

## 5. Flujos críticos

### Compra

1. `CheckoutButton` abre `PaymentModal`.
2. `/api/checkout/region` determina país, moneda, precio y proveedor.
3. El proveedor tokeniza/cobra; el servidor nunca recibe datos de tarjeta.
4. El webhook consulta o valida el objeto real del proveedor. La IPN de Mercado
   Pago se acepta solo después de consultar la API y verificar marca, producto,
   referencia, modo LIVE, moneda e importe creados por el servidor.
5. Solo un estado aprobado invoca `finalizeSale()`.
6. `finalizeSale()` bloquea por pago/cliente, registra una sola venta y ejecuta
   efectos idempotentes.
7. Si Resend, DB o un efecto secundario falla, el proveedor recibe 5xx y el pago
   queda `retry_pending`; el reconciliador periódico completa lo pendiente.
8. Aunque Mercado Pago pierda todos sus callbacks, el mismo cron descubre los
   pagos aprobados recientes por API y ejecuta la entrega idempotente.

### Autenticación admin

1. `/api/auth/login` aplica rate limit y valida bcrypt en `admins`.
2. Emite cookie HTTP-only `session`, firmada HMAC-SHA256 con `SESSION_SECRET`.
3. Los endpoints admin vuelven a consultar la sesión y el admin en PostgreSQL.

### Descarga

1. El correo contiene `/download/[token]`.
2. La API comprueba caducidad y número máximo.
3. Un producto individual resuelve su PDF; un bundle resuelve un único ZIP
   privado con todos sus libros.
4. La reserva del contador es atómica y nunca supera 2, incluso con peticiones
   simultáneas.

### Sustitución de libros y packs

1. Sanity mantiene 26 documentos `product` con archivo: 25 libros de pago y el
   planificador gratuito.
2. Los 6 packs viven en documentos `deliveryBundle`; cada `archive` debe
   reconstruirse después de sustituir cualquier PDF incluido.
3. Se suben primero los 32 assets nuevos sin cambiar referencias, se verifican
   tamaño y hash, y después se actualizan las 32 referencias en una sola
   transacción de Sanity.
4. Los assets anteriores no se borran durante la operación: sus referencias se
   guardan para rollback inmediato.
5. Hotmart conserva solo `ENTREGA_POR_EMAIL_PLANETA_KETO.pdf`. Sus compradores
   reciben el enlace mágico de Planeta Keto, por lo que actualizar Sanity también
   actualiza la entrega de las 31 ofertas Hotmart sin duplicar archivos allí.

## 6. Integraciones y variables

Variables necesarias, sin valores:

- Base/auth: `DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`.
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Mercado Pago: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_MP_PUBLIC_KEY`.
- Hotmart: `HOTMART_WEBHOOK_HOTTOK`. Los IDs, ofertas, precios y URLs públicas
  por producto están en `data/hotmart-products.json`; ningún secreto vive allí.
- Entrega/contenido: `RESEND_API_KEY`, `SANITY_PROJECT_ID`,
  `SANITY_DATASET`, `SANITY_API_TOKEN`.
- Automatización: `BLOG_INGEST_SECRET`, proveedores de IA y variables de FX.

No copiar valores de `.env.local` a documentación, logs, commits o respuestas.

## 7. Producción, tareas y observabilidad

- `deploy.sh` hace `git reset --hard origin/main`, instala con pnpm, construye en
  `.next-builds/<id>`, cambia el symlink `.next` atómicamente y ejecuta
  `pm2 startOrReload`.
- Conserva los tres builds más recientes y valida `http://127.0.0.1:3011/`.
- Caddy sirve `planetaketo.es` y redirige `www` al dominio canónico.
- La CSP report-only de Caddy permite Stripe, Hotmart y los recursos que el
  Payment Brick carga desde `*.mercadopago.com`, `*.mercadolibre.com` y
  `*.mlstatic.com`.
- Cron: reconciliación postventa cada 5 minutos, backup específico 03:30,
  ingesta de recetas 06:30 y limpieza de analítica 04:15; existen además
  backups globales del VPS.
- Logs de aplicación: `pm2 logs planetaketo`.
- La aplicación no expone `/api/health`; la comprobación operativa es `/`.

## 8. Matriz de impacto

| Si cambia… | Revisar también… |
|---|---|
| `data/catalog.json` | región/precio, tres proveedores, descarga, email y SEO |
| `PaymentModal` | carga inicial, scroll móvil, estados de los tres proveedores |
| Un webhook | firma, idempotencia, `finalizeSale`, reintentos y logs |
| `process-sale.ts` | DB, Resend, Sanity, Ketoscan, newsletter y analítica |
| Esquema `payments` | tres webhooks, admin y recuperación de entregas |
| Variables `NEXT_PUBLIC_*` | requieren un nuevo build, no solo reload |
| `public/` o `.next` | deploy atómico y reglas de Caddy |
| `middleware.ts` | webhooks, páginas legales y rutas 410 |

## 9. Riesgos y deuda conocida

- Auditoría de pagos 2026-10-07: corregidos en código el bloqueo infinito de
  Stripe y el rechazo de callbacks IPN de Mercado Pago. MP cuenta además con
  descubrimiento periódico de aprobados. Falta desplegar y no existe sandbox
  para ejecutar una aprobación completa sin dinero LIVE. Evidencia en
  `docs/QA-PAYMENTS-2026-10-07.md`.
- Bancos y proveedores externos pueden rechazar, demorar o interrumpir una
  transacción; el sistema evita duplicados y rescata la entrega una vez existe
  confirmación de pago, pero no puede garantizar disponibilidad de terceros.
- Hotmart es solo pasarela: cada producto conserva únicamente un PDF informativo;
  la entrega comercial siempre sale de Planeta Keto por enlace mágico.
- Los PDF con transparencias no deben posprocesarse con Ghostscript
  (`PDFSETTINGS=/ebook`): puede ocultar fondos y convertir sombras en franjas
  negras. La fuente válida es la exportación directa de Chromium/Skia.
- `README.md` conserva descripciones de una arquitectura antigua y no es fuente
  de verdad.
- `package-lock.json` es legado y contiene un cambio local ajeno; no mezclarlo
  con cambios funcionales.

## 10. Checklist de cambio seguro

1. Leer este mapa y el archivo afectado.
2. Confirmar proveedor, producto, precio y efecto postventa implicados.
3. No usar credenciales LIVE para generar cargos de prueba.
4. Ejecutar `git diff --check`.
5. Ejecutar `pnpm exec tsc --noEmit`.
6. Ejecutar `pnpm build`.
7. Desplegar únicamente con autorización.
8. Verificar HTTPS, PM2, logs y recorridos sin cobro.
9. Actualizar este mapa si cambió arquitectura, flujo o gotcha.
