import { Link } from "react-router-dom";
import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1>Virtual Healthcare for You</h1>
        <p>
          Connect with licensed doctors remotely and get medical advice,
          prescriptions, and care whenever you need it.
        </p>
        <div className="hero-buttons">
          <Link to="/register" className="btn btn-primary">
            Get Started
          </Link>
          <Link to="/doctors" className="btn btn-secondary">
            Find a Doctor
          </Link>
        </div>
      </div>
      <div className="hero-image">
        <img src="/images/hero-image.svg" alt="Telemedicine illustration" />
      </div>
    </section>
  );
}
