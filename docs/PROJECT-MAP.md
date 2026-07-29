# Planeta Keto — mapa vivo del proyecto

Actualizado: 2026-07-30 · Base auditada: `9b061b5`

## 1. Resumen operativo

Planeta Keto vende productos digitales individuales y bundles desde una landing
mobile-first. El visitante escoge un producto, el servidor determina país,
pasarela y precio, y el proveedor confirma el pago. Después,
`lib/payments/process-sale.ts` registra la venta, crea un enlace mágico de
descarga, añade al cliente al newsletter, crea su cuenta Ketoscan y envía el
correo mediante Resend.

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
Navegador
  ├─ Landing / catálogo ──> /api/checkout/region
  ├─ Stripe Payment Element ──> /api/checkout/stripe ──> Stripe
  ├─ Mercado Pago Brick ──> /api/checkout/mercadopago/pay ──> Mercado Pago
  └─ Hotmart iframe ──> Hotmart

Stripe / Mercado Pago / Hotmart
  └─ webhook firmado
       └─ finalizeSale()
            ├─ PostgreSQL: customers + payments + download_links
            ├─ newsletter + ketoscan_accounts
            ├─ Sanity: origen privado del PDF
            ├─ Resend: correo de compra
            └─ analytics_sessions: venta_completada
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
| Hotmart | `app/api/checkout/hotmart/start/route.ts`, `app/api/hotmart/webhook/route.ts`, `lib/payments/hotmart.ts` |
| Postventa común | `lib/payments/process-sale.ts` |
| Descarga | `lib/downloads/magic-link.ts`, `app/api/download/[token]/route.ts` |
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
| `GET /api/download/[token]` | Sirve PDF y cuenta descarga |
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
- `payments`: pago, proveedor, estado, importe, moneda y `product_slug`.
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

## 5. Flujos críticos

### Compra

1. `CheckoutButton` abre `PaymentModal`.
2. `/api/checkout/region` determina país, moneda, precio y proveedor.
3. El proveedor tokeniza/cobra; el servidor nunca recibe datos de tarjeta.
4. El webhook firmado consulta o valida el objeto real del proveedor.
5. Solo un estado aprobado invoca `finalizeSale()`.
6. `finalizeSale()` es idempotente, registra pago, crea descarga y envía correo.

### Autenticación admin

1. `/api/auth/login` aplica rate limit y valida bcrypt en `admins`.
2. Emite cookie HTTP-only `session`, firmada HMAC-SHA256 con `SESSION_SECRET`.
3. Los endpoints admin vuelven a consultar la sesión y el admin en PostgreSQL.

### Descarga

1. El correo contiene `/download/[token]`.
2. La API comprueba caducidad y número máximo.
3. El PDF se resuelve por producto/bundle y se sirve por proxy desde Sanity.
4. Solo una descarga entregada incrementa el contador.

## 6. Integraciones y variables

Variables necesarias, sin valores:

- Base/auth: `DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`.
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Mercado Pago: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_MP_PUBLIC_KEY`.
- Hotmart: `HOTMART_PRODUCT_ID`, `HOTMART_WEBHOOK_HOTTOK`,
  `NEXT_PUBLIC_HOTMART_CHECKOUT_URL`.
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
- Cron: backup específico 03:30, ingesta de recetas 06:30 y limpieza de
  analítica 04:15; existen además backups globales del VPS.
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

- En la base auditada, cada botón monta un modal cerrado que consulta región; la
  home puede duplicar decenas de peticiones.
- Stripe oculta la dirección del Payment Element sin suministrarla manualmente y
  una excepción puede dejar el botón en “Procesando”.
- Mercado Pago no protege todos los fallos de red/respuesta inválida del Brick.
- Solo existe una URL pública de Hotmart; no debe reutilizarse para productos
  distintos del Método Keto.
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

