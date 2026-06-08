#!/usr/bin/env bash
# ============================================================
# Backup diario de la base `planetaketo` (pg_dump) con rotación.
# Lee DATABASE_URL de /apps/planetaketo/.env.local (única fuente de verdad).
# No toca ninguna otra base ni proceso.
#
# Instalar (en el VPS):
#   chmod +x /apps/planetaketo/scripts/backup-planetaketo-db.sh
#   # crontab (root): diario 03:30
#   ( crontab -l 2>/dev/null; \
#     echo "30 3 * * * /apps/planetaketo/scripts/backup-planetaketo-db.sh >> /var/log/planetaketo-db-backup.log 2>&1" ) \
#     | crontab -
#
# Restaurar un backup:
#   gunzip -c /var/backups/planetaketo/planetaketo-YYYYMMDD-HHMMSS.sql.gz \
#     | psql "$DATABASE_URL"
# ============================================================
set -euo pipefail
export PATH=/usr/local/bin:/usr/bin:/bin:$PATH

APP_DIR="/apps/planetaketo"
BACKUP_DIR="/var/backups/planetaketo"
RETENTION_DAYS=14

# --- DATABASE_URL desde .env.local (sin exponerla en logs) ---
DATABASE_URL="$(grep -E '^DATABASE_URL=' "$APP_DIR/.env.local" \
  | head -n1 | cut -d= -f2- \
  | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[backup] ERROR: no se encontró DATABASE_URL en $APP_DIR/.env.local" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/planetaketo-$STAMP.sql.gz"
TMP="$OUT.partial"

# --- Volcado comprimido (atómico: solo se renombra si pg_dump tuvo éxito) ---
if pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip > "$TMP"; then
  mv "$TMP" "$OUT"
  echo "[backup] $(date '+%F %T') OK -> $OUT ($(du -h "$OUT" | cut -f1))"
else
  rm -f "$TMP"
  echo "[backup] $(date '+%F %T') ERROR: pg_dump falló" >&2
  exit 1
fi

# --- Rotación: elimina backups con más de RETENTION_DAYS días ---
find "$BACKUP_DIR" -name 'planetaketo-*.sql.gz' -type f -mtime +"$RETENTION_DAYS" -delete
echo "[backup] rotación OK (se conservan los últimos ${RETENTION_DAYS} días)"
