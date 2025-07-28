import "../src/App.css"; 
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

export default function ContactUs() {
  return (
    <>
      <Header />
      <section className="contact-section">
        <div className="contact-container">
          <h1>CONTACT US</h1>
          <h2>PHONE SUPPORT</h2>

          <h3>New Customer</h3>
          <p>
            Issues related to registration, payment and services:{" "}
            <a href="tel:+918018246346">+91 8018246346</a>
          </p>

          <h3>Existing Customer</h3>
          <p>
            Email:{" "}
            <a href="mailto:support@skillzage.com">support@skillzage.com</a>
          </p>
          <p>
            For Urgent escalations (10 AM to 5 PM IST):{" "}
            <a href="tel:+918018246346">+91 80182 46346</a>
          </p>

          <h3>Registered Office:</h3>
          <p>
            Flat 212, Block B2, Reeta Valley Apartments,
            <br />
            Bhubaneswar 752104, Odisha, India.
          </p>

          <h3>Media & Partnerships</h3>
          <p>Ms. Soumya Sarita Pattnaik</p>
          <p>
            <a href="tel:+919078634955">+91 9078634955</a>
          </p>

          <p className="contact-last-updated">
            <strong>Last updated: November 24, 2022</strong>
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
