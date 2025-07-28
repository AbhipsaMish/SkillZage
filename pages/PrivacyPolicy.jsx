import '../src/App.css';
import Header from "../components/Header.jsx"
import Footer from "../components/Footer.jsx"


export default function PrivacyPolicy() {
  return (
    <>
    <Header />
    <section className="privacy-section">
      <div className="privacy-container">
        <h1 className="privacy-heading">PRIVACY POLICY</h1>

        <p>This Privacy Policy governs the manner in which Skillzage.com collects, uses, maintains and discloses information collected from users (each, a "User") of the https://www.skillzage.com website ("Site"). This privacy policy applies to the Site and all products and services offered by Skillzage.</p>

        <h2>1. Personal Identification Information</h2>
        <p>We may collect personal identification information from Users in a variety of ways... Users can always refuse to supply personally identification information, except that it may prevent them from engaging in certain Site related activities.</p>

        <h2>2. Non-Personal Identification Information</h2>
        <p>We may collect non-personal identification information about Users whenever they interact with our Site.</p>

        <h2>3. Web Browser Cookies</h2>
        <p>Our Site may use "cookies" to enhance User experience. If they do so, note that some parts of the Site may not function properly.</p>

        <h2>4. How We Use Collected Information</h2>
        <ul>
          <li>To improve customer service</li>
          <li>To personalize user experience</li>
          <li>To improve our Site</li>
          <li>To process payments</li>
          <li>To run a promotion, contest, survey or feature</li>
          <li>To send periodic emails</li>
        </ul>

        <h2>5. How We Protect Your Information</h2>
        <p>We adopt appropriate data collection, storage and processing practices, protected with digital signatures.</p>

        <h2>6. Sharing Your Personal Information</h2>
        <p>We may use third party service providers, for those limited purposes provided that you have given us your permission.</p>

        <h2>7. Google Adsense</h2>
        <p>Some ads may be served by Google http://www.google.com/privacy_ads.html</p>

        <h2>8. Children's Online Privacy Protection</h2>
        <p>Protecting the privacy of the very young is especially important, no part of our website is structured to attract anyone under 13.</p>

        <h2>9. Changes to This Privacy Policy</h2>
        <p>Skillzage.com may update this privacy policy at any time, become aware of modifications.</p>

        <h2>10. Contact Us</h2>
        <p>
          Learning Bee Education Private Limited,<br />
          Flat 212, Block B2, Reeta Valley Apartments,<br />
          Bhubaneswar, Odisha – 752104 India.<br />
          <strong>Phone:</strong> +91 8018246346<br />
          <strong>Grievance Officer:</strong> Mr. Debadarsan Mohanty<br />
          <strong>Email:</strong> debadarsan@skillage.com
        </p>
      </div>
    </section>
    <Footer />
    </>
  );
}
