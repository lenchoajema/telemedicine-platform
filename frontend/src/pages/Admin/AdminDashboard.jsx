import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Activity, 
  Settings, 
  Database, 
  Server, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Cpu,
  Wifi,
  Mail,
  Bell,
  Download,
  Upload,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import apiClient from '../../api/apiClient';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchSystemHealth();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSystemHealth();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.log('Error fetching dashboard data:', error);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await apiClient.get('/admin/system/health');
      if (response.data.success) {
        setSystemHealth(response.data.data);
      }
    } catch (error) {
      console.log('Error fetching system health:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboardData(), fetchSystemHealth()]);
    setRefreshing(false);
  };

  const handleSystemAction = async (action) => {
    try {
      const response = await apiClient.post(`/admin/system/${action}`);
      if (response.data.success) {
        alert(`${action} completed successfully`);
        if (action === 'backup') {
          // Handle backup download
          const blob = new Blob([response.data.data], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
        await fetchSystemHealth();
      }
    } catch (error) {
      console.log(`Error performing ${action}:`, error);
      alert(`Failed to ${action}: ${error.response?.data?.message || error.message}`);
    }
  };

  const getHealthStatus = (status) => {
    switch (status) {
      case 'healthy':
        return { icon: CheckCircle, color: '#10b981', text: 'Healthy' };
      case 'warning':
        return { icon: AlertTriangle, color: '#f59e0b', text: 'Warning' };
      case 'critical':
        return { icon: AlertTriangle, color: '#ef4444', text: 'Critical' };
      default:
        return { icon: Clock, color: '#6b7280', text: 'Unknown' };
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1><BarChart3 size={24} /> Admin Dashboard</h1>
          <p>System overview and management tools</p>
        </div>
        <button 
          className="refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* Key Metrics */}
      {dashboardData && (
        <div className="metrics-grid">
          <div className="metric-card users">
            <div className="metric-icon">
              <Users size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-value">{dashboardData.totalUsers}</div>
              <div className="metric-label">Total Users</div>
              <div className="metric-change positive">
                <TrendingUp size={14} />
                +{dashboardData.newUsersToday} today
              </div>
            </div>
          </div>

          <div className="metric-card appointments">
            <div className="metric-icon">
              <Activity size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-value">{dashboardData.totalAppointments}</div>
              <div className="metric-label">Total Appointments</div>
              <div className="metric-change positive">
                <TrendingUp size={14} />
                +{dashboardData.appointmentsToday} today
              </div>
            </div>
          </div>

          <div className="metric-card revenue">
            <div className="metric-icon">
              <BarChart3 size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-value">${dashboardData.totalRevenue}</div>
              <div className="metric-label">Total Revenue</div>
              <div className="metric-change positive">
                <TrendingUp size={14} />
                +${dashboardData.revenueToday} today
              </div>
            </div>
          </div>

          <div className="metric-card active-sessions">
            <div className="metric-icon">
              <Wifi size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-value">{dashboardData.activeSessions}</div>
              <div className="metric-label">Active Sessions</div>
              <div className="metric-change neutral">
                <Clock size={14} />
                Real-time
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Health */}
      {systemHealth && (
        <div className="system-health-section">
          <h2><Server size={20} /> System Health</h2>
          <div className="health-grid">
            <div className="health-card">
              <div className="health-header">
                <div className="health-title">
                  <Database size={18} />
                  Database
                </div>
                <div className="health-status">
                  {(() => {
                    const { icon: Icon, color, text } = getHealthStatus(systemHealth.database.status);
                    return (
                      <>
                        <Icon size={16} style={{ color }} />
                        <span style={{ color }}>{text}</span>
                      </>
                    );
                  })()}
                </div>
              </div>
              <div className="health-details">
                <div className="detail-item">
                  <span>Connections:</span>
                  <span>{systemHealth.database.connections}</span>
                </div>
                <div className="detail-item">
                  <span>Response Time:</span>
                  <span>{systemHealth.database.responseTime}ms</span>
                </div>
              </div>
            </div>

            <div className="health-card">
              <div className="health-header">
                <div className="health-title">
                  <Cpu size={18} />
                  CPU Usage
                </div>
                <div className="health-status">
                  <span>{systemHealth.cpu.usage}%</span>
                </div>
              </div>
              <div className="health-progress">
                <div 
                  className="progress-bar"
                  style={{ 
                    width: `${systemHealth.cpu.usage}%`,
                    backgroundColor: systemHealth.cpu.usage > 80 ? '#ef4444' : 
                                   systemHealth.cpu.usage > 60 ? '#f59e0b' : '#10b981'
                  }}
                ></div>
              </div>
            </div>

            <div className="health-card">
              <div className="health-header">
                <div className="health-title">
                  <HardDrive size={18} />
                  Memory Usage
                </div>
                <div className="health-status">
                  <span>{systemHealth.memory.percentage}%</span>
                </div>
              </div>
              <div className="health-details">
                <div className="detail-item">
                  <span>Used:</span>
                  <span>{formatBytes(systemHealth.memory.used)}</span>
                </div>
                <div className="detail-item">
                  <span>Total:</span>
                  <span>{formatBytes(systemHealth.memory.total)}</span>
                </div>
              </div>
            </div>

            <div className="health-card">
              <div className="health-header">
                <div className="health-title">
                  <Clock size={18} />
                  Uptime
                </div>
                <div className="health-status">
                  <CheckCircle size={16} style={{ color: '#10b981' }} />
                  <span>Online</span>
                </div>
              </div>
              <div className="health-details">
                <div className="detail-item">
                  <span>Duration:</span>
                  <span>{formatUptime(systemHealth.uptime)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2><Settings size={20} /> Quick Actions</h2>
        <div className="actions-grid">
          <button 
            className="action-card backup"
            onClick={() => handleSystemAction('backup')}
          >
            <Download size={24} />
            <div className="action-content">
              <h3>Create Backup</h3>
              <p>Download system backup</p>
            </div>
          </button>

          <button 
            className="action-card maintenance"
            onClick={() => handleSystemAction('maintenance')}
          >
            <Settings size={24} />
            <div className="action-content">
              <h3>Maintenance Mode</h3>
              <p>Enable maintenance mode</p>
            </div>
          </button>

          <button 
            className="action-card cleanup"
            onClick={() => handleSystemAction('cleanup')}
          >
            <RefreshCw size={24} />
            <div className="action-content">
              <h3>System Cleanup</h3>
              <p>Clear cache and logs</p>
            </div>
          </button>

          <button 
            className="action-card security"
            onClick={() => handleSystemAction('security-scan')}
          >
            <Shield size={24} />
            <div className="action-content">
              <h3>Security Scan</h3>
              <p>Run security check</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      {dashboardData && dashboardData.recentActivity && (
        <div className="recent-activity-section">
          <h2><Activity size={20} /> Recent Activity</h2>
          <div className="activity-list">
            {dashboardData.recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'user' && <Users size={16} />}
                  {activity.type === 'appointment' && <Activity size={16} />}
                  {activity.type === 'system' && <Server size={16} />}
                  {activity.type === 'security' && <Shield size={16} />}
                </div>
                <div className="activity-content">
                  <div className="activity-description">{activity.description}</div>
                  <div className="activity-time">{new Date(activity.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Information */}
      {systemHealth && (
        <div className="system-info-section">
          <h2><Server size={20} /> System Information</h2>
          <div className="info-grid">
            <div className="info-card">
              <h3>Server Details</h3>
              <div className="info-list">
                <div className="info-item">
                  <span>Version:</span>
                  <span>{systemHealth.version}</span>
                </div>
                <div className="info-item">
                  <span>Environment:</span>
                  <span>{systemHealth.environment}</span>
                </div>
                <div className="info-item">
                  <span>Node Version:</span>
                  <span>{systemHealth.nodeVersion}</span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>Database Information</h3>
              <div className="info-list">
                <div className="info-item">
                  <span>Type:</span>
                  <span>MongoDB</span>
                </div>
                <div className="info-item">
                  <span>Collections:</span>
                  <span>{systemHealth.database.collections}</span>
                </div>
                <div className="info-item">
                  <span>Size:</span>
                  <span>{formatBytes(systemHealth.database.size)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
