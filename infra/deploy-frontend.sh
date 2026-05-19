#!/usr/bin/env bash
# Syncs the frontend folder to S3 and invalidates the CloudFront cache.
# Run from Git Bash: bash infra/deploy-frontend.sh
set -euo pipefail

BUCKET_NAME="gsuarez-portfolio"
DIST_ID="E1EUCNRSBSNWEG"
RESUME_KEY="private/resume.pdf"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"
RESUME_PDF="$FRONTEND_DIR/resources/images/resume.pdf"

echo "==> Syncing static files to S3..."
aws s3 sync "$FRONTEND_DIR" "s3://${BUCKET_NAME}" \
  --exclude ".git/*" \
  --exclude "resources/images/*.pdf" \
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
