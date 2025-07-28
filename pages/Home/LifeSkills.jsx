import '../../src/App.css';

export default function LifeSkills() {
  return (
    <section className="life-skills-section">
      <div className="life-skills-title">
        <span className="line"></span>
        <h2>Life Skills forever!</h2>
        <span className="line"></span>
      </div>
      
      <div className="life-skills-content">
        <p className="life-skills-description">
          Social skills have always been crucial in achieving success in either professional or personal life. However, the need for these life skills has never been more pressing. The Fifth Industrial Revolution has arrived, and the world is changing faster than ever. New technology is creating new industries and modifying existing ones, transforming how things are made. Ubiquitous, mobile supercomputing, intelligent robots, self-driving cars, automated production and AI. These are dramatically changing jobs, and the required skills are changing exponentially. As machines take over analytical and routine-based employment, the more creative, collaborative, and intuitive jobs are gaining significance. Social work skills at the heart of these jobs have never been more important to scale in life.
        </p>
        
        <div className="life-skills-button-wrapper">
          <button className="life-skills-button">
            Test Your Knowledge
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </section>
  );
}