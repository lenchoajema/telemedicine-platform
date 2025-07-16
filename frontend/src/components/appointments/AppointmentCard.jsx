import { formatDate, formatTime } from '../../utils/dateUtils';

export default function AppointmentCard({ 
  appointment, 
  onCancel, 
  isPatient = true 
}) {
  const getStatusClass = (status) => {
    switch(status) {
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      case 'no-show': return 'status-no-show';
      default: return 'status-scheduled';
    }
  };

  return (
    <div className={`appointment-card ${getStatusClass(appointment.status)}`}>
      <div className="appointment-header">
        <div className="appointment-title">
          {isPatient ? (
            <h3>
              Dr. {appointment.doctor?.profile?.firstName || appointment.doctor?.firstName} {appointment.doctor?.profile?.lastName || appointment.doctor?.lastName}
              {appointment.doctor?.specialization && (
                <span className="doctor-specialization"> - {appointment.doctor.specialization}</span>
              )}
            </h3>
          ) : (
            <h3>{appointment.patient?.profile?.firstName} {appointment.patient?.profile?.lastName}</h3>
          )}
          <span className={`status-badge ${appointment.status}`}>
            {appointment.status}
          </span>
        </div>
      </div>
      
      <div className="appointment-details">
        <div className="detail-row">
          <span className="detail-label">Date:</span>
          <span className="detail-value">{formatDate(appointment.date)}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Time:</span>
          <span className="detail-value">
            {formatTime(appointment.date)} - 
            {formatTime(new Date(new Date(appointment.date).getTime() + appointment.duration * 60000))}
          </span>
        </div>
        
        {appointment.reason && (
          <div className="detail-row">
            <span className="detail-label">Reason:</span>
            <span className="detail-value">{appointment.reason}</span>
          </div>
        )}

        {isPatient && appointment.doctor?.specialization && (
          <div className="detail-row">
            <span className="detail-label">Specialization:</span>
            <span className="detail-value">{appointment.doctor.specialization}</span>
          </div>
        )}

        {isPatient && appointment.doctor?.licenseNumber && (
          <div className="detail-row">
            <span className="detail-label">License:</span>
            <span className="detail-value">{appointment.doctor.licenseNumber}</span>
          </div>
        )}
      </div>
      
      <div className="appointment-actions">
        {appointment.status === 'scheduled' && (
          <>
            {onCancel && (
              <button 
                onClick={() => onCancel(appointment._id)} 
                className="btn btn-outline"
              >
                Cancel
              </button>
            )}
            
            {appointment.meetingUrl && (
              <a 
                href={appointment.meetingUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary"
              >
                Join Call
              </a>
            )}
          </>
        )}
        
        {appointment.status === 'completed' && (
          <button className="btn btn-secondary">
            View Summary
          </button>
        )}
      </div>
    </div>
  );
}