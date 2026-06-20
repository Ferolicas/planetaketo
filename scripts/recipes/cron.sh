#!/usr/bin/env bash
# ============================================================
# Cron de extracción de recetas (Fase 2 — automatización).
# Detecta vídeos de receta NUEVOS en youtube_analytics y los publica en
# planetaketo. Idempotente: solo procesa los pendientes (no toca los ya hechos
# ni los editados a mano). Las páginas y el sitemap los recogen solos (ISR).
#
# Instalar en crontab (root), una vez al día tras el pull diario de YouTube:
#   30 6 * * * /apps/planetaketo/scripts/recipes/cron.sh >> /var/log/planetaketo-recipes.log 2>&1
# ============================================================
set -euo pipefail

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" || true
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

cd /apps/planetaketo

echo "===== $(date -Is) extracción de recetas ====="
pnpm exec tsx scripts/recipes/extract.ts
echo "===== fin ====="
