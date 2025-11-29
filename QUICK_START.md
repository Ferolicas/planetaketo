# Guía de Inicio Rápido - Planeta Keto

## Pasos para Ejecutar el Proyecto

### 1. Configurar la Base de Datos

Primero, necesitas obtener la contraseña de tu base de datos PostgreSQL de Supabase y actualizar el archivo `.env.local`:

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Navega a **Settings** → **Database**
3. Copia la contraseña de la base de datos
4. Abre `.env.local` y reemplaza `[YOUR_DB_PASSWORD]` en la línea del `DATABASE_URL`:

```env
DATABASE_URL=postgresql://postgres.ibyeukzocqygimmwibxe:TU_CONTRASEÑA_AQUI@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 2. Inicializar la Base de Datos

```bash
# Push el esquema de Prisma a la base de datos
npm run db:push

# Poblar la base de datos con datos de ejemplo
npm run db:seed
```

Esto creará:
- Contenido de la página de inicio
- 1 producto de ejemplo
- 3 recetas de ejemplo
- 3 posts de blog
- 3 threads del foro

### 3. Configurar Supabase Storage

1. Ve a tu proyecto de Supabase
2. Click en **Storage** en el menú lateral
3. Click en **Create bucket**
4. Nombre del bucket: `uploads`
5. Marca como **Public bucket**
6. Click en **Create bucket**

### 4. Configurar Stripe Webhooks (Opcional para pruebas locales)

Para que los webhooks funcionen en desarrollo local:

```bash
# Instala Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe

# Inicia sesión
stripe login

# Forward webhooks a tu servidor local
stripe listen --forward-to localhost:3000/api/webhook
```

Copia el webhook signing secret que aparece y actualízalo en `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5. Ejecutar el Proyecto

```bash
# Modo desarrollo (con Turbopack para velocidad máxima)
npm run dev
```

Abre tu navegador en [http://localhost:3000](http://localhost:3000)

## Rutas Disponibles

- **Home**: `/`
- **Recetas**: `/recetas`
- **Tienda**: `/tienda`
- **Blog**: `/blog`
- **Foro**: `/foro`
- **Perfil**: `/perfil`
- **Admin**: `/admin` (panel de administración)

## Gestión de Base de Datos

```bash
# Ver y editar datos en interfaz visual
npm run db:studio
```

Esto abrirá Prisma Studio en http://localhost:5555

## Probar el Flujo de Compra

1. Ve a `/tienda`
2. Click en el producto
3. Click en "Comprar Ahora"
4. Usa las tarjetas de prueba de Stripe:
   - **Éxito**: `4242 4242 4242 4242`
   - Cualquier fecha futura y CVC
5. Completa el checkout
6. Serás redirigido a `/success`
7. Revisa tu email para el enlace de descarga

## Crear Contenido

### Agregar un Producto

1. Abre Prisma Studio: `npm run db:studio`
2. Click en **Product**
3. Click en **Add record**
4. Llena los campos:
   - name: "Nombre del Producto"
   - description: "Descripción..."
   - price: 29.99
   - isActive: true
5. Click en **Save**

### Agregar una Receta

1. Abre Prisma Studio
2. Click en **Recipe**
3. Click en **Add record**
4. Llena los campos:
   - title: "Título de la Receta"
   - slug: "titulo-receta" (sin espacios, minúsculas)
   - description: "Descripción..."
   - duration: "30 minutos"
   - difficulty: "Fácil"
   - ingredients: ["ingrediente 1", "ingrediente 2"]
   - instructions: ["paso 1", "paso 2"]
   - videoUrl: "https://www.youtube.com/embed/VIDEO_ID" (opcional)
   - isPublished: true
5. Click en **Save**

## Subir Imágenes

Para subir imágenes a Supabase:

```bash
# Método 1: Usar el API endpoint
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/image.jpg"

# Respuesta:
# { "url": "https://...", "id": "...", "name": "..." }
```

Luego usa esa URL en tus productos, recetas, blog posts, etc.

## Problemas Comunes

### Error: "Database connection failed"
- Verifica que la contraseña en `DATABASE_URL` sea correcta
- Asegúrate de tener conexión a internet

### Error: "Stripe webhook failed"
- Si estás probando localmente, asegúrate de tener `stripe listen` corriendo
- Verifica que `STRIPE_WEBHOOK_SECRET` esté configurado correctamente

### Error: "Upload failed"
- Verifica que el bucket `uploads` exista en Supabase
- Asegúrate de que sea público
- Verifica las credenciales de Supabase en `.env.local`

## Siguientes Pasos

1. **Personaliza el contenido** de la home page desde Prisma Studio
2. **Agrega tus productos** con precios reales
3. **Crea recetas** con tus propias imágenes
4. **Configura Stripe en modo producción** cuando estés listo
5. **Personaliza los estilos** en `app/globals.css` y Tailwind config

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start

# Base de datos
npm run db:push    # Sincronizar esquema
npm run db:seed    # Poblar datos de ejemplo
npm run db:studio  # Interfaz visual

# Calidad
npm run lint       # Verificar código
```

## Soporte

Si tienes problemas, revisa:
- El archivo `README.md` completo
- La documentación de Next.js: https://nextjs.org/docs
- La documentación de Prisma: https://www.prisma.io/docs
- La documentación de Stripe: https://stripe.com/docs

¡Disfruta construyendo Planeta Keto! 🥑🥓
