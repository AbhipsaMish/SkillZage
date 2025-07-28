import '../../src/App.css'
import '../../src/assets/lite-yt-embed.css';
import 'lite-youtube-embed';

export default function heroSection(){
   return (
   <section className="hero-section">
      <div className="hero-content">
        <div className="hero-text fade-in">
          <h1 className="hero-title">Welcome to Skillzage!</h1>
          <p className="hero-description">
            Skillzage uses technology to provide life skills intuitively by
            providing pedagogy-based learning materials. Our course content is a
            blend of online material, videos, reading recommendations, face-to-face
            sessions, industry projects and more.
          </p>
        </div>
        <div className="hero-video fade-in"> 
        <lite-youtube videoid="k0ztr45wnXo"   data-title="Skills to improve employability" style={{
    display: 'block',
    width: '100%',
    height: '100%',
  }}
  ></lite-youtube>
        </div>
      </div>
    </section>
   )
}