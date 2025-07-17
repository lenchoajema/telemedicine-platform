import { ClockIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { formatDate, formatTime } from '../../utils/dateUtils';

export default function AppointmentList({ 
  appointments = [], 
  emptyMessage = 'No appointments scheduled', 
  onCancel,
  onJoinCall,
  selectedDate 
}) {
  // Check if appointments is an array
  if (!Array.isArray(appointments)) {
    return (
      <div className="empty-state">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  let filteredAppointments = appointments;
  
  // Only filter by date if selectedDate is provided
  if (selectedDate) {
    filteredAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return (
        appointmentDate.getFullYear() === selectedDate.getFullYear() &&
        appointmentDate.getMonth() === selectedDate.getMonth() &&
        appointmentDate.getDate() === selectedDate.getDate()
      );
    });
  }

  return (
    <div className="appointment-list">
      {filteredAppointments.length === 0 ? (
        <div className="empty-state">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <ul className="appointment-items">
          {filteredAppointments.map((appointment) => {
            // Skip appointments with missing required data
            if (!appointment || !appointment._id) {
              console.warn('Skipping appointment with missing data:', appointment);
              return null;
            }

            return (
              <li key={appointment._id} className="appointment-card">
                <div className="appointment-header">
                  <h3 className="doctor-name">
                    Dr. {appointment.doctor?.profile?.firstName || appointment.doctor?.firstName}{' '}
                    {appointment.doctor?.profile?.lastName || appointment.doctor?.lastName}
                    {!appointment.doctor?.profile?.firstName && !appointment.doctor?.firstName && 'Unknown Doctor'}
                  </h3>
                  <span className={`status-badge ${appointment.status || 'unknown'}`}>
                    {appointment.status || 'Unknown'}
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
                {appointment.status === 'scheduled' && (
                  <button
                    className="btn secondary small"
                    onClick={() => onCancel?.(appointment._id)}
                    disabled={!onCancel}
                  >
                    Cancel
                  </button>
                )}
                <button 
                  className="btn primary small"
                  onClick={() => {
                    if (appointment.status === 'scheduled' && onJoinCall) {
                      onJoinCall(appointment);
                    } else {
                      // View details functionality can be added here
                      console.log('View details for appointment:', appointment._id);
                    }
                  }}
                >
                  {appointment.status === 'scheduled' ? 'Join Call' : 'View Details'}
                </button>
              </div>
            </li>
            );
          }).filter(Boolean)}
        </ul>
      )}
    </div>
  );
}
