import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContextCore';
import AppointmentService from '../../api/AppointmentService';
import DashboardCard from '../../components/dashboard/DashboardCard';
import AppointmentList from '../../components/appointments/AppointmentList';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import './DashboardPage.css';

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [stats, setStats] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentDoctors, setRecentDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add debugging
  console.log('PatientDashboardPage rendered, user:', user);

  useEffect(() => {
    console.log('PatientDashboardPage useEffect triggered');
    const fetchPatientDashboardData = async () => {
      try {
        setLoading(true);
        
        try {
          const appointmentsRes = await AppointmentService.getUpcomingAppointments();
          const statsRes = await AppointmentService.getStats();
          
          // Fetch recent doctors with better error handling
          let recentDoctorsRes = [];
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/patients/recent-doctors`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            if (response.ok) {
              recentDoctorsRes = await response.json();
            } else {
              console.warn('Could not fetch recent doctors:', response.status);
            }
          } catch (error) {
            console.error('Error fetching recent doctors:', error);
          }
          
          // If no recent doctors, fetch all doctors as fallback
          if (!recentDoctorsRes || recentDoctorsRes.length === 0) {
            try {
              const response = await fetch(`${import.meta.env.VITE_API_URL}/doctors`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });
              if (response.ok) {
                const allDoctorsResponse = await response.json();
                const allDoctors = allDoctorsResponse.data || allDoctorsResponse;
                // Limit to 5 doctors and format them properly
                recentDoctorsRes = allDoctors.slice(0, 5).map(doctor => ({
                  _id: doctor._id,
                  profile: {
                    fullName: doctor.user?.profile?.fullName || `${doctor.user?.profile?.firstName || ''} ${doctor.user?.profile?.lastName || ''}`.trim(),
                    firstName: doctor.user?.profile?.firstName,
                    lastName: doctor.user?.profile?.lastName,
                    specialization: doctor.specialization,
                    avatar: doctor.user?.profile?.photo,
                    experience: doctor.experience
                  }
                }));
              }
            } catch (error) {
              console.error('Error fetching all doctors:', error);
            }
          } else {
            // Format recent doctors to match expected structure
            recentDoctorsRes = recentDoctorsRes.map(doctor => ({
              _id: doctor._id,
              profile: {
                fullName: `${doctor.firstName} ${doctor.lastName}`.trim(),
                firstName: doctor.firstName,
                lastName: doctor.lastName,
                specialization: doctor.specialization,
                avatar: doctor.avatar
              }
            }));
          }
          
          setUpcomingAppointments(appointmentsRes);
          setStats(statsRes);
          setRecentDoctors(recentDoctorsRes || []);
        } catch (innerError) {
          console.error('Error in Promise.all for dashboard data:', innerError);
        }
      } catch (err) {
        addNotification(`Failed to load dashboard data: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDashboardData();
  }, [addNotification]);

  const handleCancelAppointment = async (appointmentId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        addNotification('Appointment cancelled successfully', 'success');
        // Refresh upcoming appointments
        setUpcomingAppointments(prev => prev.filter(apt => apt._id !== appointmentId));
      } else {
        const error = await response.json();
        addNotification(`Failed to cancel appointment: ${error.error}`, 'error');
      }
    } catch (error) {
      addNotification(`Error cancelling appointment: ${error.message}`, 'error');
    }
  };

  const handleJoinCall = (appointment) => {
    if (appointment.meetingUrl) {
      // Open meeting URL in new tab
      window.open(appointment.meetingUrl, '_blank');
    } else {
      // For now, show a notification that the meeting will start soon
      addNotification(`Meeting for your appointment with Dr. ${appointment.doctor?.user?.profile?.fullName || 'Doctor'} will start soon`, 'info');
      // In a real application, this would generate or retrieve the meeting URL
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="dashboard-page patient-dashboard">
      <h1 className="dashboard-title">Patient Dashboard</h1>
      <p className="dashboard-subtitle">Welcome, {user.profile.firstName}</p>
      
      <div className="dashboard-stats">
        <DashboardCard 
          title="Upcoming Appointments"
          value={stats?.upcomingCount || 0}
          icon="calendar"
          variant="primary"
        />
        
        <DashboardCard 
          title="Completed Visits"
          value={stats?.completedCount || 0}
          icon="check-circle"
          variant="success"
        />
        
        <DashboardCard 
          title="Prescriptions"
          value={stats?.prescriptionCount || 0}
          icon="prescription"
          variant="info"
        />
        
        <DashboardCard 
          title="Medical Records"
          value={stats?.recordCount || 0}
          icon="file-medical"
          variant="warning"
        />
      </div>
      
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Your Upcoming Appointments</h2>
          <Link to="/appointments" className="btn primary">View All</Link>
        </div>
        
        <AppointmentList 
          appointments={upcomingAppointments} 
          emptyMessage="No upcoming appointments"
          onCancel={handleCancelAppointment}
          onJoinCall={handleJoinCall}
        />
        
        <div className="dashboard-actions">
          <Link to="/appointments/new" className="btn primary">
            Book New Appointment
          </Link>
        </div>
      </section>
      
      {recentDoctors.length > 0 && (
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Available Doctors</h2>
            <Link to="/doctors" className="btn secondary">Browse All Doctors</Link>
          </div>
          
          <div className="recent-doctors-list">
            {recentDoctors.map(doctor => (
              <div key={doctor._id} className="recent-doctor-card">
                <div className="doctor-avatar">
                  <img 
                    src={doctor.profile?.avatar || '/default-avatar.png'} 
                    alt={doctor.profile?.fullName || 'Doctor'}
                    onError={(e) => {
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                </div>
                <div className="doctor-info">
                  <h3>{doctor.profile?.fullName || `Dr. ${doctor.profile?.firstName || ''} ${doctor.profile?.lastName || ''}`.trim()}</h3>
                  <p className="specialization">{doctor.profile?.specialization || 'General Medicine'}</p>
                  {doctor.profile?.experience && (
                    <p className="experience">{doctor.profile.experience} years experience</p>
                  )}
                  <div className="doctor-rating">
                    <span className="rating-stars">⭐⭐⭐⭐⭐</span>
                    <span className="rating-text">4.8 (124 reviews)</span>
                  </div>
                </div>
                <div className="doctor-actions">
                  <Link to={`/doctors/${doctor._id}`} className="btn text">View Profile</Link>
                  <Link to={`/appointments/new?doctorId=${doctor._id}`} className="btn secondary">Book Appointment</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Quick Actions</h2>
        </div>
        
        <div className="patient-quick-actions">
          <Link to="/appointments/new" className="quick-action-card">
            <span className="icon">📅</span>
            <span className="title">Book Appointment</span>
          </Link>
          
          <Link to="/doctors" className="quick-action-card">
            <span className="icon">👨‍⚕️</span>
            <span className="title">Find Doctors</span>
          </Link>
          
          <Link to="/medical-records" className="quick-action-card">
            <span className="icon">📋</span>
            <span className="title">Medical Records</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
