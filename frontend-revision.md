# Frontend Revision Plan — gsuarez.dev

## 1. Current State Assessment

**What the page looks like today:**
- Warm beige background (`#f0ece3`), muted slate text (`#596e79`) — a 2019 student portfolio aesthetic
- Nav is crammed into a dark box in the top-right corner — reads as an afterthought
- Hero bio says *"some hobbies/projects I have taken interest in as a regular person outside of a professional setting"* — actively undermines the professional story
- Projects section is a YouTube video carousel showing old college hardware lab work (Arduino, LabVIEW, DAQ) — these are the least relevant things on the resume
- Footer renders mid-page due to missing `</section>` close on `#twosec`
- No mention anywhere of: AWS SAA cert, Space Force, Python, C#, FastAPI, Anthropic API, or any of the actual key projects

**The gap in one sentence:** The page looks like a hobby site for a student, but the resume is for a production software developer with a security clearance, an AWS cert, and 4+ years in a safety-critical federal environment.

---

## 2. Story the Redesign Should Tell

The visitor (a hiring manager or technical recruiter) should land on the page and immediately understand:

1. **Who George is** — AWS SAA-certified production software developer, Space Force background, Marine Corps veteran
2. **What he builds** — Python/C# backend systems, cloud-native AWS architecture, AI-integrated applications
3. **That this site itself is a project** — the resume request flow (Lambda + DynamoDB + SES + CloudFront) is the most on-brand demo possible; it should be featured, not hidden

The narrative arc: *professional summary → skills → featured projects (including this site) → request resume CTA*

---

## 3. Color Palette & Typography

**Replace the beige/slate scheme with a dark professional theme:**

| Role | Color | Hex |
|---|---|---|
| Page background | Deep navy/slate | `#0f172a` |
| Card / section background | Lighter slate | `#1e293b` |
| Primary accent | Sky blue (AWS-adjacent) | `#38bdf8` |
| Secondary accent | Muted slate border | `#334155` |
| Body text | Off-white | `#e2e8f0` |
| Subdued text | Medium slate | `#94a3b8` |

**Typography:**
- Keep `Mukta Vaani` (already loaded) for headings — it works fine
- Body: `system-ui` or keep Mukta Vaani at regular weight
- Accent labels / tech badges: monospace (`'Courier New'` or `ui-monospace`) — signals technical credibility

**Why dark theme:** Standard in developer/cloud portfolios. Avoids the "student project" read of the warm beige. Also easier to make AWS architecture diagrams and code snippets pop visually.

---

## 4. Layout & Page Structure

**Replace the current 3-section layout with 5 sections, all single-page scroll:**

```
┌─────────────────────────────────┐
│  NAV (sticky top bar)           │
├─────────────────────────────────┤
│  #hero    — Name + summary      │
│             + skill badges      │
│             + Resume CTA button │
├─────────────────────────────────┤
│  #experience — 1 job entry      │
│               (Space Force)     │
├─────────────────────────────────┤
│  #projects — 4 project cards    │
│              (2-col grid)       │
├─────────────────────────────────┤
│  #contact  — footer links       │
└─────────────────────────────────┘
```

**Nav:** Horizontal sticky bar at the top. Dark bg, accent-colored active link. Links: About · Experience · Projects · Resume (triggers modal) · Contact. Replaces the current corner box.

---

## 5. Hero Section (#hero)

**Replace the current sparse name + bland paragraph with:**

```
George J. Suarez
─────────────────────────────────────────
AWS Solutions Architect · Production Software Developer

[subdued line] Python · C# · FastAPI · Lambda · DynamoDB · CloudFront · API Gateway

[bio paragraph — rewritten to match resume summary]
"AWS Certified Solutions Architect Associate with 4+ years building and
maintaining production software in safety-critical, regulated environments.
Strong Python and C# background. Currently seeking software engineering and
cloud architecture roles."

[  Request Resume  ]   ← triggers the modal, prominent CTA
```

**Key changes from current:**
- Drop the "hobbies/projects as a regular person" language entirely
- Surface the AWS cert and professional background immediately
- Make the Resume modal the primary CTA, not buried in the nav
- Add a thin row of tech stack pills below the tagline (styled as `<span>` badges, no images needed)

---

## 6. Experience Section (#experience)

**New section — currently missing entirely from the page.**

A single clean entry card:

```
┌──────────────────────────────────────────────────────┐
│  Controls Software Developer                         │
│  U.S. Space Force · Edwards AFB, CA                 │
│  Nov 2021 – Dec 2025                                 │
│                                                      │
│  • Python automation scripts → 50% fewer config     │
│    errors across active test campaigns               │
│  • C# app for control sequence generation →          │
│    replaced fully manual process, 40% faster setup  │
│  • C# interop libraries bridging legacy native       │
│    interfaces to .NET 8.0                            │
└──────────────────────────────────────────────────────┘
```

