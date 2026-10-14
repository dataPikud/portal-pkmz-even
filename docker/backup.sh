#!/bin/bash
# Nightly database backup for production (runs in the "backup" service).
#   - dumps the database at 02:00 UTC into /backups as portal-<timestamp>.sql.gz
#   - deletes dumps older than 14 days
# Run one backup right now and exit:  backup.sh once
set -euo pipefail

BACKUP_DIR=/backups
KEEP_DAYS=14

backup_once() {
  local file="$BACKUP_DIR/portal-$(date -u +%Y%m%d-%H%M%S).sql.gz"

  # Write to a temp name first, so a failed dump never leaves a half-written backup
  if PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h db -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$file.tmp"; then
    mv "$file.tmp" "$file"
    echo "Backup written: $file"
  else
    rm -f "$file.tmp"
    echo "Backup FAILED" >&2
    return 1
  fi

  find "$BACKUP_DIR" -name 'portal-*.sql.gz' -mmin +$((KEEP_DAYS * 24 * 60)) -print -delete
}

if [ "${1:-}" = "once" ]; then
  backup_once
  exit 0
fi

while true; do
  now=$(date -u +%s)
  next=$(date -u -d "today 02:00" +%s)
  if [ "$next" -le "$now" ]; then
    next=$(date -u -d "tomorrow 02:00" +%s)
  fi
  echo "Next backup at $(date -u -d "@$next" '+%Y-%m-%d %H:%M UTC')"
  sleep $((next - now))
  # A failed night must not stop the loop
  backup_once || true
done
