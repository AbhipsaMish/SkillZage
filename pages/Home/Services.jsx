import '../../src/App.css'

export default function ServicesSection() {
  return (
    <section className="services-section" id="services">
      <div className="services-container">
        {/* Header */}
        <div className="services-header">
          <h2 className="services-title">What We Offer</h2>
          <p className="services-subtitle">
            Skillzage is committed to helping students and institutions unlock real-world success
            through smart, skill-enhancing tools.
          </p>
        </div>

        {/* Three Cards Side by Side */}
        <div className="services-cards">
          {/* Career Launchpad Card */}
          <div className="service-card">
            <div className="card-icon career-icon">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <h3 className="card-title">Career Launchpad</h3>
            <p className="card-description">
              Courses designed to enhance soft skills, workplace communication, teamwork, and
              leadership to make students industry-ready.
            </p>
            <div className="card-stats">
              <div className="stat-item">
                <span className="stat-label">Students Trained</span>
                <span className="stat-value career-color">2000+</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Completion Rate</span>
                <span className="stat-value career-color">90%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Average Rating</span>
                <span className="stat-value career-color">4.8/5</span>
              </div>
            </div>
          </div>

          {/* SmartExam Generator Card */}
         <div className="service-card">
        <div className="card-header">
           <div className="card-icon exam-icon">
             <i className="fas fa-file-alt"></i>
            </div>
           <span className="premium-badge">Paid</span>
          </div>
           <h3 className="card-title">SmartExam Generator</h3>
            <p className="card-description">
              Generate mock semester question papers by subject, syllabus, and difficulty level to
              prepare students for real assessments.
            </p>
            <div className="card-stats">
              <div className="stat-item">
                <span className="stat-label">Questions Generated</span>
                <span className="stat-value exam-color">50,000+</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Download & Print</span>
                <span className="stat-value exam-color">Instant</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Customizable</span>
                <span className="stat-value exam-color">100%</span>
              </div>
            </div>
          </div>

          {/* CV Compass Card */}
          <div className="service-card">
            <div className="card-icon cv-icon">
              <i className="fas fa-user-check"></i>
            </div>
            <h3 className="card-title">CV Compass</h3>
            <p className="card-description">
              AI-powered resume review tool that gives instant feedback and suggests roles suited
              to the student's skills.
            </p>
            <div className="card-stats">
              <div className="stat-item">
                <span className="stat-label">CVs Reviewed</span>
                <span className="stat-value cv-color">5000+</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Feedback Engine</span>
                <span className="stat-value cv-color">Instant</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Job Match Increase</span>
                <span className="stat-value cv-color">20%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
<div className="services-cta-modern">
  <div className="cta-background-pattern"></div>
  <div className="cta-content">
    <div className="urgency-badge">
      <i className="fas fa-clock"></i>
      <span>Limited Time Offer</span>
    </div>
    <h4 className="cta-title-modern">Don't Get Left Behind in Today's Competitive Market</h4>
    <p className="cta-description-modern">
      85% of jobs require skills beyond academics. Start building yours today.
    </p>
    <div className="cta-action-area">
      <button className="cta-btn-modern primary">
        <span>Claim Your Free Assessment</span>
        <i className="fas fa-arrow-right"></i>
      </button>
    </div>
  </div>
</div>
      </div>
    </section>
  );
}