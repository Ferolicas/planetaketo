#!/usr/bin/env bash
# ============================================================
# Cron de borrado de analítica (minimización de datos — RGPD).
# Borra sesiones (>14 meses) y consentimientos (>24 meses).
#
# Instalar en crontab (root), una vez al día de madrugada:
#   15 4 * * * /apps/planetaketo/scripts/analytics/cleanup.sh >> /var/log/planetaketo-analytics-cleanup.log 2>&1
# ============================================================
set -euo pipefail

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" || true
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

cd /apps/planetaketo

echo "===== $(date -Is) limpieza de analítica ====="
pnpm exec tsx scripts/analytics/cleanup.ts
echo "===== fin ====="
