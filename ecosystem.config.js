// ============================================================
// PM2 — SOLO la app `planetaketo` (no toca cfanalisis-*, n8n, ketoscan, pk-*)
//
// A prueba de fallos:
//  - PORT=3011 fijo (no se pierde al recrear el proceso).
//  - DATABASE_URL (y el resto del entorno) se leen de .env.local en cada arranque,
//    y se inyectan EXPLÍCITAMENTE en el env del proceso. Así nunca se hereda la
//    DATABASE_URL de otro proyecto (p.ej. cfanalisis) que pudiera estar en el
//    entorno del demonio PM2: lo de .env.local siempre gana.
//
// Para refrescar el entorno tras editar .env.local:
//   pm2 delete planetaketo && pm2 start ecosystem.config.js && pm2 save
// ============================================================
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  throw new Error(`[ecosystem] Falta .env.local en ${envPath}`);
}
const fileEnv = dotenv.parse(fs.readFileSync(envPath));

if (!fileEnv.DATABASE_URL) {
  throw new Error('[ecosystem] .env.local no define DATABASE_URL');
}

module.exports = {
  apps: [
    {
      name: 'planetaketo',
      cwd: __dirname,
      script: 'npm',
      args: 'start', // -> next start (lee el puerto de PORT)
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '600M',
      time: true,
      env: {
        ...fileEnv, // fuente de verdad: .env.local (incluye la DATABASE_URL de planetaketo)
        NODE_ENV: 'production',
        PORT: '3011', // puerto fijo
      },
    },
  ],
};
