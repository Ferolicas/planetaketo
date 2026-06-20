#!/usr/bin/env bash
# Deploy de planetaketo en el VPS. Uso manual:  ssh vps 'bash /apps/planetaketo/deploy.sh'
#
# ATOMIC BUILD-SWAP: se construye en un directorio NUEVO (.next-builds/<id>) sin tocar
# el `.next` vivo, y al terminar se cambia el symlink `.next` de forma atómica (rename(2)).
# Así el sitio sirve el build anterior COMPLETO durante todo el `next build`, eliminando
# la ventana de 500 que provoca reconstruir en sitio.
#
# NO toca ketoscan: es una app aparte en ./ketoscan con su propio proceso pm2 (:3001)
# y su propio `.next`. Aquí solo se reconstruye y recarga la app raíz `planetaketo` (:3011).
set -euo pipefail
APP="planetaketo"
PORT="3011"
DIR="/apps/planetaketo"

export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" || true

cd "$DIR"
git fetch origin main
git reset --hard origin/main

# Gestor real del proyecto: pnpm (hay node_modules/.pnpm). --frozen para reproducibilidad.
pnpm install --frozen-lockfile || pnpm install

# 1) Construir en un directorio nuevo (el `.next` vivo NO se toca durante el build).
ID="build-$(date +%Y%m%d%H%M%S)"
mkdir -p .next-builds
NEXT_DIST_DIR=".next-builds/${ID}" SKIP_TYPECHECK=1 pnpm build

# 2) Auto-migración idempotente: si `.next` todavía es un directorio real (primera vez
#    con este deploy.sh), lo apartamos para pasar al esquema de symlink.
if [ -e .next ] && [ ! -L .next ]; then
  mv .next ".next-builds/legacy-$(date +%s)"
fi

# 3) Swap ATÓMICO del symlink `.next` -> nuevo build (rename(2) sobre el symlink).
ln -sfn ".next-builds/${ID}" .next.incoming
mv -Tf .next.incoming .next

# 4) Recargar SOLO planetaketo (ecosystem lee .env.local; en runtime `.next` = symlink).
pm2 startOrReload ecosystem.config.js --update-env
pm2 save

# 5) Conservar solo los 3 builds más recientes; limpiar restos.
ls -1dt .next-builds/build-* 2>/dev/null | tail -n +4 | xargs -r rm -rf
ls -1dt .next-builds/legacy-* 2>/dev/null | tail -n +2 | xargs -r rm -rf

# planetaketo no expone /api/health: comprobamos que `/` responde 200 tras el reload.
for i in $(seq 1 15); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${PORT}/"; then
    echo "Deploy OK -> https://planetaketo.es (${ID})"
    exit 0
  fi
  sleep 2
done

echo "Healthcheck FALLO tras el deploy"
pm2 logs "${APP}" --lines 30 --nostream || true
exit 1
