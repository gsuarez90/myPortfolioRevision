# Notes

## Architecture Diagrams

### Old Architecture (GitHub Pages)

```
┌─────────────┐        ┌──────────────────────────────────────────┐
│   Visitor   │        │              GitHub Pages                │
│   Browser   │        │  (free static hosting, github.io domain) │
└──────┬──────┘        └──────────────────────────────────────────┘
       │                                   │
       │  HTTP GET gsuarez90.github.io     │
       │──────────────────────────────────▶│
       │                                   │
       │  index.html + CSS + JS (CDN)      │
       │◀──────────────────────────────────│
       │                                   │
       │  [Nav click → anchor scroll]      │  All interactions are
       │  [Carousel dots → Bootstrap JS]   │  purely client-side.
       │  [Resume click → modal opens]     │  No backend exists.
       │                                   │
       │  ┌─────────────────────────────┐  │
       │  │  Resume Modal (BROKEN)      │  │
       │  │  Title: "Enter work email"  │  │
       │  │  Body:  placeholder text    │  │  ← No email input,
       │  │  Footer: [Close]            │  │    no PDF link,
       │  └─────────────────────────────┘  │    no backend
       │                                   │
       │  [Footer icons]                   │
       │  GitHub → github.com (new tab)    │
       │  Gmail  → mailto: (email client)  │
       │  LinkedIn → linkedin.com (new tab)│
└──────────────────────────────────────────┘

  YouTube CDN ◀── iframe embeds (carousel) ── Browser
  Bootstrap CDN ◀── JS/CSS ─────────────────── Browser
  Google Fonts CDN ◀── Mukta Vaani ──────────── Browser
```

---

### New Architecture (AWS)

```
                         ┌───────────────┐
                         │    Visitor    │
                         │    Browser    │
                         └──────┬────────┘
                                │ HTTPS
                                ▼
                    ┌───────────────────────┐
                    │      CloudFront       │  CDN + HTTPS termination
                    │   (*.cloudfront.net)  │  Two origin behaviors:
                    └────────┬──────────────┘
                             │
              ┌──────────────┴──────────────┐
              │ /*                          │ /api/*
              ▼                             ▼
  ┌───────────────────────┐    ┌────────────────────────┐
  │       S3 Bucket       │    │   API Gateway          │
  │  (private, OAC only)  │    │   (HTTP API)           │
  │                       │    └────────────┬───────────┘
  │  index.html           │                 │
  │  drill.html           │                 ▼
  │  resources/           │    ┌────────────────────────┐
  │  private/resume.pdf ──┼──┐ │   Lambda Function      │
  └───────────────────────┘  │ │                        │
                              │ │  POST /request-resume  │
                              │ │  ┌─────────────────┐  │
                              │ │  │ 1. validate email│  │
                              │ │  │ 2. DynamoDB get  │──┼──▶ ┌─────────────┐
                              │ │  │ 3. write 2 items │──┼──▶ │  DynamoDB   │
                              │ │  │ 4. SES send mail │──┼──▶ │  TTL 24h   │
                              │ │  └─────────────────┘  │ │   └─────────────┘
                              │ │                        │ │
                              │ │  GET /get-resume       │ │   ┌─────────────┐
                              │ │  ┌─────────────────┐  │ │   │     SES     │
                              │ │  │ 1. lookup token  │──┼─┼──▶ george.suarez│
                              │ │  │ 2. delete token  │──┼─┼──▶ .2@outlook  │
                              │ │  │ 3. presign URL   │◀─┼─┘ └──────┬──────┘
                              │ │  │ 4. 302 redirect  │  │
                              │ │  └─────────────────┘  │          │
                              │ └────────────────────────┘          │ email with
                              │                                      │ download link
                              │◀─────────────────────────────────────┘
                              │  S3 pre-signed URL (15 min expiry)
                              ▼
                       Visitor downloads
                         resume.pdf

IAM Role (Lambda) — least privilege:
  dynamodb:GetItem, TransactWriteItems  → resume-requests table only
  s3:GetObject                          → private/* prefix only
  ses:SendEmail                         → unrestricted (SES manages identities)
  logs:*                                → CloudWatch Logs (auto)
```

### How the Resume Flow Works (Two Phases)

**Phase 1 — User requests resume (form submit)**
1. User enters email → browser POSTs to Lambda via API Gateway
2. Lambda checks DynamoDB — duplicate within 24h? Reject. First time? Continue.
3. Lambda writes 2 items to DynamoDB (email item + token item, both with 24h TTL)
4. Lambda calls SES to send an email to the user containing a download link

