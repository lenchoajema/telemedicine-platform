import { Link } from 'react-router-dom';
import './PublicPages.css';

export default function ServicesPage() {
  const services = [
    {
      id: 1,
      title: "General Consultation",
      description: "Connect with general practitioners for routine check-ups, health concerns, and medical advice.",
      features: ["Same-day appointments", "Prescription services", "Follow-up care", "Health monitoring"],
      price: "$49",
      icon: "🩺"
    },
    {
      id: 2,
      title: "Specialist Care",
      description: "Access specialized medical care from certified specialists in various fields.",
      features: ["Cardiology", "Dermatology", "Mental Health", "Orthopedics"],
      price: "$89",
      icon: "👨‍⚕️"
    },
    {
      id: 3,
      title: "Mental Health",
      description: "Professional mental health support and counseling services.",
      features: ["Licensed therapists", "Anxiety & depression", "Stress management", "Confidential sessions"],
      price: "$79",
      icon: "🧠"
    },
    {
      id: 4,
      title: "Urgent Care",
      description: "Immediate medical attention for non-emergency urgent health issues.",
      features: ["24/7 availability", "Quick diagnosis", "Treatment plans", "Emergency referrals"],
      price: "$69",
      icon: "⚡"
    },
    {
      id: 5,
      title: "Prescription Services",
      description: "Online prescription management and pharmacy delivery services.",
      features: ["Digital prescriptions", "Pharmacy partnerships", "Home delivery", "Refill reminders"],
      price: "$19",
      icon: "💊"
    },
    {
      id: 6,
      title: "Health Monitoring",
      description: "Ongoing health tracking and preventive care management.",
      features: ["Chronic disease management", "Health analytics", "Regular check-ins", "Care coordination"],
      price: "$39",
      icon: "📊"
    }
  ];

  return (
    <div className="public-page">
      <div className="page-header">
        <h1>Our Healthcare Services</h1>
        <p>Comprehensive medical care tailored to your needs</p>
      </div>

      <div className="services-grid">
        {services.map(service => (
          <div key={service.id} className="service-card">
            <div className="service-icon">{service.icon}</div>
            <h3>{service.title}</h3>
            <p className="service-description">{service.description}</p>
            
            <div className="service-features">
              <h4>What's Included:</h4>
              <ul>
                {service.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            
            <div className="service-pricing">
              <span className="price">Starting at {service.price}</span>
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        ))}
      </div>

      <section className="services-info">
        <div className="info-section">
          <h2>How Our Services Work</h2>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-icon">📱</div>
              <h3>Book Online</h3>
              <p>Choose your service and schedule an appointment that fits your schedule</p>
            </div>
            <div className="process-step">
              <div className="step-icon">💻</div>
              <h3>Virtual Visit</h3>
              <p>Meet with your healthcare provider via secure video consultation</p>
            </div>
            <div className="process-step">
              <div className="step-icon">📋</div>
              <h3>Follow-up</h3>
              <p>Receive your treatment plan, prescriptions, and ongoing care support</p>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h2>Insurance & Payment</h2>
          <p>
            We accept most major insurance plans and offer transparent pricing 
            for all our services. No hidden fees, no surprises.
          </p>
          <div className="payment-options">
            <div className="payment-item">✅ Most Insurance Plans Accepted</div>
            <div className="payment-item">✅ Flexible Payment Options</div>
            <div className="payment-item">✅ HSA/FSA Eligible</div>
            <div className="payment-item">✅ Transparent Pricing</div>
          </div>
        </div>

        <div className="cta-section">
          <h2>Ready to Start Your Healthcare Journey?</h2>
          <p>Join thousands of patients who trust us with their healthcare needs.</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary">
              Create Account
            </Link>
            <Link to="/doctors" className="btn btn-secondary">
              Browse Doctors
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
