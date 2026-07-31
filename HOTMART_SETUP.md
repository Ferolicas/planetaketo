# Hotmart como pasarela de Planeta Keto

Hotmart procesa pagos para LATAM excepto Colombia y sirve como respaldo para
países no europeos. Colombia usa Mercado Pago y Europa usa Stripe. Ninguna de
las tres pasarelas decide qué archivo se entrega: el producto se valida en el
servidor y Planeta Keto envía un magic link por Resend.

## Fuente de verdad

- `data/catalog.json`: 25 productos, 6 packs y precios EUR.
- `data/hotmart-products.json`: ID, oferta y URL de checkout de cada uno de los
  31 productos. Es público y no contiene credenciales.
- `scripts/hotmart-bulk-api.py`: aprovisionamiento y auditoría masiva por API.
- `HOTMART_WEBHOOK_HOTTOK`: único secreto Hotmart necesario en runtime.

No usar una URL de checkout para otro slug: el ID firmado por Hotmart se vuelve
a mapear contra el manifiesto antes de entregar el producto.

## Webhook

La configuración de Planeta Keto debe estar activa para **Todos los productos**:

- URL: `https://planetaketo.es/api/hotmart/webhook`
- Versión: `2.0.0`
- Eventos: `PURCHASE_APPROVED` y `PURCHASE_COMPLETE`

El endpoint valida `X-HOTMART-HOTTOK`, ignora productos ajenos y responde 5xx
cuando una entrega confirmada queda incompleta para que Hotmart reintente.
`finalizeSale()` y Resend son idempotentes, por lo que ambos eventos no duplican
cliente, pago, correo ni enlace.

## Hotmart no entrega los libros

Cada producto Hotmart conserva un único archivo
`ENTREGA_POR_EMAIL_PLANETA_KETO.pdf`. Los PDF comerciales y los ZIP privados de
los packs viven en Sanity. Después del pago, el correo de Planeta Keto entrega
un enlace con 30 días de vigencia y un máximo atómico de 2 descargas.

## Operación por API

Con una sesión autenticada de Hotmart disponible por CDP:

```bash
python3 scripts/hotmart-bulk-api.py status
python3 scripts/hotmart-bulk-api.py manifest
```

`status` verifica los 31 productos, estado ACTIVE, precio de catálogo, oferta y
que solo exista el PDF informativo. `manifest` regenera y valida las 31 URLs de
checkout. Los comandos de mutación (`create`, `bundles`, `gateway-only`, `all`)
solo se ejecutan durante aprovisionamiento autorizado.

## Verificación segura

```bash
pnpm exec tsx scripts/test-hotmart-webhook.ts
```

No enviar manualmente un evento aprobado con datos reales: activa entrega,
correo y alta de cliente. Para QA sin cobro se verifican firma rechazada,
enrutado regional, checkouts cargables y descargas con filas `qa-*` temporales.
