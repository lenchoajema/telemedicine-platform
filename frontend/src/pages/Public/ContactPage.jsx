import { useState } from 'react';
import './PublicPages.css';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    type: 'general'
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="public-page">
        <div className="page-header">
          <h1>Thank You!</h1>
          <p>Your message has been sent successfully. We'll get back to you within 24 hours.</p>
        </div>
        <div className="success-actions">
          <button 
            className="btn btn-primary"
            onClick={() => {
              setSubmitted(false);
              setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: '',
                type: 'general'
              });
            }}
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page">
      <div className="page-header">
        <h1>Contact Us</h1>
        <p>Get in touch with our healthcare support team</p>
      </div>

      <div className="contact-container">
        <div className="contact-info">
          <div className="contact-section">
            <h3>🏥 Customer Support</h3>
            <p>Available 24/7 for all your healthcare needs</p>
            <div className="contact-details">
              <div className="contact-item">
                <strong>Phone:</strong> 1-800-TELEMD1
              </div>
              <div className="contact-item">
                <strong>Email:</strong> support@telemedicine.com
              </div>
              <div className="contact-item">
                <strong>Chat:</strong> Available in your dashboard
              </div>
            </div>
          </div>

          <div className="contact-section">
            <h3>⚕️ Medical Emergencies</h3>
            <p>For life-threatening emergencies, call 911 immediately</p>
            <div className="emergency-info">
              <div className="emergency-item">
                <strong>Emergency:</strong> 911
              </div>
              <div className="emergency-item">
                <strong>Urgent Care:</strong> Available 24/7 on platform
              </div>
              <div className="emergency-item">
                <strong>Crisis Support:</strong> 988 (Suicide & Crisis Lifeline)
              </div>
            </div>
          </div>

          <div className="contact-section">
            <h3>🏢 Business Inquiries</h3>
            <p>Partnership and enterprise solutions</p>
            <div className="contact-details">
              <div className="contact-item">
                <strong>Phone:</strong> 1-800-BUSINESS
              </div>
              <div className="contact-item">
                <strong>Email:</strong> business@telemedicine.com
              </div>
            </div>
          </div>

          <div className="contact-section">
            <h3>🕒 Support Hours</h3>
            <div className="hours-list">
              <div className="hours-item">
                <strong>Medical Support:</strong> 24/7
              </div>
              <div className="hours-item">
                <strong>Technical Support:</strong> 6 AM - 10 PM EST
              </div>
              <div className="hours-item">
                <strong>Billing Support:</strong> 9 AM - 6 PM EST
              </div>
            </div>
          </div>
        </div>

        <div className="contact-form-container">
          <h2>Send us a Message</h2>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="type">Type of Inquiry</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="general">General Question</option>
                <option value="technical">Technical Support</option>
                <option value="billing">Billing & Insurance</option>
                <option value="medical">Medical Question</option>
                <option value="partnership">Partnership Inquiry</option>
                <option value="feedback">Feedback</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Brief description of your inquiry"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="6"
                placeholder="Please provide details about your inquiry..."
                required
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary submit-btn">
              Send Message
            </button>
          </form>
        </div>
      </div>

      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>How do I schedule an appointment?</h4>
            <p>Simply create an account, browse our doctors, and book a time that works for you.</p>
          </div>
          <div className="faq-item">
            <h4>Is telemedicine covered by insurance?</h4>
            <p>Most insurance plans cover telemedicine. We'll verify your coverage before your visit.</p>
          </div>
          <div className="faq-item">
            <h4>What technology do I need?</h4>
            <p>Just a smartphone, tablet, or computer with camera and internet connection.</p>
          </div>
          <div className="faq-item">
            <h4>Can I get prescriptions online?</h4>
            <p>Yes! Our doctors can prescribe medications and send them directly to your pharmacy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
