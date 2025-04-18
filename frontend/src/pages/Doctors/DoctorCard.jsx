import { Link } from 'react-router-dom';
import Rating from '../shared/Rating';
import './DoctorCard.css';

export default function DoctorCard({ doctor }) {
  return (
    <div className="doctor-card">
      <div className="doctor-avatar">
        <img 
          src={doctor.profile.avatar || '/default-avatar.jpg'} 
          alt={doctor.profile.fullName}
        />
      </div>
      
      <div className="doctor-info">
        <h3>
          <Link to={`/doctors/${doctor._id}`}>
            Dr. {doctor.profile.fullName}
          </Link>
        </h3>
        
        <p className="specialty">{doctor.specialization}</p>
        
        <Rating 
          value={doctor.rating || 4.5} 
          max={5} 
          readOnly 
        />
        
        <div className="doctor-meta">
          <span>🏥 {doctor.hospital || 'City Hospital'}</span>
          <span>💼 {doctor.experience || 5}+ years</span>
        </div>
        
        <button className="btn primary small">
          Book Appointment
        </button>
      </div>
    </div>
  );
}