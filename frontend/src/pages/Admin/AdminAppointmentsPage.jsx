import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContextCore';
import apiClient from '../../api/apiClient';
import './AdminPages.css';

export default function AdminAppointmentsPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/appointments');
      setAppointments(response.data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      addNotification('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await apiClient.put(`/appointments/${appointmentId}`, { status });
      addNotification(`Appointment ${status} successfully`, 'success');
      fetchAppointments(); // Refresh the list
    } catch (error) {
      addNotification('Failed to update appointment status', 'error');
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = !searchTerm || 
      appointment.patient?.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient?.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctor?.user?.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctor?.user?.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filter === 'all' || appointment.status === filter;
    
    const matchesDate = !dateFilter || 
      new Date(appointment.date).toDateString() === new Date(dateFilter).toDateString();

    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return '#2563eb';
      case 'completed': return '#10b981';
      case 'cancelled': return '#dc2626';
      case 'no-show': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-spinner"></div>
        <p>Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Appointment Management</h1>
        <p>Monitor and manage all appointments</p>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by patient or doctor name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Appointments</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No Show</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            placeholder="Filter by date"
          />
        </div>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <h3>{appointments.filter(a => a.status === 'scheduled').length}</h3>
          <p>Scheduled</p>
        </div>
        <div className="stat-card">
          <h3>{appointments.filter(a => a.status === 'completed').length}</h3>
          <p>Completed</p>
        </div>
        <div className="stat-card">
          <h3>{appointments.filter(a => a.status === 'cancelled').length}</h3>
          <p>Cancelled</p>
        </div>
        <div className="stat-card">
          <h3>{appointments.length}</h3>
          <p>Total</p>
        </div>
      </div>

      <div className="appointments-table">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date & Time</th>
              <th>Type</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.map(appointment => (
              <tr key={appointment._id}>
                <td>
                  <div className="patient-info">
                    <div className="patient-name">
                      {appointment.patient?.profile?.firstName} {appointment.patient?.profile?.lastName}
                    </div>
                    <div className="patient-email">{appointment.patient?.email}</div>
                  </div>
                </td>
                <td>
                  <div className="doctor-info">
                    <div className="doctor-name">
                      {appointment.doctor?.user?.profile?.firstName} {appointment.doctor?.user?.profile?.lastName}
                    </div>
                    <div className="doctor-specialty">{appointment.doctor?.specialization}</div>
                  </div>
                </td>
                <td>
                  <div className="datetime-info">
                    <div className="date">{formatDateTime(appointment.date)}</div>
                    <div className="duration">{appointment.duration || 30} min</div>
                  </div>
                </td>
                <td>{appointment.type || 'Consultation'}</td>
                <td>
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(appointment.status) }}
                  >
                    {appointment.status}
                  </span>
                </td>
                <td>
                  <div className="reason" title={appointment.reason}>
                    {appointment.reason ? 
                      (appointment.reason.length > 30 ? 
                        appointment.reason.substring(0, 30) + '...' : 
                        appointment.reason) : 
                      'No reason provided'}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    {appointment.status === 'scheduled' && (
                      <>
                        <button 
                          className="btn btn-success"
                          onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                        >
                          Complete
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    <button 
                      className="btn btn-secondary"
                      onClick={() => {
                        // Open appointment details modal or page
                        console.log('View appointment details:', appointment._id);
                      }}
                    >
                      Details
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAppointments.length === 0 && (
          <div className="empty-state">
            <p>No appointments found matching your criteria.</p>
          </div>
        )}
      </div>

      <div className="appointment-insights">
        <h2>Appointment Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <h3>Most Popular Time</h3>
            <p>2:00 PM - 4:00 PM</p>
          </div>
          <div className="insight-card">
            <h3>Average Duration</h3>
            <p>32 minutes</p>
          </div>
          <div className="insight-card">
            <h3>Completion Rate</h3>
            <p>
              {appointments.length > 0 ? 
                Math.round((appointments.filter(a => a.status === 'completed').length / appointments.length) * 100) : 0}%
            </p>
          </div>
          <div className="insight-card">
            <h3>No-Show Rate</h3>
            <p>
              {appointments.length > 0 ? 
                Math.round((appointments.filter(a => a.status === 'no-show').length / appointments.length) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