Keep it to 3 bullets max — this is a supplement to the resume, not a replacement. The goal is to show it exists and signal the environment (Space Force, safety-critical, production).

---

## 7. Projects Section (#projects) — Carousel Replacement

**Drop the YouTube carousel entirely. Replace with a 2-column card grid.**

The carousel has two problems: (1) the videos show college hardware lab work that is the least relevant thing on the resume, and (2) video carousels feel dated and add no information density.

**Four project cards:**

### Card 1 — This Portfolio Site (featured, full-width or first)
```
gsuarez.dev — AWS Portfolio Site
─────────────────────────────────
CloudFront · S3 · API Gateway · Lambda · DynamoDB · SES · ACM

Architected and deployed a serverless resume-request pipeline:
visitor submits email → Lambda validates + writes single-use token
to DynamoDB → SES delivers download link → pre-signed S3 URL
serves the PDF. All provisioned via AWS CLI for reproducibility.

[View Architecture ↗]   (links to notes.md diagram or an arch image)
```
*This card is the most important one — it's the live proof of the AWS SAA knowledge.*

### Card 2 — AI-Powered Coding Trainer
```
AI-Powered Coding Trainer
─────────────────────────────────
FastAPI · Python · Anthropic API · GitHub

Full-stack web app that dynamically generates coding challenges
across 5 languages and 3 difficulty levels. Structured prompt
engineering layer produces consistent JSON responses. API key
auth + environment-based secrets management.

[GitHub ↗]
```

### Card 3 — Legacy System Integration
```
Legacy System Integration — C# Interop Suite
─────────────────────────────────
C# · .NET 8.0 · Ghidra · P/Invoke

Reverse-engineered undocumented 64-bit native systems using Ghidra
to infer method signatures and data layouts. Delivered 3
production-ready P/Invoke libraries validated against live hardware.

[GitHub ↗]   (if public)
```

### Card 4 — Placeholder
```
┌──────────────────────────────────┐
│        Project Coming Soon       │
│           Stay tuned             │
└──────────────────────────────────┘
```

**Card design:**
- Dark card bg (`#1e293b`), thin accent-colored top border
- Tech stack as small monospace badge pills at the top of each card
- 2–3 bullet lines of description
- Optional GitHub/link button at the bottom
- Hover: subtle glow or lift (`box-shadow` transition)

---

## 8. Footer (#contact)

**Keep it minimal — it already works, just needs style updates:**
- Dark bg matching the nav
- Copyright text updated to 2026
- GitHub, email, LinkedIn icons — keep Font Awesome, update colors to accent blue on hover
- Remove the Google icon used for Gmail — replace with `fa-envelope` which reads more professionally

---

## 9. Resume Modal — No Changes Needed

The modal form built in the current session (email input + Send Link button + status messages) is correct. Once the dark theme is applied, just ensure the modal uses Bootstrap's dark variant or override the modal background to match `#1e293b`.

---

## 10. Technical Constraints & Architecture Compatibility

- **No build step** — all changes must be plain HTML/CSS/JS. No React, no bundler.
- **Bootstrap 4.5 stays** — modal, grid, and utility classes are already in use. The dark theme is achieved via CSS overrides in `resources/index.css`, not by swapping Bootstrap.
- **`API_BASE`** is already a single constant in the JS — CloudFront domain swap is one line when infra is live.
- **Font Awesome 4.7** stays — icon classes don't need to change.
- **`javascrill.js`** — the name-slide animation. Keep the `setGlide()` call; just verify the animation still looks right against the dark hero background.
- **No new external dependencies** — all styling done in `resources/index.css`.

---

## 11. Ordered Action Items

| # | Task | Touches |
|---|---|---|
| 1 | Update CSS: dark palette variables, body/section backgrounds | `resources/index.css` |
| 2 | Rewrite nav: sticky horizontal bar, replace corner box | `index.html` + CSS |
| 3 | Rewrite hero: new bio text, tagline, skill badge pills, Resume CTA | `index.html` |
| 4 | Add experience section with Space Force card | `index.html` |
| 5 | Replace carousel with 4 project cards (2-col grid) | `index.html` |
| 6 | Update footer: colors, copyright year, swap Google icon → envelope | `index.html` + CSS |
| 7 | Update modal: dark background override to match theme | CSS |
| 8 | Test locally with `npx serve` — check modal, carousel dots gone, all links work | — |
