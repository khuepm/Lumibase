#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL Backup Script
# Dumps the database and uploads to S3/MinIO
#
# Required environment variables:
#   DATABASE_URL    - PostgreSQL connection string
#   S3_ENDPOINT    - S3-compatible endpoint (e.g., http://minio:9000)
#   S3_BUCKET      - Target S3 bucket for backups
#   S3_ACCESS_KEY  - S3 access key
#   S3_SECRET_KEY  - S3 secret key
#
# Optional:
#   BACKUP_PREFIX  - S3 key prefix (default: backups)

BACKUP_PREFIX="${BACKUP_PREFIX:-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="lumibase_${TIMESTAMP}.sql.gz"
TMP_DIR=$(mktemp -d)

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

echo "[backup] Starting PostgreSQL backup at ${TIMESTAMP}"

# Dump database
pg_dump "${DATABASE_URL}" --no-owner --no-acl | gzip > "${TMP_DIR}/${BACKUP_FILE}"

BACKUP_SIZE=$(du -h "${TMP_DIR}/${BACKUP_FILE}" | cut -f1)
echo "[backup] Dump complete: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Upload to S3
export AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY}"
export AWS_SECRET_ACCESS_KEY="${S3_SECRET_KEY}"

aws s3 cp "${TMP_DIR}/${BACKUP_FILE}" \
  "s3://${S3_BUCKET}/${BACKUP_PREFIX}/${BACKUP_FILE}" \
  --endpoint-url "${S3_ENDPOINT}"

echo "[backup] Uploaded to s3://${S3_BUCKET}/${BACKUP_PREFIX}/${BACKUP_FILE}"
echo "[backup] Backup completed successfully"
