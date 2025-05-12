import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContextCore';
import DashboardCard from '../../components/dashboard/DashboardCard';
import AppointmentList from '../../components/appointments/AppointmentList';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import './DashboardPage.css';

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [stats, setStats] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState('pending');

  useEffect(() => {
    const fetchDoctorDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch doctor-specific statistics
        const statsResponse = await fetch(`${import.meta.env.VITE_API_URL}/doctors/stats`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!statsResponse.ok) throw new Error('Failed to fetch doctor statistics');
        const statsData = await statsResponse.json();
        
        // Fetch upcoming appointments
        const appointmentsResponse = await fetch(`${import.meta.env.VITE_API_URL}/appointments/upcoming`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!appointmentsResponse.ok) throw new Error('Failed to fetch appointments');
        const appointmentsData = await appointmentsResponse.json();
        
        // Get doctor verification status
        const doctorResponse = await fetch(`${import.meta.env.VITE_API_URL}/doctors/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (doctorResponse.ok) {
          const doctorData = await doctorResponse.json();
          setVerificationStatus(doctorData.status || 'pending');
        }
        
        setStats(statsData);
        setUpcomingAppointments(appointmentsData);
      } catch (err) {
        addNotification(`Failed to load doctor dashboard data: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorDashboardData();
  }, [addNotification]);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="dashboard-page doctor-dashboard">
      <h1 className="dashboard-title">Doctor Dashboard</h1>
      <p className="dashboard-subtitle">Welcome, Dr. {user.profile.lastName}</p>
      
      {verificationStatus !== 'active' && (
        <div className={`verification-alert ${verificationStatus}`}>
          {verificationStatus === 'pending' ? (
            <p>Your account is pending verification. You will have limited access until your credentials are verified.</p>
          ) : verificationStatus === 'rejected' ? (
            <p>Your verification was rejected. Please update your information and resubmit.</p>
          ) : (
            <p>Please complete your verification to access all doctor features.</p>
          )}
          <Link to="/doctor/verification" className="btn secondary">Update Verification</Link>
        </div>
      )}
      
      <div className="dashboard-stats">
        <DashboardCard 
          title="Today's Appointments"
          value={stats?.todayAppointments || 0}
          icon="calendar-day"
          variant="primary"
        />
        
        <DashboardCard 
          title="Patients"
          value={stats?.patientCount || 0}
          icon="users"
          variant="info"
        />
        
        <DashboardCard 
          title="Upcoming Appointments"
          value={stats?.upcomingCount || 0}
          icon="calendar"
          variant="warning"
        />
        
        <DashboardCard 
          title="Completed Visits"
          value={stats?.completedCount || 0}
          icon="check-circle"
          variant="success"
        />
      </div>
      
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Upcoming Appointments</h2>
          <Link to="/appointments" className="btn primary">View All</Link>
        </div>
        
        <AppointmentList 
          appointments={upcomingAppointments}
          emptyMessage="No upcoming appointments"
        />
      </section>
      
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Quick Actions</h2>
        </div>
        
        <div className="doctor-quick-actions">
          <Link to="/doctor/availability" className="quick-action-card">
            <span className="icon">🕒</span>
            <span className="title">Set Availability</span>
          </Link>
          
          <Link to="/doctor/patients" className="quick-action-card">
            <span className="icon">👥</span>
            <span className="title">My Patients</span>
          </Link>
          
          <Link to="/doctor/profile" className="quick-action-card">
            <span className="icon">👨‍⚕️</span>
            <span className="title">Edit Profile</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
