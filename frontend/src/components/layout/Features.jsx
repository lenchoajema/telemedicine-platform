import "./Features.css";

export default function Features() {
  const features = [
    {
      title: "24/7 Doctor Availability",
      description: "Connect with doctors anytime, day or night, for urgent care needs.",
      icon: "🕒"
    },
    {
      title: "Video Consultations",
      description: "Face-to-face virtual visits with healthcare specialists.",
      icon: "🎥"
    },
    {
      title: "Secure Messaging",
      description: "Send questions and receive answers from your healthcare team.",
      icon: "🔒"
    },
    {
      title: "Prescription Services",
      description: "Get medications prescribed and sent to your preferred pharmacy.",
      icon: "💊"
    }
  ];

  return (
    <section className="features-section">
      <h2>Our Services</h2>
      <p className="section-subtitle">
        Comprehensive healthcare services available at your fingertips
      </p>
      
      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
