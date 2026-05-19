#!/usr/bin/env bash
# Run from Git Bash on Windows (or any POSIX shell on Mac/Linux).
# Intended for first-time provisioning — re-running will error on resources
# that already exist. Check AWS console and delete manually if you need to retry.
set -euo pipefail

# ── CONFIGURATION ─────────────────────────────────────────────────────────────
# Edit these before running.

REGION="us-east-1"
BUCKET_NAME="gsuarez-portfolio"
TABLE_NAME="resume-requests"
FUNCTION_NAME="resume-handler"
ROLE_NAME="resume-lambda-role"
API_NAME="portfolio-api"
DOMAIN_NAME="gsuarez.dev"
SENDER_EMAIL="noreply@gsuarez.dev"
SITE_BASE="https://gsuarez.dev"
RESUME_KEY="private/resume.pdf"

# ACM certificate ARN — must be in us-east-1 for CloudFront.
# Find it in: ACM console → us-east-1 → Certificates → gsuarez.dev
ACM_CERT_ARN="arn:aws:acm:us-east-1:648029811785:certificate/db645a21-f488-4d42-8307-f027c31f787c"   # REQUIRED — paste ARN here before running

# ── PATHS (relative to this script) ──────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAMBDA_DIR="$SCRIPT_DIR/../lambda"
STATIC_DIR="$SCRIPT_DIR/../frontend"
RESUME_PDF="$STATIC_DIR/resources/images/resume.pdf"

# ── PREFLIGHT ─────────────────────────────────────────────────────────────────
if [[ -z "$ACM_CERT_ARN" ]]; then
  echo "ERROR: ACM_CERT_ARN is not set. Paste your certificate ARN at the top of this script."
  exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo ""
echo "Account : $ACCOUNT_ID"
echo "Region  : $REGION"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — S3 BUCKET  [SKIP — already created]
# ─────────────────────────────────────────────────────────────────────────────
echo "==> [1/9] S3 bucket — skipping (already exists)"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — DYNAMODB TABLE  [SKIP — already created]
# ─────────────────────────────────────────────────────────────────────────────
echo "==> [2/9] DynamoDB table — skipping (already exists)"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 — IAM ROLE + POLICY  [role exists; overwrite policy with corrected version]
# ─────────────────────────────────────────────────────────────────────────────
echo "==> [3/9] IAM role — fetching ARN and updating policy"

ROLE_ARN=$(aws iam get-role \
  --role-name "$ROLE_NAME" \
  --query "Role.Arn" --output text)

PERMISSION_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:GetItem","dynamodb:PutItem","dynamodb:DeleteItem","dynamodb:ConditionCheckItem"],
      "Resource": "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/${TABLE_NAME}"
    },
    {
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/private/*"
    },
    {
      "Effect": "Allow",
      "Action": "ses:SendEmail",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"],
      "Resource": "arn:aws:logs:${REGION}:${ACCOUNT_ID}:log-group:/aws/lambda/${FUNCTION_NAME}:*"
    }
  ]
}
EOF
)

aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "${ROLE_NAME}-policy" \
  --policy-document "$PERMISSION_POLICY"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 4 — LAMBDA PACKAGE + DEPLOY
# ─────────────────────────────────────────────────────────────────────────────
echo "==> [4/9] Lambda — skipping (already exists)"

LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 5 — API GATEWAY HTTP API
# ─────────────────────────────────────────────────────────────────────────────
echo "==> [5/9] API Gateway — skipping (already exists), fetching endpoint"

API_ID=$(aws apigatewayv2 get-apis \
  --query "Items[?Name=='${API_NAME}'].ApiId" --output text \
  --region "$REGION")

API_ORIGIN=$(aws apigatewayv2 get-api \
  --api-id "$API_ID" \
  --query "ApiEndpoint" --output text \
  --region "$REGION" | sed 's|https://||')

# ─────────────────────────────────────────────────────────────────────────────
# STEP 6 — CLOUDFRONT ORIGIN ACCESS CONTROL
# ─────────────────────────────────────────────────────────────────────────────
echo "==> [6/9] CloudFront OAC — skipping (already exists), fetching ID"

OAC_ID=$(aws cloudfront list-origin-access-controls \
  --query "OriginAccessControlList.Items[?Name=='gsuarez-portfolio-oac'].Id" \
  --output text)

# ─────────────────────────────────────────────────────────────────────────────
# STEP 7 — CLOUDFRONT DISTRIBUTION
# ─────────────────────────────────────────────────────────────────────────────
echo "==> [7/9] CloudFront distribution — skipping (already exists)"

DIST_ID="E1EUCNRSBSNWEG"
DIST_DOMAIN="d1qht8g7a9gjq4.cloudfront.net"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 8 — S3 BUCKET POLICY (grants CloudFront OAC read access)
# ─────────────────────────────────────────────────────────────────────────────
echo "==> [8/9] S3 bucket policy"

BUCKET_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect":    "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action":    "s3:GetObject",
    "Resource":  "arn:aws:s3:::${BUCKET_NAME}/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::${ACCOUNT_ID}:distribution/${DIST_ID}"
      }
    }
  }]
}
EOF
)

aws s3api put-bucket-policy \
  --bucket "$BUCKET_NAME" \
  --policy "$BUCKET_POLICY"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 9 — UPLOAD FILES TO S3
# ─────────────────────────────────────────────────────────────────────────────
echo "==> [9/9] Upload files to S3"

# Sync static site files, excluding git internals
aws s3 sync "$STATIC_DIR" "s3://${BUCKET_NAME}" \
  --exclude ".git/*" \
  --exclude "resources/images/*.pdf" \
  --delete

# Upload resume to the private prefix (only accessible via Lambda pre-signed URL)
aws s3 cp "$RESUME_PDF" "s3://${BUCKET_NAME}/${RESUME_KEY}"

# ─────────────────────────────────────────────────────────────────────────────
# DONE — Print next steps
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════"
echo "  Deployment complete"
echo "════════════════════════════════════════════════════════"
echo ""
echo "  CloudFront domain : https://${DIST_DOMAIN}"
echo "  Distribution ID   : ${DIST_ID}"
echo "  API Gateway ID    : ${API_ID}"
echo ""
echo "  CloudFront takes 5-10 min to finish deploying globally."
echo "  Check status: aws cloudfront get-distribution --id ${DIST_ID} --query 'Distribution.Status'"
echo ""
echo "  ── DNS cutover in Porkbun ───────────────────────────"
echo "  1. Add CNAME:  gsuarez.dev  →  ${DIST_DOMAIN}"
echo "     (or ALIAS record if Porkbun supports it at the apex)"
echo "  2. Delete the default ALIAS gsuarez.dev → pixie.porkbun.com"
echo "  3. Wait for TTL to expire, then verify: curl -I https://gsuarez.dev"
echo ""
echo "  ── Cleanup (optional) ───────────────────────────────"
echo "  rm $SCRIPT_DIR/lambda.zip"
echo "  rm $SCRIPT_DIR/cf-dist-config.json"
echo ""
