import '../../src/App.css';
import courseimg1 from '../../src/assets/active-listening.png';
import courseimg2 from '../../src/assets/storytelling.png';

export default function ExploreCourses() {
  return (
    <section className="courses-section" id="courses">
      <h2 className="courses-heading">Explore Courses</h2>
      <div className="courses-container">
        <div className="course-card">
          <img
            src={courseimg1}
            alt="Active Listening"
            className="course-image"
          />
          <h3 className="course-title">Active Listening</h3>
          <p className="course-description">
            Active listening is one of the foundational soft skills to start your learning. Without acing this skill, it's extremely difficult to improve your productivity and effectiveness in the workplace and in your life.
          </p>
          <button className="course-button">See more</button>
        </div>
        
        <div className="course-card">
          <img
            src={courseimg2}
            alt="Story Telling"
            className="course-image"
          />
          <h3 className="course-title">Story Telling</h3>
          <p className="course-description">
            Storytelling is the art of sharing experiences and stories with an objective of work optimization, team building, work optimization, education, or instilling corporate values.
          </p>
          <button className="course-button">See more</button>
        </div>

        <div className="course-card">
          <div className="placeholder-image">
            <div className="placeholder-icon">📚</div>
          </div>
          <h3 className="course-title">Critical Thinking</h3>
          <p className="course-description">
            Critical thinking is the ability to analyze information objectively and make reasoned judgments. It involves evaluating sources, identifying biases, and approaching problems systematically.
          </p>
          <button className="course-button">See more</button>
        </div>
      </div>
    </section>
  );
}