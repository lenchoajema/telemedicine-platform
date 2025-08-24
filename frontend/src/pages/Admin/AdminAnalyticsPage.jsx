import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContextCore";
import apiClient from "../../api/apiClient";
import "./AdminPages.css";

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [analytics, setAnalytics] = useState({
    overview: {
      totalUsers: 0,
      totalDoctors: 0,
      totalPatients: 0,
      totalAppointments: 0,
      completedAppointments: 0,
      revenue: 0,
    },
    growth: {
      newUsers: 0,
      newAppointments: 0,
      userGrowthRate: 0,
      appointmentGrowthRate: 0,
    },
    usage: {
      averageAppointmentsPerDoctor: 0,
      averageAppointmentsPerPatient: 0,
      completionRate: 0,
      popularSpecialties: [],
    },
    performance: {
      dailyData: {},
      topDoctors: [],
      recentActivity: [],
    },
  });
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch real data from API endpoints
      const [
        usersResponse,
        doctorsResponse,
        appointmentsResponse,
        statsResponse,
        metricsResponse,
      ] = await Promise.all([
        apiClient.get("/admin/users"),
        apiClient.get("/doctors"),
        apiClient.get("/appointments"),
        apiClient.get("/admin/stats"),
        apiClient.get("/admin/metrics"),
      ]);

      // Extract data from responses
      const users = Array.isArray(usersResponse.data?.users)
        ? usersResponse.data.users
        : [];
      const doctors = Array.isArray(doctorsResponse.data)
        ? doctorsResponse.data
        : [];
      const appointments = Array.isArray(appointmentsResponse.data)
        ? appointmentsResponse.data
        : [];
      const stats = statsResponse.data || {};

      // Calculate analytics from real data
      const totalUsers = stats.totalUsers || users.length;
      const totalDoctors = stats.doctorCount || doctors.length;
      const totalPatients =
        stats.patientCount || users.filter((u) => u.role === "patient").length;
      const totalAppointments = stats.appointmentCount || appointments.length;
      const completedAppointments =
        stats.completedCount ||
        appointments.filter((a) => a.status === "completed").length;
      const scheduledAppointments =
        stats.scheduledCount ||
        appointments.filter((a) => a.status === "scheduled").length;
      const cancelledAppointments =
        stats.cancelledCount ||
        appointments.filter((a) => a.status === "cancelled").length;
      const revenue = completedAppointments * 50; // Assuming $50 per appointment

      // Calculate growth metrics for the time range
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      const recentUsers = users.filter((u) => new Date(u.createdAt) >= daysAgo);
      const recentAppointments = appointments.filter(
        (a) => new Date(a.createdAt) >= daysAgo
      );

      // Daily data for charts
      const dailyData = {};
      for (let i = parseInt(timeRange); i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split("T")[0];
        dailyData[dateKey] = {
          newUsers: 0,
          appointments: 0,
          revenue: 0,
        };
      }

      recentUsers.forEach((user) => {
        const dateKey = new Date(user.createdAt).toISOString().split("T")[0];
        if (dailyData[dateKey]) {
          dailyData[dateKey].newUsers++;
        }
      });

      recentAppointments.forEach((appointment) => {
        const dateKey = new Date(appointment.createdAt)
          .toISOString()
          .split("T")[0];
        if (dailyData[dateKey]) {
          dailyData[dateKey].appointments++;
          if (appointment.status === "completed") {
            dailyData[dateKey].revenue += 50;
          }
        }
      });

      setAnalytics({
        overview: {
          totalUsers,
          totalDoctors,
          totalPatients,
          totalAppointments,
          completedAppointments,
          revenue,
        },
        growth: {
          newUsers: recentUsers.length,
          newAppointments: recentAppointments.length,
          userGrowthRate:
            totalUsers > 0
              ? Math.round((recentUsers.length / totalUsers) * 100)
              : 0,
          appointmentGrowthRate:
            totalAppointments > 0
              ? Math.round(
                  (recentAppointments.length / totalAppointments) * 100
                )
              : 0,
        },
        usage: {
          averageAppointmentsPerDoctor:
            totalDoctors > 0 ? Math.round(totalAppointments / totalDoctors) : 0,
          averageAppointmentsPerPatient:
            totalPatients > 0
              ? Math.round(totalAppointments / totalPatients)
              : 0,
          completionRate:
            totalAppointments > 0
              ? Math.round((completedAppointments / totalAppointments) * 100)
              : 0,
          popularSpecialties: calculatePopularSpecialties(
            doctors,
            appointments
          ),
        },
        performance: {
          dailyData,
          topDoctors: getTopDoctors(doctors, appointments),
          recentActivity: getRecentActivity(users, appointments),
        },
      });
      setMetrics(metricsResponse?.data?.data || {});
    } catch (error) {
      console.error("Error fetching analytics:", error);
      addNotification("Failed to load analytics data", "error");
    } finally {
      setLoading(false);
    }
  };

  const calculatePopularSpecialties = (doctors, appointments) => {
    try {
      const specialtyCounts = {};

      // Ensure doctors and appointments are arrays
      const validDoctors = Array.isArray(doctors) ? doctors : [];
      const validAppointments = Array.isArray(appointments) ? appointments : [];

      // Count specialties from doctors
      validDoctors.forEach((doctor) => {
        const specialty =
          doctor.specialty || doctor.specialization || "General";
        specialtyCounts[specialty] = (specialtyCounts[specialty] || 0) + 1;
      });

      // Also count from appointments if they have doctor info
      validAppointments.forEach((appointment) => {
        const specialty =
          appointment.doctor?.specialty ||
          appointment.doctor?.specialization ||
          "General";
        if (specialty !== "General") {
          specialtyCounts[specialty] = (specialtyCounts[specialty] || 0) + 1;
        }
      });

      return Object.entries(specialtyCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([specialty, count]) => ({ specialty, count }));
    } catch (error) {
      console.error("Error calculating popular specialties:", error);
      return [];
    }
  };

  const getTopDoctors = (doctors, appointments) => {
    try {
      const validDoctors = Array.isArray(doctors) ? doctors : [];
      const validAppointments = Array.isArray(appointments) ? appointments : [];

      const doctorStats = {};

      // Initialize doctor stats
      validDoctors.forEach((doctor) => {
        doctorStats[doctor.id || doctor._id] = {
          doctor: doctor,
          appointmentCount: 0,
          completedCount: 0,
        };
      });

      // Count appointments
      validAppointments.forEach((appointment) => {
        const doctorId =
          appointment.doctorId ||
          appointment.doctor?.id ||
          appointment.doctor?._id;
        if (doctorId && doctorStats[doctorId]) {
          doctorStats[doctorId].appointmentCount++;
          if (appointment.status === "completed") {
            doctorStats[doctorId].completedCount++;
          }
        }
      });

      return Object.values(doctorStats)
        .sort((a, b) => b.appointmentCount - a.appointmentCount)
        .slice(0, 5);
    } catch (error) {
      console.error("Error getting top doctors:", error);
      return [];
    }
  };

  const getRecentActivity = (users, appointments) => {
    try {
      const activities = [];
      const validUsers = Array.isArray(users) ? users : [];
      const validAppointments = Array.isArray(appointments) ? appointments : [];

      // Recent user registrations
      validUsers.slice(-5).forEach((user) => {
        activities.push({
          type: "user_registered",
          message: `New ${user.role || "user"} registered: ${
            user.profile?.firstName || user.firstName || "Unknown"
          } ${user.profile?.lastName || user.lastName || "User"}`,
          timestamp: user.createdAt || new Date().toISOString(),
        });
      });

      // Recent appointments
      validAppointments.slice(-5).forEach((appointment) => {
        const firstName =
          appointment.doctor?.profile?.firstName ||
          appointment.doctor?.firstName;
        const lastName =
          appointment.doctor?.profile?.lastName || appointment.doctor?.lastName;
        const doctorName =
          firstName && lastName
            ? `Dr. ${firstName} ${lastName}`
            : "Unknown Doctor";
        activities.push({
          type: "appointment_created",
          message: `New appointment scheduled with ${doctorName}`,
          timestamp: appointment.createdAt || new Date().toISOString(),
        });
      });

      return activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
    } catch (error) {
      console.error("Error getting recent activity:", error);
      return [];
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Metrics Snapshot */}
      {metrics && (
        <div className="analytics-section">
          <h2>Platform Metrics Snapshot</h2>
          <div className="analytics-overview">
            {Object.entries(metrics)
              .slice(0, 12)
              .map(([key, value]) => (
                <div key={key} className="stat-card">
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <h3>{String(value)}</h3>
                    <p>{key}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      <div className="page-header">
        <h1>Platform Analytics</h1>
        <div className="time-filter">
          <label>Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="analytics-overview">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{analytics.overview.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👨‍⚕️</div>
          <div className="stat-content">
            <h3>{analytics.overview.totalDoctors}</h3>
            <p>Doctors</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🤒</div>
          <div className="stat-content">
            <h3>{analytics.overview.totalPatients}</h3>
            <p>Patients</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{analytics.overview.totalAppointments}</h3>
            <p>Appointments</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{analytics.overview.completedAppointments}</h3>
            <p>Completed</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>${analytics.overview.revenue}</h3>
            <p>Revenue</p>
          </div>
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="analytics-section">
        <h2>Growth Metrics</h2>
        <div className="growth-grid">
          <div className="growth-card">
            <h3>New Users</h3>
            <div className="growth-number">{analytics.growth.newUsers}</div>
            <div className="growth-rate">
              +{analytics.growth.userGrowthRate}% of total
            </div>
          </div>
          <div className="growth-card">
            <h3>New Appointments</h3>
            <div className="growth-number">
              {analytics.growth.newAppointments}
            </div>
            <div className="growth-rate">
              +{analytics.growth.appointmentGrowthRate}% of total
            </div>
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="analytics-section">
        <h2>Usage Statistics</h2>
        <div className="usage-grid">
          <div className="usage-card">
            <h3>Avg Appointments/Doctor</h3>
            <div className="usage-number">
              {analytics.usage.averageAppointmentsPerDoctor}
            </div>
          </div>
          <div className="usage-card">
            <h3>Avg Appointments/Patient</h3>
            <div className="usage-number">
              {analytics.usage.averageAppointmentsPerPatient}
            </div>
          </div>
          <div className="usage-card">
            <h3>Completion Rate</h3>
            <div className="usage-number">
              {analytics.usage.completionRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Popular Specialties */}
      <div className="analytics-section">
        <h2>Popular Specialties</h2>
        <div className="specialties-list">
          {(analytics.usage.popularSpecialties || []).map((item, index) => {
            const maxCount =
              analytics.usage.popularSpecialties?.[0]?.count || 1;
            return (
              <div key={index} className="specialty-item">
                <span className="specialty-name">{item.specialty}</span>
                <span className="specialty-count">
                  {item.count} appointments
                </span>
                <div className="specialty-bar">
                  <div
                    className="specialty-fill"
                    style={{
                      width: `${Math.min((item.count / maxCount) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
          {(!analytics.usage.popularSpecialties ||
            analytics.usage.popularSpecialties.length === 0) && (
            <div className="no-data">No specialty data available</div>
          )}
        </div>
      </div>

      {/* Top Performing Doctors */}
      <div className="analytics-section">
        <h2>Top Performing Doctors</h2>
        <div className="top-doctors">
          {(analytics.performance.topDoctors || []).map((item, index) => (
            <div key={index} className="doctor-stat">
              <div className="doctor-rank">#{index + 1}</div>
              <div className="doctor-info">
                <div className="doctor-name">
                  {item.doctor?.profile?.firstName ||
                    item.doctor?.firstName ||
                    "Dr."}{" "}
                  {item.doctor?.profile?.lastName ||
                    item.doctor?.lastName ||
                    "Unknown"}
                </div>
                <div className="doctor-specialty">
                  {item.doctor?.specialty ||
                    item.doctor?.specialization ||
                    "General"}
                </div>
              </div>
              <div className="doctor-metrics">
                <div className="metric">
                  <span className="metric-value">
                    {item.appointmentCount || 0}
                  </span>
                  <span className="metric-label">Appointments</span>
                </div>
                <div className="metric">
                  <span className="metric-value">
                    {item.completedCount || 0}
                  </span>
                  <span className="metric-label">Completed</span>
                </div>
              </div>
            </div>
          ))}
          {(!analytics.performance.topDoctors ||
            analytics.performance.topDoctors.length === 0) && (
            <div className="no-data">No doctor performance data available</div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="analytics-section">
        <h2>Recent Activity</h2>
        <div className="activity-feed">
          {(analytics.performance.recentActivity || []).map(
            (activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {activity.type === "user_registered" ? "👤" : "📅"}
                </div>
                <div className="activity-content">
                  <div className="activity-message">{activity.message}</div>
                  <div className="activity-time">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            )
          )}
          {(!analytics.performance.recentActivity ||
            analytics.performance.recentActivity.length === 0) && (
            <div className="no-data">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  );
}
