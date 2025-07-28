import '../../src/App.css';

export default function WhoIsThisFor() {
  return (
    <section className="who-section">
      <h2 className="who-heading">Who is this for?</h2>
      
      <div className="who-container">
        <div className="who-card">
          <div className="hexagon-content">
            <span className="who-icon">🎓</span>
            <h3 className="who-title">Students</h3>
            <p className="who-text">
              Graduating students have little exposure to the corporate world. Most educational
              institutes try to bridge the gap but due to academic pressure are only able to do so
              much. Skillzage intends to bridge the gap and provide students with the right tools to
              enter the industry with confidence.
            </p>
          </div>
        </div>

        <div className="who-card">
          <div className="hexagon-content">
            <span className="who-icon">💼</span>
            <h3 className="who-title">Freelancers</h3>
            <p className="who-text">
              Freelancers have a unique problem. They usually work on short assignments and are
              expected to be experts. Companies often ignore that, like their full-time employees,
              freelancers too need support to upgrade their skills and deliver better results.
            </p>
          </div>
        </div>

        <div className="who-card">
          <div className="hexagon-content">
            <span className="who-icon">🚀</span>
            <h3 className="who-title">Young Professionals</h3>
            <p className="who-text">
              Many companies have detailed learning and development programs for
              their employees. However, this learning is highly customized to the need of the company
              and in many medium and small size companies is absent. It's extremely difficult for a
              professional to expand their horizon. We bring personalised content to help professionals
              achieve their dreams.
            </p>
          </div>
        </div>

        <div className="who-card">
          <div className="hexagon-content">
            <span className="who-icon">📚</span>
            <h3 className="who-title">Lifelong Learners</h3>
            <p className="who-text">
              Life expectancy is increasing and so is working life. This means professionals would
              have more than one career and need periodic update in their skills. There are
              multiple avenues (digital and otherwise) to update technical knowledge. However, the same
              can't be said for life skills. Skillzage brings the behavioural skills that are crucial
              for switching jobs or even industries.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}