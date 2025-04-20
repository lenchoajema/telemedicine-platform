import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import AppointmentService from '../../api/AppointmentService';
//import DashboardCard from '../../components/dashboard/DashboardCard';
import AppointmentList from '../../components/appointments/AppointmentList';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const [stats, setStats] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [appointmentsRes, statsRes] = await Promise.all([
          AppointmentService.getUpcomingAppointments(),
          AppointmentService.getStats()
        ]);
        
        setUpcomingAppointments(appointmentsRes.data);
        setStats(statsRes.data);
      } catch (err) {
        showNotification('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showNotification]);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Welcome, {user.profile.firstName}</h1>
      
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
        
        {user.role === 'doctor' && (
          <DashboardCard 
            title="Patients"
            value={stats?.patientCount || 0}
            icon="users"
            variant="info"
          />
        )}
      </div>
      
      <section className="dashboard-section">
        <h2>Your Upcoming Appointments</h2>
        <AppointmentList 
          appointments={upcomingAppointments} 
          emptyMessage="No upcoming appointments"
        />
        
        <div className="dashboard-actions">
          <button className="btn primary">
            Book New Appointment
          </button>
        </div>
      </section>
    </div>
  );
}
