# 🚀 Instrucciones para Configurar el Sistema de Pagos

## ✅ Todo el código está implementado y listo

He creado un sistema completo de ventas con Stripe + Resend + Supabase. Ahora solo necesitas seguir estos pasos para activarlo:

---

## 📋 Paso 1: Crear las Tablas en Supabase

1. Ve a tu proyecto de Supabase: https://app.supabase.com/project/ibyeukzocqygimmwibxe

2. En el menú lateral, ve a **SQL Editor**

### Primera Parte - Crear tabla homeContent:

3. Abre el archivo `supabase-fix-homeContent.sql` que está en la raíz del proyecto

4. Copia **TODO** el contenido del archivo

5. Pégalo en el SQL Editor de Supabase

6. Haz clic en **Run** para ejecutar el script

Esto creará:
- Tabla `homeContent` con los campos de precio
- Valores por defecto (€39.75 regular, €19.75 descuento, 50% off)
- Políticas de seguridad

### Segunda Parte - Crear tablas de clientes y pagos:

7. Ahora abre el archivo `supabase-schema.sql` (salta la primera sección de homeContent)

8. Copia desde la línea que dice `-- Create customers table` hasta el final

9. Pégalo en el SQL Editor de Supabase

10. Haz clic en **Run** para ejecutar el script

Esto creará:
- Tabla `customers` (clientes)
- Tabla `payments` (pagos)
- Tabla `download_links` (enlaces de descarga)
- Todos los índices y políticas de seguridad

---

## 📋 Paso 2: Verificar que el PDF está en Supabase Storage

1. Ve a **Storage** en Supabase: https://app.supabase.com/project/ibyeukzocqygimmwibxe/storage/buckets

2. Busca el bucket llamado **"producto"**

3. Verifica que dentro esté el archivo: **"El Metodo keto Definitivo - Planeta Keto.pdf"**

4. Si no existe el bucket o el archivo:
   - Crea el bucket "producto" como **público**
   - Sube el PDF con el nombre exacto: `El Metodo keto Definitivo - Planeta Keto.pdf`

---

## 📋 Paso 3: Configurar el Webhook de Stripe

1. Ve a tu Dashboard de Stripe: https://dashboard.stripe.com/webhooks

2. Haz clic en **"Add endpoint"**

3. Configura así:
   - **Endpoint URL**: `https://planetaketo.es/api/stripe/webhook`
   - **Events to send**: Selecciona solo `checkout.session.completed`

4. Haz clic en **"Add endpoint"**

5. **Copia el "Signing secret"** que empieza con `whsec_...`

6. Actualiza el archivo `.env.local` con este nuevo webhook secret:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_TU_NUEVO_SECRET_AQUI
   ```

**IMPORTANTE**: El webhook secret que está ahora mismo en `.env.local` probablemente sea diferente al que acabas de crear. Tienes que reemplazarlo.

---

## 📋 Paso 4: Configurar Resend (Ya está listo)

Tu configuración de Resend ya está lista:
- Email remitente: `info@planetaketo.es`
- API Key configurada: ✅
- Template de email creado: ✅

Solo verifica que el dominio `planetaketo.es` esté verificado en Resend:
1. Ve a https://resend.com/domains
2. Verifica que `planetaketo.es` esté en la lista y verificado
3. Si no está, agrégalo y sigue las instrucciones para verificarlo

---

## 🎯 ¿Qué hace el sistema?

### Cuando un cliente hace clic en "Comprar Ahora":
1. ✅ Se abre el checkout de Stripe con el precio configurado en `/admin`
2. ✅ El cliente ingresa su tarjeta, nombre y email en Stripe
3. ✅ Stripe procesa el pago

### Cuando el pago es exitoso:
1. ✅ Stripe envía una notificación al webhook
2. ✅ El sistema guarda el cliente en Supabase (con nombre, email, país, etc.)
3. ✅ El sistema guarda el pago en Supabase
4. ✅ Se genera un enlace mágico único con límite de 2 descargas
5. ✅ Se envía un email automático con Resend que incluye:
   - Saludo personalizado con el nombre del cliente
   - Enlace de descarga del PDF
   - Botón de soporte WhatsApp (+19176726696)
   - Template hermoso con los colores de Planeta Keto

### El enlace de descarga:
- ✅ Es permanente
- ✅ Permite máximo 2 descargas
- ✅ Descarga el PDF directamente desde Supabase
- ✅ Muestra descargas restantes
- ✅ Tiene botón de soporte WhatsApp

---

## 🎨 Panel de Admin

En `/admin` puedes:
- ✅ Cambiar el precio regular (ej: €39.75)
- ✅ Cambiar el precio con descuento (ej: €19.75)
- ✅ Cambiar el porcentaje de descuento (ej: 50%)
- ✅ Los precios se sincronizan automáticamente con Stripe

---

## 🧪 Cómo Probar

### Modo Test (recomendado primero):

1. Cambia las claves en `.env.local` a las de test:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

2. Usa una tarjeta de prueba de Stripe:
   - Número: `4242 4242 4242 4242`
   - Fecha: Cualquier fecha futura
   - CVC: Cualquier 3 dígitos
   - Nombre: Cualquier nombre

3. Completa la compra y verifica que:
   - Se guarda en Supabase
   - Recibes el email
   - El enlace de descarga funciona

### Modo Live (producción):

Las claves LIVE ya están en `.env.local`, solo asegúrate de:
1. Que el webhook esté configurado con la URL de producción
2. Que el dominio de Resend esté verificado
3. Que las tablas de Supabase estén creadas

---

## ❓ Preguntas Frecuentes

**Q: ¿Dónde cambio los precios?**
A: Ve a `/admin` → sección "Inicio" → edita los precios → Guardar Cambios

**Q: ¿Cómo sé si el webhook está funcionando?**
A: En Stripe Dashboard → Webhooks → verás los intentos de entrega y si fueron exitosos

**Q: ¿Puedo cambiar el número de WhatsApp?**
A: Sí, edita el archivo `app/api/stripe/webhook/route.ts` en la línea 7:
```typescript
const WHATSAPP_NUMBER = '+19176726696'; // Cambia aquí
```

**Q: ¿Puedo cambiar el límite de descargas?**
A: Sí, edita `lib/downloads/magic-link.ts` en la línea 13:
```typescript
maxDownloads: 2, // Cambia el número aquí
```

**Q: ¿Dónde veo los pagos y clientes?**
A: En Supabase → Table Editor → Tablas `customers` y `payments`

---

## ✨ ¡Listo!

Tu sistema de ventas está completamente funcional. Solo necesitas:
1. Ejecutar el SQL en Supabase
2. Configurar el webhook en Stripe
3. Verificar que el PDF esté subido

¡Y ya puedes empezar a vender! 💚
