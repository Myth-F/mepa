#!/bin/sh
# Scheduled backup loop: PostgreSQL logical dump + MinIO mirror into /backups,
# with retention pruning. Local backups are NOT sufficient disaster recovery on
# their own — the runbook requires copying /backups off the VPS regularly.
set -eu

BACKUP_DIR=/backups
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
INTERVAL="${BACKUP_INTERVAL_SECONDS:-86400}"

mkdir -p "$BACKUP_DIR/postgres" "$BACKUP_DIR/minio"

# Install the MinIO client once (image is postgres:alpine; mc is fetched on first run).
if ! command -v mc >/dev/null 2>&1; then
  wget -q https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc
  chmod +x /usr/local/bin/mc
fi

run_backup() {
  ts="$(date -u +%Y%m%dT%H%M%SZ)"

  echo "[backup] pg_dump -> $BACKUP_DIR/postgres/db-$ts.sql.gz"
  pg_dump --no-owner --no-privileges | gzip > "$BACKUP_DIR/postgres/db-$ts.sql.gz"

  echo "[backup] mirroring MinIO bucket $S3_BUCKET"
  mc alias set bk "$S3_ENDPOINT" "$S3_ACCESS_KEY_ID" "$S3_SECRET_ACCESS_KEY" >/dev/null
  mc mirror --overwrite --remove "bk/$S3_BUCKET" "$BACKUP_DIR/minio/$S3_BUCKET"

  echo "[backup] pruning backups older than ${RETENTION_DAYS} days"
  find "$BACKUP_DIR/postgres" -name 'db-*.sql.gz' -mtime "+${RETENTION_DAYS}" -delete
  echo "[backup] done at $ts"
}

# Run once immediately, then on the configured interval.
while true; do
  run_backup || echo "[backup] WARNING: backup run failed"
  sleep "$INTERVAL"
done
