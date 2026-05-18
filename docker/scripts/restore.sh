#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL Restore Script
# Downloads a backup from S3/MinIO and restores it
#
# Usage:
#   ./restore.sh <backup_filename>
#   ./restore.sh lumibase_20240101_120000.sql.gz
#
# Required environment variables:
#   DATABASE_URL    - PostgreSQL connection string
#   S3_ENDPOINT    - S3-compatible endpoint (e.g., http://minio:9000)
#   S3_BUCKET      - Source S3 bucket for backups
#   S3_ACCESS_KEY  - S3 access key
#   S3_SECRET_KEY  - S3 secret key
#
# Optional:
#   BACKUP_PREFIX  - S3 key prefix (default: backups)

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup_filename>"
  echo "Example: $0 lumibase_20240101_120000.sql.gz"
  echo ""
  echo "Available backups:"
  export AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY}"
  export AWS_SECRET_ACCESS_KEY="${S3_SECRET_KEY}"
  aws s3 ls "s3://${S3_BUCKET}/${BACKUP_PREFIX:-backups}/" \
    --endpoint-url "${S3_ENDPOINT}" 2>/dev/null || echo "  (unable to list backups)"
  exit 1
fi

BACKUP_FILE="$1"
BACKUP_PREFIX="${BACKUP_PREFIX:-backups}"
TMP_DIR=$(mktemp -d)

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

echo "[restore] Starting restore from ${BACKUP_FILE}"

# Download from S3
export AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY}"
export AWS_SECRET_ACCESS_KEY="${S3_SECRET_KEY}"

aws s3 cp \
  "s3://${S3_BUCKET}/${BACKUP_PREFIX}/${BACKUP_FILE}" \
  "${TMP_DIR}/${BACKUP_FILE}" \
  --endpoint-url "${S3_ENDPOINT}"

echo "[restore] Downloaded backup ($(du -h "${TMP_DIR}/${BACKUP_FILE}" | cut -f1))"

# Restore database
echo "[restore] Restoring database..."
gunzip -c "${TMP_DIR}/${BACKUP_FILE}" | psql "${DATABASE_URL}" --quiet

echo "[restore] Database restored successfully from ${BACKUP_FILE}"
