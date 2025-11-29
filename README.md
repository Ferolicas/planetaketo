# Planeta Keto - Plataforma Completa de Dieta Cetogénica

Plataforma web completa construida con Next.js 15, que incluye tienda online, recetas, blog, foro comunitario, sistema de compras con Stripe, y red social completa.

## ✅ Características Implementadas al 100%

### 🔐 Autenticación Completa
- ✅ Sistema de login/registro funcional
- ✅ Sesiones persistentes con cookies
- ✅ Protección de rutas y middleware
- ✅ Logout completo

### 🏠 Página de Inicio Dinámica
- ✅ Contenido completamente editable desde admin
- ✅ Hero section personalizable
- ✅ Producto destacado dinámico
- ✅ Secciones configurables

### 📚 Sistema de Recetas
- ✅ Grid profesional de recetas
- ✅ Páginas detalladas con videos de YouTube
- ✅ Ingredientes e instrucciones paso a paso
- ✅ Sistema de comentarios funcional
- ✅ CRUD completo desde admin

### 🛒 Tienda Online con Stripe
- ✅ Integración COMPLETA con Stripe
- ✅ Checkout funcional
- ✅ Webhooks configurados
- ✅ Sincronización automática de precios
- ✅ Gestión de productos desde admin

### 💳 Sistema de Compras Completo
- ✅ Flujo de compra end-to-end
- ✅ Emails automáticos con Resend
- ✅ Template profesional de bienvenida
- ✅ Enlaces mágicos de descarga
- ✅ Límite de 2 descargas por compra
- ✅ Expiración de enlaces (30 días)
- ✅ Botón de WhatsApp para soporte

### 📝 Blog Profesional
- ✅ Sistema completo de posts
- ✅ Editor de contenido
- ✅ CRUD desde admin
- ✅ Grid profesional

### 💬 Foro Comunitario
- ✅ Creación de threads
- ✅ Sistema de vistas
- ✅ Gestión desde admin

### 👥 Red Social Completa
- ✅ Sistema de posts con límite de 1 por día
- ✅ Sistema de follows/siguiendo funcional
- ✅ Feed personalizado
- ✅ Perfil de usuario completo
- ✅ Estadísticas de posts y seguidores
- ✅ Sistema de comentarios

### 💬 Sistema de Chat
- ✅ API de mensajería completa
- ✅ Mensajes entre usuarios
- ✅ Estado de lectura
- ✅ Historial de conversaciones

### ⚙️ Panel de Administración Completo
- ✅ Dashboard profesional con sidebar
- ✅ Gestión de Home (logo, hero, producto destacado)
- ✅ CRUD completo de Productos con Stripe sync
- ✅ CRUD completo de Recetas
- ✅ CRUD completo de Blog Posts
- ✅ CRUD completo de Forum Threads
- ✅ Gestor de Imágenes con upload a Supabase
- ✅ Protección por rol (solo admin)

### 🖼️ Gestor de Imágenes
- ✅ Upload a Supabase Storage
- ✅ Galería de imágenes
- ✅ Copiar URLs fácilmente
- ✅ Optimización automática

### 📧 Emails Transaccionales
- ✅ Sistema completo con Resend
- ✅ Template profesional HTML
- ✅ Envío automático post-compra
- ✅ Información de descarga y acceso
- ✅ Botón de WhatsApp integrado

## Tecnologías Utilizadas

- **Framework**: Next.js 15 con App Router y React 19
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS con animaciones personalizadas
- **Base de Datos**: PostgreSQL (Supabase) con Prisma ORM
- **Pagos**: Stripe para procesamiento de pagos
- **Emails**: Resend para envío de correos transaccionales
- **Almacenamiento**: Supabase Storage para imágenes
- **Optimización**: Sharp para procesamiento de imágenes
- **UI**: Lucide React para iconos, Framer Motion para animaciones

## Configuración Inicial

### 1. Requisitos Previos

- Node.js 18+ instalado
- Cuenta de Supabase
- Cuenta de Stripe
- Cuenta de Resend
- PostgreSQL (provisto por Supabase)

### 2. Variables de Entorno

