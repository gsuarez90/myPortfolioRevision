# gsuarez.dev — Portfolio Site

Personal portfolio hosted on AWS, demonstrating a serverless architecture with a secure resume delivery flow.

**Live site:** https://gsuarez.dev

---

## Architecture

```
Browser
  │
  ▼
CloudFront (CDN + HTTPS)
  ├── /api/*  ──────────────────► API Gateway (HTTP API v2)
  │                                    │
  │                                    ▼
  │                               Lambda (Node.js 24, ESM)
  │                               ├── POST /api/request-resume
  │                               │     ├── DynamoDB (dedup + token)
  │                               │     └── SES (send email)
  │                               └── GET /api/get-resume?token=
  │                                     ├── DynamoDB (delete token)
  │                                     └── S3 pre-signed URL → 302
  │
  └── /*  ────────────────────────► S3 (private bucket, OAC)
```

## Resume Request Flow

1. Visitor submits email on the site
2. Lambda writes two DynamoDB items atomically: an email dedup record (24h TTL) and a single-use token
3. SES sends a download link to the visitor's inbox
4. Visitor clicks the link — Lambda deletes the token (single-use enforcement) and redirects to an S3 pre-signed URL (15 min expiry)

## Stack

| Layer | Service |
|---|---|
| Frontend | React 19 + Vite 8 + Mantine 7 |
| CDN / HTTPS | CloudFront |
| Static hosting | S3 (private bucket, OAC) |
| API | API Gateway HTTP API (v2) |
| Compute | Lambda (Node.js 24, ESM) |
| Database | DynamoDB (single-table, TTL) |
| Email | SES (verified domain, DKIM) |
| TLS cert | ACM (us-east-1) |
| DNS | Porkbun (ALIAS at apex) |

## Repo Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/    # Nav, Hero, Experience, Projects, ResumeModal, Footer
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html         # Vite entry point
│   ├── vite.config.js
│   └── package.json
├── lambda/
│   ├── index.mjs          # Lambda handler (POST + GET routes)
│   └── package.json
└── infra/
    ├── deploy.sh           # Full provisioning script (AWS CLI, one-time)
    ├── deploy-frontend.sh  # Build + S3 sync + CloudFront invalidation
    ├── lambda-policy.json  # IAM policy template for Lambda execution role
    └── deployer-policy.json # IAM policy template for CI/CD user
```

## Local Development

```bash
cd frontend
npm install
npm run dev       # starts Vite dev server at http://localhost:5173
```

The resume form points to `https://gsuarez.dev` even locally. Change `API_BASE` in `ResumeModal.jsx` to test against a different endpoint.

## Deployment

**Frontend** (build + sync to S3 + invalidate CloudFront):
```bash
bash infra/deploy.sh
```

Fill in `DIST_ID` at the top of the script before running.

**CI/CD** — GitHub Actions automatically builds and deploys on push to `main` when `frontend/**` changes. Requires three repository secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `CLOUDFRONT_DIST_ID`.

**Lambda** — package and deploy manually:
```bash
cd lambda && npm install
zip -r ../infra/lambda.zip .
aws lambda update-function-code --function-name resume-handler \
  --zip-file fileb://../infra/lambda.zip --region us-east-1
```

**Full infrastructure reprovision** (one-time, idempotent for active steps):
```bash
bash infra/deploy.sh
```

Fill in `ACM_CERT_ARN` at the top before running.
