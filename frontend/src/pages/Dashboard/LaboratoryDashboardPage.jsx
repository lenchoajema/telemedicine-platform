import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import apiClient from "../../api/apiClient";

export default function LaboratoryDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    catalogTotal: 0,
    orders: { pending: 0, inProgress: 0, completed: 0, rejected: 0 },
    recentOrders: [],
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [catalog, qPending, qInProg, qComplete, qRejected] =
          await Promise.all([
            apiClient.get("/laboratory/catalog?page=1&pageSize=1"),
            apiClient.get(
              "/laboratory/orders?status=ordered&page=1&pageSize=1"
            ),
            apiClient.get(
              "/laboratory/orders?status=in-progress&page=1&pageSize=1"
            ),
            apiClient.get(
              "/laboratory/orders?status=completed&page=1&pageSize=10&sort=-createdAt"
            ),
            apiClient.get(
              "/laboratory/orders?status=rejected&page=1&pageSize=1"
            ),
          ]);
        if (!mounted) return;
        setStats({
          catalogTotal: catalog.data?.total || 0,
          orders: {
            pending: qPending.data?.total || 0,
            inProgress: qInProg.data?.total || 0,
            completed: qComplete.data?.total || 0,
            rejected: qRejected.data?.total || 0,
          },
          recentOrders: Array.isArray(qComplete.data?.data)
            ? qComplete.data.data
            : [],
        });
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message || "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return (
      <div className="admin-page">
        <div className="loading-spinner" />
        <p>Loading laboratory dashboard…</p>
      </div>
    );
  if (error)
    return (
      <div className="admin-page">
        <p style={{ color: "crimson" }}>{String(error)}</p>
      </div>
    );

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Laboratory Dashboard</h1>
        <div className="actions">
          <Link className="btn" to="/laboratory/catalog">
            Manage Catalog
          </Link>
          <Link className="btn" to="/laboratory/orders">
            View Orders
          </Link>
          <Link className="btn" to="/chat">
            Open Chat
          </Link>
        </div>
      </div>

      <div className="analytics-overview">
        <div className="stat-card">
          <div className="stat-icon">🧪</div>
          <div className="stat-content">
            <h3>{stats.catalogTotal}</h3>
            <p>Catalog Items</p>
          </div>
        </div>
        <Link className="stat-card" to="/laboratory/orders?status=ordered">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{stats.orders.pending}</h3>
            <p>Pending Orders</p>
          </div>
        </Link>
        <Link className="stat-card" to="/laboratory/orders?status=in-progress">
          <div className="stat-icon">⚙️</div>
          <div className="stat-content">
            <h3>{stats.orders.inProgress}</h3>
            <p>In Progress</p>
          </div>
        </Link>
        <Link className="stat-card" to="/laboratory/orders?status=completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.orders.completed}</h3>
            <p>Completed</p>
          </div>
        </Link>
        <Link className="stat-card" to="/laboratory/orders?status=rejected">
          <div className="stat-icon">⛔</div>
          <div className="stat-content">
            <h3>{stats.orders.rejected}</h3>
            <p>Rejected</p>
          </div>
        </Link>
      </div>

      <div className="analytics-section">
        <h2>Recently Completed Orders</h2>
        <div className="top-doctors">
          {stats.recentOrders.length === 0 && (
            <div className="no-data">No orders yet</div>
          )}
          {stats.recentOrders.map((o) => (
            <div key={o._id} className="doctor-stat">
              <div className="doctor-info">
                <div className="doctor-name">
                  Lab #{String(o._id).slice(-6)}
                </div>
                <div className="doctor-specialty">Status: {o.status}</div>
              </div>
              <div className="metric">
                <span className="metric-value">
                  {new Date(o.createdAt).toLocaleString()}
                </span>
                <span className="metric-label">Created</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics-section">
        <h2>Quick Tips</h2>
        <ul>
          <li>Keep your catalog pricing accurate for discovery results.</li>
          <li>Accept orders to notify providers and patients automatically.</li>
          <li>Upload results and then mark orders complete for delivery.</li>
        </ul>
      </div>
    </div>
  );
}
