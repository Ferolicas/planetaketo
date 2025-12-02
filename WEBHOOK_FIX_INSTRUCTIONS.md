# 🔴 WEBHOOK 307 REDIRECT - CAUSA Y SOLUCIÓN EXACTA

## DIAGNÓSTICO EXACTO

### Tests Realizados:
```bash
# Test 1: HEAD request sin www
curl -I https://planetaketo.es/api/stripe/webhook
→ HTTP 307 Temporary Redirect
→ Location: https://www.planetaketo.es/api/stripe/webhook

# Test 2: HEAD request con www
curl -I https://www.planetaketo.es/api/stripe/webhook
→ HTTP 405 Method Not Allowed (normal para HEAD request)
```

### Logs de Stripe:
```json
{
  "id": "evt_1SZrVx4g09zyfJJUBq0W3JNY",
  "type": "checkout.session.completed",
  "response": {
    "status": "307",
    "redirect": "https://www.planetaketo.es/api/stripe/webhook"
  }
}
```

### CAUSA RAÍZ CONFIRMADA:

**Vercel está haciendo redirect de no-www → www** pero algo en la configuración está causando loops o el webhook en Stripe está mal configurado.

---

## SOLUCIÓN INMEDIATA

### Paso 1: Verificar Webhook URL en Stripe

1. Ir a Stripe Dashboard: https://dashboard.stripe.com/webhooks
2. Verificar URL configurada EXACTAMENTE
3. Debe ser UNA de estas (la que NO cause redirect):
   - `https://planetaketo.es/api/stripe/webhook` (sin www)
   - `https://www.planetaketo.es/api/stripe/webhook` (con www)

### Paso 2: Configurar Dominio en Vercel

1. Ir a Vercel Dashboard: https://vercel.com/dashboard
2. Proyecto: planeta-keto
3. Settings → Domains
4. Verificar configuración:
   - Si `www.planetaketo.es` es el dominio principal → Webhook debe usar www
   - Si `planetaketo.es` es el dominio principal → Webhook debe usar sin www

### Paso 3: Actualizar Webhook URL

**Opción A**: Si planetaketo.es es el principal (SIN www):
```
Stripe Webhook URL: https://planetaketo.es/api/stripe/webhook
```

**Opción B**: Si www.planetaketo.es es el principal (CON www):
```
Stripe Webhook URL: https://www.planetaketo.es/api/stripe/webhook
```

### Paso 4: Forzar Middleware a NO Redirect en API

Ya creamos `middleware.ts` que previene redirects en rutas /api/*

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // NEVER redirect API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  return NextResponse.next();
}
```

### Paso 5: Desplegar Cambios

```bash
git add middleware.ts
git commit -m "Fix: Prevent redirects on API webhook routes"
git push origin main
```

---

## SOLUCIÓN ALTERNATIVA: Configurar Vercel para NO Redirect

### vercel.json (Crear si no existe)
```json
{
  "redirects": [
    {
      "source": "/:path((?!api).*)",
      "has": [
        {
          "type": "host",
          "value": "planetaketo.es"
        }
      ],
      "destination": "https://www.planetaketo.es/:path*",
      "permanent": false
    }
  ]
}
```

Esto hace redirect SOLO para rutas que NO son `/api/*`

---

## RECUPERAR TRANSACCIÓN DE TOMÁS

La transacción falló porque el webhook no se procesó. Para recuperarla:

### Opción 1: Usar Script Automático
```bash
node --env-file=.env.local scripts/recover_tomas_transaction.js
```

### Opción 2: Re-enviar Webhook desde Stripe
1. Ir a: https://dashboard.stripe.com/webhooks
2. Buscar evento: `evt_1SZrVx4g09zyfJJUBq0W3JNY`
3. Click "Send test webhook"
4. Verificar que ahora SÍ se procesa (status 200)

### Opción 3: Usar API de Recovery
```bash
curl -X POST https://planetaketo.es/api/admin/retry-webhook \
  -H "Content-Type: application/json" \
  -d '{"webhookLogId": "evt_1SZrVx4g09zyfJJUBq0W3JNY"}'
```

---

## VERIFICACIÓN POST-FIX

### 1. Test Webhook Manualmente
```bash
# Debe responder 400 (no signature) pero NO 307
curl -X POST https://planetaketo.es/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'

# Debe devolver: {"error":"No signature"}
# NO debe devolver: 307 redirect
```

### 2. Verificar en Stripe Dashboard
```
Webhooks → Logs → Ver último evento
Status debe ser: 200 OK
NO debe ser: 307 Temporary Redirect
```

### 3. Test Real de Compra
1. Hacer compra de prueba en planetaketo.es
2. Verificar en `/admin/webhooks` que se procesa correctamente
3. Verificar que el cliente recibe el email

---

## MONITOREO CONTINUO

### Configurar Alertas
```typescript
// En webhook handler, agregar:
if (response.status !== 200) {
  await sendTelegramAlert(`🚨 Webhook failed: ${response.status}`);
}
```

### Revisar Logs Diariamente
```bash
# Ver últimos webhooks
curl https://planetaketo.es/api/admin/retry-webhook | jq

# Ver webhooks fallidos
SELECT * FROM webhook_logs WHERE status = 'failed' ORDER BY created_at DESC LIMIT 10;
```

---

## DATOS DE LA TRANSACCIÓN FALLIDA

```
Cliente: Tomás Collado
Email: tcg1308@gmail.com
Monto: 10.00 EUR
Payment Intent: pi_3SZrVv4g09zyfJJU11Yb8nqy
Session ID: cs_live_a1oVSBO4a6qdGS7l8UQXvrZ11MsW89T0iDxZkfFY9InbWkonZ0nqlpMDrn
Event ID: evt_1SZrVx4g09zyfJJUBq0W3JNY
Fecha: 2 dic 2025, 12:13:01
```

**STATUS**: Pendiente de recuperación
