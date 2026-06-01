# 🥑 Planeta Keto Scan

PWA móvil para escanear alimentos con IA, controlar macros keto y armar menús diarios y semanales.

## Stack

- **Next.js 14** (App Router) + TypeScript estricto
- **PostgreSQL** con `pg` puro (sin ORM)
- **Tailwind CSS** + componentes estilo shadcn/ui
- **OpenAI API** (visión; modelo configurable vía `OPENAI_MODEL`, p.ej. `gpt-4o`) — solo server-side
- **PWA** completa: `manifest.json` + service worker
- Despliegue con **PM2** + **Nginx** (reverse proxy, SSL ready)

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
├── ecosystem.config.js  # PM2
└── nginx.conf           # Nginx (SSL ready)
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

> El usuario por defecto (`DEFAULT_USER_ID`) se crea automáticamente al primer
> request de cualquier API si aún no existe, además de por `npm run db:init`.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL |
| `OPENAI_API_KEY` | Clave de OpenAI (**solo server-side**, sin `NEXT_PUBLIC_`) |
| `OPENAI_MODEL` | Modelo de visión (por defecto `gpt-4o`) |
| `SESSION_SECRET` | Secreto para firmar la cookie de sesión (login multiusuario) |
| `DEFAULT_USER_ID` | UUID del usuario único (hasta implementar auth) |
| `NEXT_PUBLIC_BASE_PATH` | `/ketoscan` |

## Funcionalidades

- **Alimentos**: CRUD + **escaneo con IA** (foto de etiqueta o plato → macros por 100 g).
- **Menú del día**: agregar alimentos, ajustar gramos, ver macros vs objetivo y
  **reestructurar** (optimización determinista que cuadra los macros ajustando gramos).
- **Menú semanal**: generación con IA de un plan de 7 días usando solo tus alimentos.
- **Yo**: perfil con cálculo de **TDEE** (Mifflin-St Jeor) y objetivos de macros según el tipo de dieta (keto / low carb / normal).

## Despliegue en VPS (PM2 + Nginx)

```bash
# En el servidor
npm ci
npm run build
npm run db:init

# Iconos (si hiciera falta regenerarlos)
npm run icons

# Arrancar con PM2
pm2 start ecosystem.config.js --env production
pm2 save && pm2 startup

# Nginx
sudo cp nginx.conf /etc/nginx/sites-available/ketoscan
sudo ln -s /etc/nginx/sites-available/ketoscan /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

La app queda disponible en `https://tu-dominio.com/ketoscan/alimentos`.

## Seguridad

- La clave de OpenAI **nunca** llega al cliente: todo el uso de IA ocurre en API routes.
- Toda entrada de usuario se valida con **Zod** antes de tocar la BD.
- Headers de seguridad (CSP, HSTS, X-Frame-Options…) en `next.config.js`.
- Rate limiting en memoria para los endpoints de IA (`/api/scan`, `/api/generate-menu`).
