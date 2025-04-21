import React from 'react';
import { Link } from 'react-router-dom';
import './DoctorCard.css';

const DoctorCard = ({ doctor, onBookAppointment }) => {
  if (!doctor || !doctor.profile) {
    return null; // Return null if doctor data is invalid
  }

  return (
    <div className="doctor-card">
      <div className="doctor-avatar">
        {doctor.profile.avatar ? (
          <img src={doctor.profile.avatar} alt={`Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}`} />
        ) : (
          <div className="avatar-placeholder">
            {doctor.profile.firstName?.charAt(0)}{doctor.profile.lastName?.charAt(0)}
          </div>
        )}
      </div>
      
      <div className="doctor-info">
        <h3 className="doctor-name">
          Dr. {doctor.profile.firstName} {doctor.profile.lastName}
        </h3>
        
        <div className="doctor-specialty">{doctor.specialization}</div>
        
        {doctor.education && (
          <div className="doctor-education">
            {doctor.education}
          </div>
        )}
        
        {doctor.yearsOfExperience && (
          <div className="doctor-experience">
            {doctor.yearsOfExperience} years of experience
          </div>
        )}
      </div>
      
      <div className="doctor-actions">
        <Link to={`/doctors/${doctor._id}`} className="btn btn-outline">
          View Profile
        </Link>
        <button 
          onClick={() => onBookAppointment(doctor._id)} 
          className="btn btn-primary"
        >
          Book Appointment
        </button>
      </div>
    </div>
  );
};

export default DoctorCard;
