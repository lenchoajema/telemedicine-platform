import './PublicPages.css';

export default function AboutPage() {
  return (
    <div className="public-page">
      <div className="page-header">
        <h1>About Our Telemedicine Platform</h1>
        <p>Revolutionizing healthcare through technology and compassion</p>
      </div>

      <div className="content-sections">
        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            We believe healthcare should be accessible, convenient, and high-quality for everyone. 
            Our telemedicine platform connects patients with certified healthcare professionals 
            from the comfort of their homes, breaking down barriers to medical care.
          </p>
        </section>

        <section className="about-section">
          <h2>How It Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Sign Up</h3>
              <p>Create your account and complete your medical profile</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Choose Doctor</h3>
              <p>Browse our network of certified healthcare professionals</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Book Appointment</h3>
              <p>Schedule a convenient time for your virtual consultation</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Get Care</h3>
              <p>Connect with your doctor via secure video call</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Why Choose Us</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">🏥</div>
              <h3>Certified Doctors</h3>
              <p>All our healthcare providers are licensed and board-certified</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🔒</div>
              <h3>HIPAA Compliant</h3>
              <p>Your health information is secure and private</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">⏰</div>
              <h3>24/7 Availability</h3>
              <p>Access healthcare when you need it, day or night</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">💰</div>
              <h3>Affordable Care</h3>
              <p>Quality healthcare at transparent, affordable prices</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Our Team</h2>
          <p>
            Our platform is powered by a team of healthcare professionals, 
            technology experts, and patient advocates who are committed to 
            improving healthcare accessibility and outcomes.
          </p>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Certified Doctors</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50,000+</div>
              <div className="stat-label">Patients Served</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">98%</div>
              <div className="stat-label">Satisfaction Rate</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Support Available</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
