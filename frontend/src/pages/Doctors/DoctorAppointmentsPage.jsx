import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContextCore';
import apiClient from '../../api/apiClient';
import './DoctorPages.css';

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, upcoming, today, completed

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = '/appointments';
      if (filter === 'upcoming') {
        endpoint = '/appointments/upcoming';
      }

      const response = await apiClient.get(endpoint);
      let appointmentsData = response.data || [];

      // Filter appointments based on selected filter
      if (filter === 'today') {
        const today = new Date().toDateString();
        appointmentsData = appointmentsData.filter(apt => 
          new Date(apt.date).toDateString() === today
        );
      } else if (filter === 'completed') {
        appointmentsData = appointmentsData.filter(apt => 
          apt.status === 'completed'
        );
      } else if (filter === 'upcoming') {
        appointmentsData = appointmentsData.filter(apt => 
          apt.status === 'scheduled' && new Date(apt.date) > new Date()
        );
      }

      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments');
      addNotification('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await apiClient.put(`/appointments/${appointmentId}`, { status: newStatus });
      addNotification(`Appointment ${newStatus} successfully`, 'success');
      fetchAppointments(); // Refresh the list
    } catch (error) {
      console.error('Error updating appointment:', error);
      addNotification('Failed to update appointment', 'error');
    }
  };

  const rescheduleAppointment = async (appointmentId, newDate, newTime) => {
    try {
      await apiClient.put(`/appointments/${appointmentId}/reschedule`, {
        date: newDate,
        time: newTime
      });
      addNotification('Appointment rescheduled successfully', 'success');
      fetchAppointments();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      addNotification('Failed to reschedule appointment', 'error');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not set';
    return timeString;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return '#28a745';
      case 'completed': return '#6c757d';
      case 'cancelled': return '#dc3545';
      case 'no-show': return '#ffc107';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="doctor-page">
        <div className="loading-spinner"></div>
        <p>Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="doctor-page">
      <div className="page-header">
        <h1>My Appointments</h1>
        <p>Manage your patient appointments</p>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchAppointments}>Retry</button>
        </div>
      )}

      <div className="appointments-filters">
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}
        >
          All Appointments
        </button>
        <button 
          className={filter === 'today' ? 'active' : ''} 
          onClick={() => setFilter('today')}
        >
          Today
        </button>
        <button 
          className={filter === 'upcoming' ? 'active' : ''} 
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button 
          className={filter === 'completed' ? 'active' : ''} 
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      <div className="appointments-list">
        {appointments.length === 0 ? (
          <div className="empty-state">
            <p>No appointments found for the selected filter.</p>
          </div>
        ) : (
          appointments.map((appointment) => (
            <div key={appointment._id} className="appointment-card">
              <div className="appointment-header">
                <div className="patient-info">
                  <h3>{appointment.patient?.firstName} {appointment.patient?.lastName}</h3>
                  <p className="patient-email">{appointment.patient?.email}</p>
                </div>
                <div 
                  className="appointment-status"
                  style={{ backgroundColor: getStatusColor(appointment.status) }}
                >
                  {appointment.status}
                </div>
              </div>

              <div className="appointment-details">
                <div className="detail-item">
                  <strong>Date:</strong> {formatDate(appointment.date)}
                </div>
                <div className="detail-item">
                  <strong>Time:</strong> {formatTime(appointment.time)}
                </div>
                <div className="detail-item">
                  <strong>Type:</strong> {appointment.type || 'General Consultation'}
                </div>
                {appointment.reason && (
                  <div className="detail-item">
                    <strong>Reason:</strong> {appointment.reason}
                  </div>
                )}
                {appointment.notes && (
                  <div className="detail-item">
                    <strong>Notes:</strong> {appointment.notes}
                  </div>
                )}
              </div>

              <div className="appointment-actions">
                {appointment.status === 'scheduled' && (
                  <>
                    <button 
                      className="btn btn-primary"
                      onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                    >
                      Mark Complete
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-warning"
                      onClick={() => updateAppointmentStatus(appointment._id, 'no-show')}
                    >
                      No Show
                    </button>
                  </>
                )}

                {appointment.status === 'scheduled' && (
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      const newDate = prompt('Enter new date (YYYY-MM-DD):');
                      const newTime = prompt('Enter new time (HH:MM):');
                      if (newDate && newTime) {
                        rescheduleAppointment(appointment._id, newDate, newTime);
                      }
                    }}
                  >
                    Reschedule
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
