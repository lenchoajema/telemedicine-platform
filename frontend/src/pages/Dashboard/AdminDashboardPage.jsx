import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContextCore";
import DashboardCard from "../../components/dashboard/DashboardCard";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import "./DashboardPage.css";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [stats, setStats] = useState(null);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch admin-specific statistics
        const statsResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/admin/stats`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!statsResponse.ok)
          throw new Error("Failed to fetch admin statistics");
        const statsData = await statsResponse.json();

        // Fetch pending verifications (multi-entity)
        const verificationsResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/admin/verifications/pending`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!verificationsResponse.ok)
          throw new Error("Failed to fetch pending verifications");
        const verificationsData = await verificationsResponse.json();

        setStats(statsData);
        setPendingVerifications(verificationsData);
      } catch (err) {
        addNotification(
          `Failed to load admin dashboard data: ${err.message}`,
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAdminDashboardData();
  }, [addNotification]);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="dashboard-page admin-dashboard">
      <h1 className="dashboard-title">Admin Dashboard</h1>
      <p className="dashboard-subtitle">Welcome, {user.profile.firstName}</p>

      <div className="dashboard-stats">
        <DashboardCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon="users"
          variant="primary"
        />

        <DashboardCard
          title="Doctors"
          value={stats?.doctorCount || 0}
          icon="user-md"
          variant="info"
        />

        <DashboardCard
          title="Pending Verifications"
          value={pendingVerifications?.length || 0}
          icon="clipboard-check"
          variant="warning"
        />

        <DashboardCard
          title="Total Appointments"
          value={stats?.appointmentCount || 0}
          icon="calendar"
          variant="success"
        />
      </div>

      <section className="dashboard-section">
        <div className="section-header">
          <h2>Pending Verifications</h2>
          <Link to="/admin/verifications" className="btn primary">
            View All
          </Link>
        </div>

        {pendingVerifications.length === 0 ? (
          <div className="empty-state">No pending verifications</div>
        ) : (
          <div className="verification-list">
            {pendingVerifications.slice(0, 5).map((item) => {
              const type = item.entityType || "doctor";
              const displayName =
                type === "doctor"
                  ? item.user?.profile?.fullName ||
                    `${item.user?.profile?.firstName || ""} ${
                      item.user?.profile?.lastName || ""
                    }`.trim() ||
                    "Doctor"
                  : item.name || type;
              return (
                <div key={item._id} className="verification-item">
                  <div className="doctor-info">
                    <h3>{displayName}</h3>
                    <p style={{ textTransform: "capitalize" }}>{type}</p>
                    {type === "doctor" && (
                      <p>
                        Specialization:{" "}
                        {item.specialization ||
                          item.profile?.specialization ||
                          "Unknown"}
                      </p>
                    )}
                  </div>
                  <Link
                    to={`/admin/verifications/${item._id}`}
                    className="btn secondary"
                  >
                    Review
                  </Link>
                </div>
              );
            })}

            {pendingVerifications.length > 5 && (
              <div className="view-more">
                <Link to="/admin/verifications">
                  View all {pendingVerifications.length} pending verifications
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="section-header">
          <h2>Quick Actions</h2>
        </div>

        <div className="admin-quick-actions">
          <Link to="/admin/verifications" className="quick-action-card">
            <span className="icon">📋</span>
            <span className="title">Review Verifications</span>
          </Link>

          <Link to="/admin/users" className="quick-action-card">
            <span className="icon">👥</span>
            <span className="title">Manage Users</span>
          </Link>

          <Link to="/admin/reports" className="quick-action-card">
            <span className="icon">📊</span>
            <span className="title">System Reports</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
