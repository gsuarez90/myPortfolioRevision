import { useEffect, useRef } from 'react'

const SKILLS = ['Python', 'C# · .NET', 'FastAPI', 'Lambda', 'API Gateway', 'DynamoDB', 'CloudFront', 'S3', 'SES']

export default function Hero({ onResumeClick }) {
  const nameRef = useRef(null)

  useEffect(() => {
    if (nameRef.current) nameRef.current.classList.add('glide')
  }, [])

  return (
    <section id="hero">
      <div className="hero-inner">
        <h1 id="name" ref={nameRef}>George J. Suarez</h1>
        <p className="tagline">AWS Solutions Architect &nbsp;·&nbsp; Software Developer</p>
        <div className="skill-badges">
          {SKILLS.map(s => <span key={s} className="badge-pill">{s}</span>)}
        </div>
        <p className="bio">
          AWS Certified Solutions Architect Associate with 4+ years building, deploying, and maintaining
          production software in safety-critical, regulated environments. Strong Python and C# background
          with hands-on experience shipping code that real systems depend on. Currently seeking software
          engineering and cloud architecture roles.
        </p>
        <button className="btn-cta" onClick={onResumeClick}>Request Resume</button>
      </div>
    </section>
  )
}
