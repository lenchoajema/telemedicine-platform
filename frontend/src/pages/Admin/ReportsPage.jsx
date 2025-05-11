import { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import './AdminPages.css';

export default function ReportsPage() {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [reportData, setReportData] = useState({
    registrations: [],
    appointments: [],
    verifications: []
  });

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports?range=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch report data');
        }

        const data = await response.json();
        setReportData(data);
      } catch (error) {
        addNotification(`Error: ${error.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [timeRange, addNotification]);

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  const downloadCSV = async (reportType) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports/${reportType}/export?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${reportType}-${timeRange}-report.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      addNotification('Report downloaded successfully', 'success');
    } catch (error) {
      addNotification(`Error: ${error.message}`, 'error');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-page reports-page">
      <h1>System Reports</h1>
      
      <div className="filters-container">
        <div className="filter-dropdown">
          <select value={timeRange} onChange={handleTimeRangeChange}>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>
      
      <div className="reports-grid">
        <div className="report-card">
          <div className="report-header">
            <h2>User Registrations</h2>
            <button 
              className="btn-sm secondary" 
              onClick={() => downloadCSV('registrations')}
            >
              Download CSV
            </button>
          </div>
          
          <div className="report-stats">
            <div className="stat-item">
              <span className="stat-value">{reportData.summary?.totalRegistrations || 0}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{reportData.summary?.patientRegistrations || 0}</span>
              <span className="stat-label">Patients</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{reportData.summary?.doctorRegistrations || 0}</span>
              <span className="stat-label">Doctors</span>
            </div>
          </div>
          
          <div className="report-chart">
            {/* Chart visualization would go here */}
            <div className="placeholder-chart">Registration trend visualization</div>
          </div>
        </div>
        
        <div className="report-card">
          <div className="report-header">
            <h2>Appointments</h2>
            <button 
              className="btn-sm secondary" 
              onClick={() => downloadCSV('appointments')}
            >
              Download CSV
            </button>
          </div>
          
          <div className="report-stats">
            <div className="stat-item">
              <span className="stat-value">{reportData.summary?.totalAppointments || 0}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{reportData.summary?.completedAppointments || 0}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{reportData.summary?.canceledAppointments || 0}</span>
              <span className="stat-label">Canceled</span>
            </div>
          </div>
          
          <div className="report-chart">
            {/* Chart visualization would go here */}
            <div className="placeholder-chart">Appointment trend visualization</div>
          </div>
        </div>
        
        <div className="report-card">
          <div className="report-header">
            <h2>Doctor Verifications</h2>
            <button 
              className="btn-sm secondary" 
              onClick={() => downloadCSV('verifications')}
            >
              Download CSV
            </button>
          </div>
          
          <div className="report-stats">
            <div className="stat-item">
              <span className="stat-value">{reportData.summary?.totalVerifications || 0}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{reportData.summary?.approvedVerifications || 0}</span>
              <span className="stat-label">Approved</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{reportData.summary?.rejectedVerifications || 0}</span>
              <span className="stat-label">Rejected</span>
            </div>
          </div>
          
          <div className="report-chart">
            {/* Chart visualization would go here */}
            <div className="placeholder-chart">Verification trend visualization</div>
          </div>
        </div>
      </div>
    </div>
  );
}