SES's job is done here. It only delivers the email with the link.

**Phase 2 — User clicks the link in their email**
1. Browser GETs the link → hits Lambda via API Gateway
2. Lambda looks up the token in DynamoDB — valid? Continue. Missing/expired? Reject.
3. Lambda deletes the token (single-use — can't be clicked again)
4. Lambda asks S3 to generate a pre-signed URL (temporary expiring download link, 15 min)
5. Lambda returns a 302 redirect pointing to that S3 URL
6. Browser follows the redirect → downloads PDF directly from S3

**Service responsibilities:**
- SES — sends the email with the link (Phase 1 only, never touched in Phase 2)
- DynamoDB — dedup check on submit, token validation on download
- S3 — holds the PDF and generates the temporary download URL (Phase 2 only)
- Lambda — orchestrates all three services

---

## AWS Portfolio Rebuild Plan

Rebuilding the static GitHub Pages portfolio as a fully AWS-hosted site with a real multi-service backend. The goal is to demonstrate a defensible SAA-level architecture while also fixing incomplete features (resume modal, carousel arrows) and adding the ActiveRecallDrill as a featured project.

### Architecture

```
Visitor → CloudFront (CDN + HTTPS)
              ├── /* → S3 (static site: index.html, drill.html, CSS, images)
              └── /api/* → API Gateway (HTTP API)
                               └── Lambda
                                     ├── DynamoDB (token store + TTL)
                                     └── SES (sends resume download link email)
                                           └── Pre-signed S3 URL (private PDF)
```

### Email Verification Resume Flow
1. Visitor enters email in modal → `POST /api/request-resume` → API Gateway → Lambda
2. Lambda validates email, checks DynamoDB for duplicate (24h dedup), writes two items (email + token keys) with TTL
3. Lambda sends SES email to requester with link: `GET /api/get-resume?token=<uuid>`
4. Visitor clicks link → Lambda looks up token, **deletes it** (single-use), generates 302 redirect to S3 pre-signed URL (15 min expiry)
5. Browser follows redirect → PDF downloads directly from S3

### DynamoDB Two-Item Pattern (no GSI needed)
- `PK: "email#<addr>", SK: "REQUEST"` — dedup check; kept until 24h TTL expires
- `PK: "token#<uuid>", SK: "LOOKUP"` — token validation; **deleted immediately after first use** (single-use token)
- Both written with same `expires_at` TTL (epoch seconds) as a safety net; DynamoDB auto-purges both
- Single-use deletion: GET handler does GetItem → DeleteItem → presign URL (one extra write, within free tier)

### Files to Create / Modify
| Action | File |
|---|---|
| Modify | `gsuarez90.github.io/index.html` — modal form, carousel arrows, 4th slide, JS fetch handler |
| Create | `gsuarez90.github.io/drill.html` — copy of ActiveRecallDrill.html |
| Create | `lambda/index.mjs` — two route handlers (POST + GET) |
| Create | `infra/lambda-policy.json` — least-privilege IAM policy |
| Create | `infra/deploy.sh` — ordered AWS CLI provisioning commands |

### Key Decisions
- **CLI over Console** — produces reproducible scripts for GitHub, better interview signal
- **SES over SNS** — SNS requires email subscription confirmation per recipient; SES sends directly once out of sandbox. Request SES production access first (24-48h).
- **Outlook as sender identity** (`george.suarez.2@outlook.com`) — verified in SES, used for both footer contact link and Lambda sender address
- **CloudFront default URL** (`*.cloudfront.net`) — no domain purchase needed, fully AWS-hosted
- **HTTP API Gateway** over REST API — cheaper, lower latency, sufficient for this use case

### Order of Operations
1. Request SES production access immediately (takes 24-48h)
2. Make frontend changes to index.html + add drill.html (can preview locally)
3. Write Lambda + infra files
4. Run deploy.sh to provision all AWS resources
5. Update `API_BASE` constant in index.html with CloudFront domain, re-sync to S3

**Fix:**
```
npm i -g @anthropic-ai/claude-code
```
Run from VS Code PowerShell terminal. First run showed a cleanup warning (EPERM on `claude.exe` still locked). Second run after closing Claude Code = clean, no errors. Auto-update banner gone.

**Key gotcha:** Close Claude Code before running the reinstall if you see the EPERM cleanup warning.

---