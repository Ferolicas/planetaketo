# Cobro con Hotmart — Puesta en marcha

El cobro pasó de **Stripe → Hotmart**. La entrega del libro la seguimos haciendo
**nosotros** (Resend + magic link); Hotmart solo procesa el pago. El checkout va
**embebido en un iframe dentro de nuestro modal** (sin redirección, marca Planeta Keto).

Flujo: el cliente pulsa "Comprar" → modal Planeta Keto con el checkout de Hotmart
embebido → paga (Hotmart gestiona país/métodos) → Hotmart llama a nuestro
**webhook** → `finalizeSale()` registra la venta, da de alta en `newsletter` y
`ketoscan_accounts`, crea el enlace de descarga y **envía el email con el libro**.

---

## 1. Variables de entorno (`.env.local` / VPS)

```bash
# URL del checkout embebido (checkoutMode=2 = embebido, sin redirección)
NEXT_PUBLIC_HOTMART_CHECKOUT_URL=https://pay.hotmart.com/E101576748X?checkoutMode=2
# Token de validación del webhook (ver paso 3). OBLIGATORIO.
HOTMART_WEBHOOK_HOTTOK=xxxxxxxx
# (Opcional) Id numérico del producto para filtrar el webhook a este producto
HOTMART_PRODUCT_ID=
```

> Las variables `STRIPE_*` ya **no las usa el código**. Elimínalas tras confirmar el corte.

## 2. SQL a ejecutar en el VPS (base `planetaketo`, idempotente)

```bash
psql -U planetaketo -d planetaketo -f sql/vps-hotmart.sql
```

Añade la columna `payments.provider` (las filas viejas quedan como `stripe`, las
nuevas de Hotmart entran como `hotmart`). Reutilizamos `stripe_payment_id` para
guardar el `transaction` de Hotmart (clave de idempotencia).

## 3. Configuración en el panel de Hotmart

1. **Webhook (Postback):** Herramientas → Webhook → versión **2.0.0**
   - URL: `https://planetaketo.es/api/hotmart/webhook`
   - Eventos: **Compra aprobada** (`PURCHASE_APPROVED`) y **Compra completa** (`PURCHASE_COMPLETE`).
   - Copia el **hottok** que te da Hotmart y ponlo en `HOTMART_WEBHOOK_HOTTOK`.
2. **Página de gracias (thank-you):** en la oferta/checkout del producto, fija la
   página de agradecimiento a `https://planetaketo.es/gracias`.
   - Así, tras aprobar el pago, el iframe navega a NUESTRA página (mismo dominio),
     que avisa al modal para mostrar el estado "¡Gracias!" — todo con marca Planeta Keto.
   - Si no se puede, el flujo sigue funcionando: se ve la confirmación de Hotmart
     dentro del iframe y el email llega igual por el webhook.
3. **Entrega del producto:** asegúrate de que Hotmart **no entregue el libro**
   (sin archivo/área de miembros con el PDF). El único sitio para obtener el libro
   debe ser nuestro email. (Hotmart puede enviar su propio correo de confirmación
   de compra; lo importante es que el PDF lo entregamos solo nosotros.)
4. **Precio/monedas:** configura el precio (10€) y precios locales en el producto.
   El precio que muestra la web es solo informativo; **el cobro real es el de Hotmart**.
5. **Dominio:** si Hotmart pide autorizar dominios para el checkout embebido, añade
   `planetaketo.es`.

## 4. Caddy / CSP (si aplica)

Si sirves una cabecera `Content-Security-Policy`, permite Hotmart:

```
frame-src https://*.hotmart.com;
script-src ... https://static.hotmart.com;
style-src  ... https://static.hotmart.com;
img-src    ... https://static.hotmart.com;
```

(El modal usa un `<iframe src="pay.hotmart.com">`; si no hay CSP, no hay que tocar nada.)

## 5. Verificación

- **Lógica del webhook (local, sin efectos):** `npx tsx scripts/test-hotmart-webhook.ts`
- **Extremo a extremo:** activa el **modo sandbox** de Hotmart y haz una compra de
  prueba. Comprueba que:
  1. El checkout se ve embebido dentro del modal (sin salir del sitio).
  2. Llega el email con el enlace de descarga (Resend).
  3. Se crea la fila en `payments` (`provider='hotmart'`) y la cuenta en
     `ketoscan_accounts`.

> ⚠️ Un POST con `PURCHASE_APPROVED` al webhook **procesa una venta real**
> (email + alta de cuentas). Usa sandbox o un email de prueba que controles.

## 6. Corte a producción (cutover)

1. Deploy con las variables de Hotmart configuradas.
2. Ejecuta `sql/vps-hotmart.sql`.
3. Activa el webhook en Hotmart y haz una compra sandbox de validación.
4. Cuando esté validado: quita las variables `STRIPE_*`, desinstala dependencias
   (`npm install` ya las dejó fuera de `package.json`: `stripe`, `@stripe/stripe-js`,
   `@stripe/react-stripe-js`) y, si quieres, retira el webhook de Stripe.

## Notas

- La página `/success` (antiguo `return_url` de Stripe) queda huérfana; inofensiva.
- `/tienda/[id]` es una página antigua del catálogo multiproducto (ya llamaba a
  endpoints inexistentes); se le quitó el resto de Stripe pero no es el flujo vivo.
- Docs antiguos de Stripe (`INSTRUCCIONES_STRIPE.md`, etc.) quedan obsoletos.
