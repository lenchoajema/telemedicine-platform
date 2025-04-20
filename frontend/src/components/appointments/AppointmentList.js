import { ClockIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { formatDate, formatTime } from '../../utils/dateUtils';

export default function AppointmentList({ 
  appointments, 
  emptyMessage = 'No appointments scheduled', 
  onCancel 
}) {
  return (
    <div className="appointment-list">
      {appointments.length === 0 ? (
        <div className="empty-state">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <ul className="appointment-items">
          {appointments.map((appointment) => (
            <li key={appointment._id} className="appointment-card">
              <div className="appointment-header">
                <h3 className="doctor-name">
                  Dr. {appointment.doctor.profile.fullName}
                </h3>
                <span className={`status-badge ${appointment.status}`}>
                  {appointment.status}
                </span>
              </div>

              <div className="appointment-details">
                <div className="detail-item">
                  <CalendarIcon className="icon" />
                  <span>{formatDate(appointment.date)}</span>
                </div>
                <div className="detail-item">
                  <ClockIcon className="icon" />
                  <span>
                    {formatTime(appointment.date)} -{' '}
                    {formatTime(
                      new Date(
                        new Date(appointment.date).getTime() +
                          appointment.duration * 60000
                      )
                    )}
                  </span>
                </div>
                <div className="detail-item">
                  <UserIcon className="icon" />
                  <span>{appointment.reason || 'General Consultation'}</span>
                </div>
              </div>

              <div className="appointment-actions">
                <button
                  className="btn secondary small"
                  onClick={() => onCancel?.(appointment._id)}
                >
                  Cancel
                </button>
                <button className="btn primary small">
                  {appointment.status === 'scheduled' ? 'Join Call' : 'View Details'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
