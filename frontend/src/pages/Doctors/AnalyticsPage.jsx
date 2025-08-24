import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContextCore";
import apiClient from "../../api/apiClient";
import "./DoctorPages.css";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [analytics, setAnalytics] = useState({
    overview: {},
    appointments: {},
    patients: {},
    revenue: {},
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30"); // days

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const [statsResponse, appointmentsResponse] = await Promise.all([
        apiClient.get("/doctors/stats"),
        apiClient.get("/appointments"),
      ]);

      // CORRECTED: Safely parse the stats data
      let stats = {};
      if (statsResponse.data && statsResponse.data.data) {
        stats = statsResponse.data.data;
      } else if (statsResponse.data) {
        stats = statsResponse.data;
      }

      // CORRECTED: Safely parse the appointments array
      let appointments = [];
      if (
        appointmentsResponse.data &&
        appointmentsResponse.data.data &&
        Array.isArray(appointmentsResponse.data.data.appointments)
      ) {
        appointments = appointmentsResponse.data.data.appointments;
      } else if (
        appointmentsResponse.data &&
        Array.isArray(appointmentsResponse.data.data)
      ) {
        appointments = appointmentsResponse.data.data;
      } else if (Array.isArray(appointmentsResponse.data)) {
        appointments = appointmentsResponse.data;
      }

      // All the calculation logic below should now work correctly
      const now = new Date();
      const daysAgo = new Date(
        now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000
      );

      const filteredAppointments = appointments.filter(
        (apt) => new Date(apt.date || apt.startTime) >= daysAgo
      );

      const completedAppointments = filteredAppointments.filter(
        (apt) => apt.status === "completed"
      );

      const cancelledAppointments = filteredAppointments.filter(
        (apt) => apt.status === "cancelled"
      );

      const dailyCounts = {};
      for (let i = parseInt(timeRange); i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split("T")[0];
        dailyCounts[dateKey] = 0;
      }

      completedAppointments.forEach((apt) => {
        const dateKey = new Date(apt.date || apt.startTime)
          .toISOString()
          .split("T")[0];
        if (dailyCounts.hasOwnProperty(dateKey)) {
          dailyCounts[dateKey]++;
        }
      });

      const uniquePatients = new Set(
        completedAppointments.map((apt) => apt.patient?._id || apt.patientId)
      ).size;

      const ratingsSum = completedAppointments.reduce(
        (sum, apt) => sum + (apt.rating || 0),
        0
      );
      const avgRating =
        completedAppointments.length > 0
          ? (ratingsSum / completedAppointments.length).toFixed(1)
          : 0;

      setAnalytics({
        overview: {
          totalAppointments: filteredAppointments.length,
          completedAppointments: completedAppointments.length,
          cancelledAppointments: cancelledAppointments.length,
          uniquePatients,
          averageRating: avgRating,
          completionRate:
            filteredAppointments.length > 0
              ? Math.round(
                  (completedAppointments.length / filteredAppointments.length) *
                    100
                )
              : 0,
        },
        appointments: {
          daily: dailyCounts,
          byStatus: {
            completed: completedAppointments.length,
            cancelled: cancelledAppointments.length,
            scheduled: filteredAppointments.filter(
              (apt) => apt.status === "scheduled"
            ).length,
          },
        },
        patients: {
          new: uniquePatients,
          returning: Math.max(0, completedAppointments.length - uniquePatients),
        },
        revenue: {
          total: completedAppointments.length * 50, // Assuming $50 per appointment
          average: 50,
          projected:
            completedAppointments.length * 50 +
            filteredAppointments.filter((apt) => apt.status === "scheduled")
              .length *
              50,
        },
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      addNotification("Failed to load analytics data", "error");
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    const dates = Object.keys(analytics.appointments.daily || {}).sort();
    const values = dates.map((date) => analytics.appointments.daily[date]);
    return { dates, values };
  };

  if (loading) {
    return (
      <div className="doctor-page">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  const chartData = getChartData();

  // Ensure analytics.overview and other properties are not undefined before rendering
  if (!analytics.overview || !analytics.appointments.byStatus) {
    return (
      <div className="doctor-page">
        <p>Analytics data is being processed...</p>
      </div>
    );
  }

  return (
    <div className="doctor-page">
      <div className="page-header">
        <h1>Analytics Dashboard</h1>
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

      <div className="analytics-overview">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{analytics.overview.totalAppointments}</h3>
            <p>Total Appointments</p>
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
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{analytics.overview.uniquePatients}</h3>
            <p>Unique Patients</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{analytics.overview.averageRating}</h3>
            <p>Average Rating</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💹</div>
          <div className="stat-content">
            <h3>{analytics.overview.completionRate}%</h3>
            <p>Completion Rate</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>${analytics.revenue.total}</h3>
            <p>Revenue</p>
          </div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-section">
          <h2>Appointments Over Time</h2>
          <div className="simple-chart">
            <div className="chart-container">
              {chartData.dates.map((date, index) => (
                <div key={date} className="chart-bar">
                  <div
                    className="bar"
                    style={{
                      height: `${Math.max(chartData.values[index] * 20, 5)}px`,
                      backgroundColor:
                        chartData.values[index] > 0 ? "#2563eb" : "#e5e7eb",
                    }}
                    title={`${date}: ${chartData.values[index]} appointments`}
                  ></div>
                  <div className="bar-label">{new Date(date).getDate()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-section">
          <h2>Appointment Status Distribution</h2>
          <div className="status-distribution">
            <div className="status-item">
              <div
                className="status-bar completed"
                style={{
                  width: `${
                    (analytics.appointments.byStatus.completed /
                      (analytics.overview.totalAppointments || 1)) *
                    100
                  }%`,
                }}
              ></div>
              <span>
                Completed ({analytics.appointments.byStatus.completed})
              </span>
            </div>
            <div className="status-item">
              <div
                className="status-bar scheduled"
                style={{
                  width: `${
                    (analytics.appointments.byStatus.scheduled /
                      (analytics.overview.totalAppointments || 1)) *
                    100
                  }%`,
                }}
              ></div>
              <span>
                Scheduled ({analytics.appointments.byStatus.scheduled})
              </span>
            </div>
            <div className="status-item">
              <div
                className="status-bar cancelled"
                style={{
                  width: `${
                    (analytics.appointments.byStatus.cancelled /
                      (analytics.overview.totalAppointments || 1)) *
                    100
                  }%`,
                }}
              ></div>
              <span>
                Cancelled ({analytics.appointments.byStatus.cancelled})
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-details">
        <div className="detail-section">
          <h2>Patient Analytics</h2>
          <div className="detail-stats">
            <div className="detail-item">
              <span className="label">New Patients:</span>
              <span className="value">{analytics.patients.new}</span>
            </div>
            <div className="detail-item">
              <span className="label">Returning Patients:</span>
              <span className="value">{analytics.patients.returning}</span>
            </div>
            <div className="detail-item">
              <span className="label">Patient Retention:</span>
              <span className="value">
                {analytics.patients.new > 0
                  ? Math.round(
                      (analytics.patients.returning / analytics.patients.new) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2>Revenue Analytics</h2>
          <div className="detail-stats">
            <div className="detail-item">
              <span className="label">Total Revenue:</span>
              <span className="value">${analytics.revenue.total}</span>
            </div>
            <div className="detail-item">
              <span className="label">Average per Appointment:</span>
              <span className="value">${analytics.revenue.average}</span>
            </div>
            <div className="detail-item">
              <span className="label">Projected Revenue:</span>
              <span className="value">${analytics.revenue.projected}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-insights">
        <h2>Key Insights</h2>
        <div className="insights-list">
          {analytics.overview.completionRate > 90 && (
            <div className="insight-item positive">
              <span className="insight-icon">🎉</span>
              <p>
                Excellent completion rate! You're maintaining high patient
                satisfaction.
              </p>
            </div>
          )}
          {analytics.overview.averageRating >= 4.5 && (
            <div className="insight-item positive">
              <span className="insight-icon">⭐</span>
              <p>Outstanding rating! Patients highly appreciate your care.</p>
            </div>
          )}
          {analytics.patients.returning > analytics.patients.new && (
            <div className="insight-item positive">
              <span className="insight-icon">🔄</span>
              <p>
                High patient retention rate indicates strong trust and
                satisfaction.
              </p>
            </div>
          )}
          {analytics.overview.cancelledAppointments >
            analytics.overview.completedAppointments * 0.2 && (
            <div className="insight-item warning">
              <span className="insight-icon">⚠️</span>
              <p>
                Consider reviewing cancellation patterns to improve appointment
                scheduling.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
