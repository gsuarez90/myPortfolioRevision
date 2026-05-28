#!/usr/bin/env bash
# Builds the frontend and syncs it to S3, then invalidates the CloudFront cache.
# Run from Git Bash: bash infra/deploy-frontend.sh
set -euo pipefail

BUCKET_NAME="gsuarez-portfolio"
DIST_ID=""       # paste your CloudFront distribution ID here
RESUME_KEY="private/resume.pdf"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"
RESUME_PDF="$FRONTEND_DIR/resources/images/resume.pdf"

if [[ -z "$DIST_ID" ]]; then
  echo "ERROR: DIST_ID is not set. Paste your CloudFront distribution ID at the top of this script."
  exit 1
fi

echo "==> Building frontend..."
cd "$FRONTEND_DIR"
npm install --silent
npm run build

cd "$SCRIPT_DIR"

echo "==> Syncing build output to S3..."
aws s3 sync "$FRONTEND_DIR/dist" "s3://${BUCKET_NAME}" \
  --delete

echo "==> Uploading resume to private prefix..."
aws s3 cp "$RESUME_PDF" "s3://${BUCKET_NAME}/${RESUME_KEY}"

echo "==> Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "/*" \
  --query "Invalidation.Id" \
  --output text

echo ""
echo "Done. Changes will be live within 1-2 minutes."
