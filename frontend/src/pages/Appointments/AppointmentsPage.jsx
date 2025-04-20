import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
//import AppointmentCard from '../../components/appointments/AppointmentCard';
//import AppointmentFilter from '../../components/appointments/AppointmentFilter';
//import NewAppointmentModal from '../../components/appointments/NewAppointmentModal';
import AppointmentService from '../../api/AppointmentService';

const AppointmentsPage = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    status: 'all',
    date: 'upcoming',
    sortBy: 'date-asc'
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        // Replace with your actual API call
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch appointments');
        }
        
        const data = await response.json();
        setAppointments(data);
        setFilteredAppointments(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        addNotification(err.message, 'error');
      }
    };

    fetchAppointments();
  }, [addNotification]);

  useEffect(() => {
    applyFilters();
  }, [filterOptions, appointments, selectedDate]);

  useEffect(() => {
    fetchAvailableSlots(selectedDate);
  }, [selectedDate]);

  const applyFilters = () => {
    let filtered = [...appointments];
    
    // Filter by status
    if (filterOptions.status !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === filterOptions.status);
    }
    
    // Filter by date
    const now = new Date();
    if (filterOptions.date === 'upcoming') {
      filtered = filtered.filter(appointment => new Date(appointment.startTime) > now);
    } else if (filterOptions.date === 'past') {
      filtered = filtered.filter(appointment => new Date(appointment.startTime) < now);
    }
    
    // Sort appointments
    if (filterOptions.sortBy === 'date-asc') {
      filtered.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    } else if (filterOptions.sortBy === 'date-desc') {
      filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    }

    // Filter by selected date
    filtered = filtered.filter(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      return (
        appointmentDate.getFullYear() === selectedDate.getFullYear() &&
        appointmentDate.getMonth() === selectedDate.getMonth() &&
        appointmentDate.getDate() === selectedDate.getDate()
      );
    });
    
    setFilteredAppointments(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilterOptions(prev => ({ ...prev, ...newFilters }));
  };

  const handleCancelAppointment = async (id) => {
    try {
      // Replace with your actual API call
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${id}/cancel`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel appointment');
      }
      
      // Update local state after successful cancellation
      setAppointments(prev => 
        prev.map(app => app._id === id ? { ...app, status: 'cancelled' } : app)
      );
      
      addNotification('Appointment cancelled successfully', 'success');
    } catch (err) {
      addNotification(err.message, 'error');
    }
  };

  const handleCreateAppointment = (newAppointment) => {
    setAppointments(prev => [...prev, newAppointment]);
    addNotification('Appointment created successfully', 'success');
    setShowNewModal(false);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const fetchAvailableSlots = async (date) => {
    try {
      const response = await AppointmentService.getAvailableSlots(date);
      setAvailableSlots(response.data);
    } catch (err) {
      addNotification('Failed to fetch available slots', 'error');
    }
  };

  if (loading) return <div className="loading-spinner">Loading appointments...</div>;

  return (
    <div className="appointments-page">
      <div className="page-header">
        <h1>My Appointments</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowNewModal(true)}
        >
          Schedule New Appointment
        </button>
      </div>

      <AppointmentFilter 
        filterOptions={filterOptions} 
        onFilterChange={handleFilterChange} 
      />

      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
      />

      {error && <div className="error-message">{error}</div>}

      {!loading && filteredAppointments.length === 0 && (
        <div className="empty-state">
          <p>No appointments found. Schedule your first appointment now!</p>
        </div>
      )}

      <div className="appointments-grid">
        {filteredAppointments.map(appointment => (
          <AppointmentCard
            key={appointment._id}
            appointment={appointment}
            onCancel={() => handleCancelAppointment(appointment._id)}
            isPatient={user.role === 'patient'}
          />
        ))}
      </div>

      {showNewModal && (
        <NewAppointmentModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreateAppointment}
        />
      )}
    </div>
  );
};

export default AppointmentsPage;
