import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
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

  useEffect(() => {
    const fetchPatientDashboardData = async () => {
      try {
        setLoading(true);
        
        const [appointmentsRes, statsRes, recentDoctorsRes] = await Promise.all([
          AppointmentService.getUpcomingAppointments(),
          AppointmentService.getStats(),
          fetch(`${import.meta.env.VITE_API_URL}/patients/recent-doctors`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }).then(res => res.json())
        ]);
        
        setUpcomingAppointments(appointmentsRes.data);
        setStats(statsRes.data);
        setRecentDoctors(recentDoctorsRes || []);
      } catch (err) {
        addNotification(`Failed to load dashboard data: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDashboardData();
  }, [addNotification]);

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
            <h2>Your Recent Doctors</h2>
            <Link to="/doctors" className="btn secondary">Browse All Doctors</Link>
          </div>
          
          <div className="recent-doctors-list">
            {recentDoctors.map(doctor => (
              <div key={doctor._id} className="recent-doctor-card">
                <div className="doctor-avatar">
                  <img 
                    src={doctor.profile.avatar || '/default-avatar.png'} 
                    alt={doctor.profile.fullName} 
                  />
                </div>
                <div className="doctor-info">
                  <h3>{doctor.profile.fullName}</h3>
                  <p>{doctor.profile.specialization}</p>
                </div>
                <div className="doctor-actions">
                  <Link to={`/doctors/${doctor._id}`} className="btn text">View Profile</Link>
                  <Link to={`/appointments/new?doctorId=${doctor._id}`} className="btn secondary">Book Again</Link>
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
