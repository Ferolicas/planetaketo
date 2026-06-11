# 🥑 Planeta Keto Scan

PWA móvil para escanear alimentos con IA, controlar macros keto y armar menús diarios y semanales.

## Stack

- **Next.js 14** (App Router) + TypeScript estricto
- **PostgreSQL** con `pg` puro (sin ORM)
- **Tailwind CSS** + componentes estilo shadcn/ui
- **OpenAI API** (visión; modelo configurable vía `OPENAI_MODEL`, p.ej. `gpt-4o`) — solo server-side
- **PWA** completa: `manifest.json` + service worker
- Despliegue con **PM2** + **Caddy** (reverse proxy con SSL automático)

La app se sirve bajo el path **`/ketoscan`** (configurado en `next.config.js` como `basePath`).

## Estructura

```
ketoscan/
├── app/                 # Páginas (alimentos, menu-dia, menu-semanal, yo) + API routes
├── components/          # UI (layout, alimentos, menu-dia, menu-semanal, yo, ui/)
├── lib/                 # db, anthropic, queries/, calculations/, validations/
├── sql/schema.sql       # Esquema de base de datos
├── types/index.ts       # Tipos globales
├── public/              # manifest.json, sw.js, icons/
├── scripts/             # init-db.mjs, generate-icons.mjs
└── ecosystem.config.js  # PM2
```

## Puesta en marcha (local)

1. **Variables de entorno**

   ```bash
   cp .env.example .env.local
   # Edita .env.local: DATABASE_URL, OPENAI_API_KEY, OPENAI_MODEL, SESSION_SECRET
   ```

2. **Base de datos** (crea tablas + usuario por defecto)

   ```bash
   createdb ketoscan          # si no existe
   npm run db:init
   ```

3. **Dependencias y desarrollo**

   ```bash
   npm install
   npm run dev
   # http://localhost:3000/ketoscan/alimentos
   ```

> Auth multiusuario: las cuentas viven en `ketoscan_accounts` y se crean desde
> el admin de planetaketo (o automáticamente con la compra). El perfil en
> `users` se garantiza en el primer login.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL |
| `OPENAI_API_KEY` | Clave de OpenAI (**solo server-side**, sin `NEXT_PUBLIC_`) |
| `OPENAI_MODEL` | Modelo de visión (por defecto `gpt-4o`) |
| `SESSION_SECRET` | Secreto para firmar la cookie de sesión (**obligatoria en producción**) |
| `NEXT_PUBLIC_BASE_PATH` | Vacío: se sirve en la raíz de `scan.planetaketo.es` |

## Funcionalidades

- **Alimentos**: CRUD + **escaneo con IA** (foto de etiqueta o plato → macros por 100 g).
- **Menú del día**: agregar alimentos, ajustar gramos, ver macros vs objetivo y
  **reestructurar** (optimización determinista que cuadra los macros ajustando gramos).
- **Menú semanal**: generación con IA de un plan de 7 días usando solo tus alimentos.
- **Yo**: perfil con cálculo de **TDEE** (Mifflin-St Jeor) y objetivos de macros según el tipo de dieta (keto / low carb / normal).

## Despliegue en VPS (PM2 + Caddy)

```bash
# En el servidor (/apps/planetaketo/ketoscan)
npm ci
npm run build
npm run db:init

# Iconos (si hiciera falta regenerarlos)
npm run icons

# Arrancar con PM2
pm2 start ecosystem.config.js --env production
pm2 save && pm2 startup
```

El proxy lo gestiona Caddy (`/etc/caddy/Caddyfile`, bloque `scan.planetaketo.es`)
con SSL automático. La app queda disponible en `https://scan.planetaketo.es`.

## Seguridad

- La clave de OpenAI **nunca** llega al cliente: todo el uso de IA ocurre en API routes.
- Toda entrada de usuario se valida con **Zod** antes de tocar la BD.
- Headers de seguridad (CSP, HSTS, X-Frame-Options…) en `next.config.js`.
- Rate limiting en memoria para los endpoints de IA (`/api/scan`, `/api/generate-menu`)
  y de auth (`/api/auth/login`, `/api/auth/change-password`).
- Healthcheck en `GET /api/health`.
