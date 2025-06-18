import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContextCore';
import apiClient from '../../api/apiClient';

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    totalPatients: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDoctorDashboardData();
  }, []);

  const fetchDoctorDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch doctor stats
      const statsResponse = await apiClient.get('/doctors/stats');
      setStats(statsResponse.data || {
        totalAppointments: 0,
        todayAppointments: 0,
        totalPatients: 0,
        revenue: 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      
      // Set default stats to prevent crashes
      setStats({
        totalAppointments: 0,
        todayAppointments: 0,
        totalPatients: 0,
        revenue: 0
      });

      if (error.response?.status === 404) {
        addNotification('Dashboard data not available', 'warning');
      } else {
        addNotification('Failed to load dashboard data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="doctor-dashboard">
      <div className="dashboard-header">
        <h1>Welcome, Dr. {user?.profile?.firstName || 'Doctor'}</h1>
        <p>Here's your practice overview</p>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchDoctorDashboardData}>Retry</button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Appointments</h3>
          <p className="stat-number">{stats.totalAppointments || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Today's Appointments</h3>
          <p className="stat-number">{stats.todayAppointments || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Total Patients</h3>
          <p className="stat-number">{stats.totalPatients || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Monthly Revenue</h3>
          <p className="stat-number">${stats.revenue || 0}</p>
        </div>
      </div>

      <div className="dashboard-actions">
        <button onClick={() => window.location.href = '/doctor/appointments'}>
          View Appointments
        </button>
        <button onClick={() => window.location.href = '/doctor/availability'}>
          Set Availability
        </button>
        <button onClick={() => window.location.href = '/doctor/patients'}>
          My Patients
        </button>
      </div>
    </div>
  );
}