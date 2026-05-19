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
  ├── /api/*  ──────────────────► API Gateway (HTTP API)
  │                                    │
  │                                    ▼
  │                               Lambda (Node.js 24)
  │                               ├── POST /api/request-resume
  │                               │     ├── DynamoDB (dedup + token)
  │                               │     └── SES (send email)
  │                               └── GET /api/get-resume?token=
  │                                     ├── DynamoDB (delete token)
  │                                     └── S3 pre-signed URL → 302
  │
  └── /*  ────────────────────────► S3 (static site, OAC)
```

## Resume Request Flow

1. Visitor submits email on the site
2. Lambda writes two DynamoDB items atomically: an email dedup record (24h TTL) and a single-use token
3. SES sends a download link to the visitor's inbox
4. Visitor clicks the link — Lambda deletes the token (single-use enforcement) and redirects to an S3 pre-signed URL (15 min expiry)

## Stack

| Layer | Service |
|---|---|
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
├── frontend/          # Static site (HTML, CSS)
├── lambda/            # Lambda function source (index.mjs)
│   ├── index.mjs
│   └── package.json
└── infra/
    ├── deploy.sh      # Full provisioning script (AWS CLI)
    └── lambda-policy.json
```

## Deployment

Provisioned via `infra/deploy.sh` (Bash, AWS CLI). Run from Git Bash on Windows or any POSIX shell.

```bash
bash infra/deploy.sh
```

The script provisions: S3, DynamoDB, IAM role + policy, Lambda, API Gateway, CloudFront OAC, CloudFront distribution, and uploads all static assets.
