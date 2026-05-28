const PROJECTS = [
  {
    featured: true,
    badges: ['CloudFront', 'S3', 'Lambda', 'API Gateway', 'DynamoDB', 'SES', 'ACM'],
    title: 'gsuarez.dev — This Portfolio Site',
    bullets: [
      'Serverless resume-request pipeline: visitor submits email → Lambda validates and writes a single-use token to DynamoDB → SES delivers the download link → pre-signed S3 URL serves the PDF',
      'CloudFront with two origin behaviors — static files from a private S3 bucket (OAC) and API routes forwarded to HTTP API Gateway',
      'All AWS resources provisioned via CLI for reproducibility; custom domain via ACM + Porkbun DNS',
    ],
    footer: <span className="card-footer-note">Live — you&apos;re on it</span>,
  },
  {
    badges: ['Python', 'FastAPI', 'Anthropic API'],
    title: 'AI-Powered Coding Trainer',
    bullets: [
      'Full-stack web app that dynamically generates coding challenges across 5 languages and 3 difficulty levels via the Anthropic API',
      'Structured prompt engineering layer produces consistent JSON challenge responses; API key auth and environment-based secrets management',
      'Published to GitHub as an open-source, fork-friendly project',
    ],
    footer: <a href="https://github.com/gsuarez90" target="_blank" rel="noreferrer" className="card-link">GitHub ↗</a>,
  },
  {
    badges: ['C#', '.NET 8.0', 'Ghidra', 'P/Invoke'],
    title: 'Legacy System Integration — C# Interop Suite',
    bullets: [
      'Tasked with integrating undocumented 64-bit native systems into a modern .NET environment with sparse reference material',
      'Used Ghidra and systematic reverse engineering to infer method signatures and data layouts from live binaries',
      'Delivered three production-ready .NET 8.0 P/Invoke libraries validated against live hardware',
    ],
    footer: <span className="card-link-muted">Government repository — not publicly available</span>,
  },
  {
    badges: ['React', 'FastAPI', 'Anthropic API', 'Lambda', 'DynamoDB', 'SAM', 'Cloudflare'],
    title: 'AI Trading Dashboard — ait.gsuarez.dev',
    bullets: [
      'Intraday trading assistant powered by Claude: generates morning market briefings, structured trade suggestions with position sizing and R/R ratios, and enforces 8 automated guardrails to prevent emotional overrides',
      'FastAPI backend on Lambda polls Schwab API for real-time top movers and Finnhub news for sentiment scoring; all state stored in DynamoDB single-table design with a GSI',
      'Dual-build CI/CD via AWS SAM + GitHub Actions — public demo (synthetic portfolio) and a private live version behind Cloudflare Access email OTP with a separate Lambda and S3 bucket',
    ],
    footer: <a href="https://ait.gsuarez.dev" target="_blank" rel="noreferrer" className="card-link">Live ↗</a>,
  },
]

export default function Projects() {
  return (
    <section id="projects">
      <div className="container">
        <h2 className="section-title">Projects</h2>
        <div className="project-grid">
          {PROJECTS.map((p) => (
            <div key={p.title} className={`project-card${p.featured ? ' featured' : ''}`}>
              <div className="card-badges">
                {p.badges.map(b => <span key={b} className="badge-tech">{b}</span>)}
              </div>
              <h3 className="card-title">{p.title}</h3>
              <ul className="card-bullets">
                {p.bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
              {p.footer}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
