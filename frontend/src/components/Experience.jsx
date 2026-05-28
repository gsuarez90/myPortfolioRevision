export default function Experience() {
  return (
    <section id="experience">
      <div className="container">
        <h2 className="section-title">Experience</h2>
        <div className="exp-card">
          <div className="exp-header">
            <div>
              <span className="exp-role">Controls Software Developer</span>
              <span className="exp-org">U.S. Space Force &nbsp;·&nbsp; Edwards AFB, CA</span>
            </div>
            <span className="exp-dates">Nov 2021 – Dec 2025</span>
          </div>
          <ul className="exp-bullets">
            <li>Shipped and maintained production software in a safety-critical environment — built a strong instinct for balancing speed and reliability under operational pressure</li>
            <li>Developed Python automation scripts for data processing and transformation, reducing configuration errors by 50% across active test campaigns</li>
            <li>Built a C# application automating control sequence generation from engineering inputs, replacing a fully manual process and reducing setup time by 40%</li>
            <li>Built C# interop libraries bridging legacy native interfaces to modern .NET 8.0 applications, enabling reliable data exchange between systems with sparse documentation</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