El archivo `.env.local` ya está configurado con tus credenciales. Asegúrate de actualizar:

```env
DATABASE_URL=postgresql://postgres.ibyeukzocqygimmwibxe:[YOUR_DB_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

Reemplaza `[YOUR_DB_PASSWORD]` con tu contraseña de base de datos de Supabase.

### 3. Configurar Base de Datos

```bash
# Push el esquema a la base de datos
npx prisma db push

# Generar el cliente de Prisma
npx prisma generate

# (Opcional) Abrir Prisma Studio para gestionar datos
npx prisma studio
```

### 4. Configurar Stripe Webhooks

1. Instala Stripe CLI: https://stripe.com/docs/stripe-cli
2. Inicia sesión: `stripe login`
3. Forward webhooks localmente:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
4. Copia el webhook signing secret y actualiza `STRIPE_WEBHOOK_SECRET` en `.env.local`

### 5. Configurar Supabase Storage

1. Ve a tu proyecto de Supabase
2. Navega a Storage
3. Crea un bucket llamado `uploads`
4. Configura las políticas de acceso público:
   ```sql
   -- Policy para permitir uploads autenticados
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'uploads');

   -- Policy para permitir acceso público de lectura
   CREATE POLICY "Allow public downloads"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'uploads');
   ```

## Ejecutar el Proyecto

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Proyecto

```
planetaketo/
├── app/                    # App Router de Next.js
│   ├── api/               # API Routes
│   │   ├── checkout/      # Crear sesión de pago
│   │   ├── webhook/       # Webhook de Stripe
│   │   ├── products/      # Endpoints de productos
│   │   └── upload/        # Upload de imágenes
│   ├── recetas/           # Página de recetas
│   ├── tienda/            # Tienda online
│   ├── blog/              # Blog
│   ├── foro/              # Foro comunitario
│   ├── perfil/            # Perfil de usuario
│   ├── admin/             # Panel de administración
│   ├── download/          # Sistema de descargas
│   ├── success/           # Página de éxito post-compra
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página de inicio
│   └── globals.css        # Estilos globales
├── components/            # Componentes React reutilizables
│   ├── home/             # Componentes de la home
│   ├── recipe/           # Componentes de recetas
│   ├── Header.tsx        # Header global
│   └── Footer.tsx        # Footer global
├── lib/                   # Utilidades y configuraciones
│   ├── prisma.ts         # Cliente de Prisma
│   ├── supabase.ts       # Cliente de Supabase
│   ├── stripe.ts         # Cliente de Stripe
│   ├── resend.ts         # Cliente de Resend
│   └── utils.ts          # Funciones auxiliares
├── prisma/
│   └── schema.prisma     # Esquema de base de datos
├── public/               # Archivos estáticos
└── package.json          # Dependencias
```

## Flujo de Compra

1. **Usuario selecciona producto** → Clic en "Comprar Ahora"
2. **Checkout de Stripe** → Usuario completa el pago
3. **Webhook procesa pago** → Se crea:
   - Usuario en la base de datos (si no existe)
   - Registro de compra
   - Enlace mágico de descarga (expira en 30 días, máx. 2 descargas)
4. **Email automático** → Se envía con:
   - Enlace de descarga del producto
   - Acceso al perfil de usuario
   - Botón de soporte por WhatsApp
5. **Usuario descarga** → Accede mediante el enlace mágico

## Panel de Administración

Accede a `/admin` para gestionar:

- Contenido de la página de inicio (logo, hero, productos destacados)
- Productos de la tienda (crear, editar, eliminar)
- Sincronización automática con Stripe
- Recetas (crear, editar, eliminar, agregar videos)
- Posts del blog
- Threads del foro
- Gestor de imágenes

## API Endpoints

### Checkout
```
POST /api/checkout
Body: { productId: string }
Response: { sessionId: string, url: string }
```

### Webhook de Stripe
```
POST /api/webhook
Headers: stripe-signature
Body: Stripe Event
```

### Productos
```
GET /api/products/[id]
Response: Product
```

### Upload de Imágenes
```
POST /api/upload
Body: FormData with file
Response: { url: string, id: string, name: string }
```

## Modelos de Base de Datos

### User
- Información del usuario
- Historial de compras
- Posts y comentarios
- Relaciones sociales (followers/following)
- Mensajes de chat

### Product
- Información del producto
- Integración con Stripe (productId, priceId)
- URL de descarga
- Estado activo/inactivo

### Purchase
- Registro de compras
- Relación con usuario y producto
- ID de pago de Stripe

### Download
- Token único de descarga
- Contador de descargas (máx. 2)
- Fecha de expiración (30 días)

### Recipe
- Recetas con ingredientes e instrucciones (JSON)
- Video de YouTube embebido
- Comentarios

### BlogPost / ForumThread
- Contenido del blog y foro
- Sistema de publicación

### HomeContent
- Contenido dinámico de la home
- Logo, hero, secciones configurables

### Image
- Registro de imágenes subidas
- URLs de Supabase Storage

## Seguridad

- ✅ Validación de webhooks de Stripe
- ✅ Tokens únicos para enlaces de descarga
- ✅ Límites de descarga y expiración
- ✅ Sanitización de entradas
- ✅ Variables de entorno para secretos
- ✅ Políticas de acceso en Supabase

## Optimizaciones

- ✅ Imágenes optimizadas con Sharp
- ✅ Formatos modernos (AVIF, WebP)
- ✅ Lazy loading de imágenes
- ✅ Code splitting automático (Next.js)
- ✅ Turbopack para desarrollo rápido
- ✅ Caching de assets estáticos

## Crear Primer Usuario Admin

Para acceder al panel de administración, necesitas crear un usuario con rol admin:

```sql
-- Conecta a tu base de datos Supabase y ejecuta:
UPDATE "User"
SET role = 'admin'
WHERE email = 'tu@email.com';
```

O crea uno directamente con Prisma Studio:

```bash
npm run db:studio
# Navega a User
# Encuentra tu usuario o crea uno nuevo
# Cambia el campo "role" de "user" a "admin"
```

Luego accede a `/admin` con tus credenciales.

## Rutas Principales

- **Públicas**:
  - `/` - Home
  - `/recetas` - Grid de recetas
  - `/recetas/[slug]` - Detalle de receta
  - `/tienda` - Tienda
  - `/tienda/[id]` - Detalle de producto
  - `/blog` - Blog
  - `/foro` - Foro
  - `/login` - Login
  - `/register` - Registro

- **Protegidas** (requieren autenticación):
  - `/perfil` - Perfil de usuario con red social
  - `/admin` - Panel de administración (requiere rol admin)
  - `/download/[token]` - Descarga de productos

## Funcionalidades Avanzadas

### Sistema de Límite de Posts
Los usuarios solo pueden crear 1 post por día. El sistema valida automáticamente en el backend usando la fecha actual y el último post del usuario.

### Enlaces Mágicos de Descarga
Cada compra genera un enlace único con:
- Token de 64 caracteres
- Máximo 2 descargas
- Expiración de 30 días
- Tracking automático de descargas

### Sincronización con Stripe
Cuando creas o editas un producto en el admin:
1. Se crea/actualiza en Stripe automáticamente
2. Se sincroniza el precio
3. Se guardan los IDs de Stripe en la base de datos
4. Si cambias el precio, se crea un nuevo Price en Stripe y se desactiva el anterior

### Sistema de Seguir/Dejar de Seguir
Los usuarios pueden seguir a otros y ver su lista de "Siguiendo". El sistema valida que no puedas seguirte a ti mismo y permite unfollow fácilmente.

## Próximas Mejoras Opcionales

1. **Chat UI**: Interfaz visual para el sistema de mensajería (API ya implementada)
2. **Likes en posts**: Sistema de likes con contador
3. **Notificaciones**: Sistema de notificaciones push
4. **Tests**: Implementar testing con Jest y Playwright
5. **Analytics**: Integrar Google Analytics
6. **SEO avanzado**: Meta tags dinámicos, sitemap

## Soporte

- **WhatsApp**: +1 917-672-6696
- **Email**: info@planetaketo.es
- **Sitio**: https://planetaketo.es

## Licencia

Todos los derechos reservados © 2025 Planeta Keto
