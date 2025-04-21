import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import './Home.css';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>{user ? `Welcome back, ${user.name || 'User'}` : 'Healthcare at Your Fingertips'}</h1>
          <p>
            Connect with licensed doctors remotely and get medical advice,
            prescriptions, and care whenever you need it.
          </p>
          <div className="cta-buttons">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary animated-element">
                Go to Dashboard
              </Link>
            ) : (
              <Link to="/register" className="btn btn-primary animated-element">
                Get Started Now
              </Link>
            )}
            <Link to="/doctors" className="btn btn-secondary">
              Browse Doctors
            </Link>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">📅</div>
          <h3>Quick Appointments</h3>
          <p>Schedule virtual visits with just a few clicks, no waiting rooms needed.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">👨‍⚕️</div>
          <h3>Expert Doctors</h3>
          <p>Connect with board-certified physicians across various specialties.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">💊</div>
          <h3>Digital Prescriptions</h3>
          <p>Get medications prescribed online and delivered to your doorstep.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Secure Platform</h3>
          <p>Your health information is protected with enterprise-grade security.</p>
        </div>
      </section>

      <section className="testimonials">
        <h2>What Our Patients Say</h2>
        <div className="testimonial-cards">
          <div className="testimonial-card">
            <p>"The virtual consultation saved me so much time. The doctor was professional and helped me quickly!"</p>
            <div className="testimonial-author">
              <img src="https://randomuser.me/api/portraits/women/45.jpg" alt="Sarah M." className="author-avatar" />
              <div>
                <strong>Sarah M.</strong>
                <div>Patient</div>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <p>"I was skeptical about telemedicine at first, but now I use it for all my regular check-ups. Highly recommend!"</p>
            <div className="testimonial-author">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="David R." className="author-avatar" />
              <div>
                <strong>David R.</strong>
                <div>Patient</div>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <p>"As someone with a busy schedule, being able to talk to a doctor from my office has been a game-changer."</p>
            <div className="testimonial-author">
              <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Lisa K." className="author-avatar" />
              <div>
                <strong>Lisa K.</strong>
                <div>Patient</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to prioritize your health?</h2>
          <p>Join thousands of patients who've made healthcare easier with our telemedicine platform.</p>
          {user ? (
            <Link to="/appointments" className="btn btn-primary">
              Schedule an Appointment
            </Link>
          ) : (
            <Link to="/register" className="btn btn-primary">
              Create Your Free Account
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}