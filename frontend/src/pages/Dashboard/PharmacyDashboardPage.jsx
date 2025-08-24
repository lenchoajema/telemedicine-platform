import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import apiClient from "../../api/apiClient";

export default function PharmacyDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    inventoryTotal: 0,
    orders: { new: 0, accepted: 0, ready: 0, dispensed: 0, rejected: 0 },
    recentOrders: [],
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [inv, qNew, qAcc, qReady, qDisp, qRej] = await Promise.all([
          apiClient.get("/pharmacy/inventory?page=1&pageSize=1"),
          apiClient.get("/pharmacy/orders?status=New&page=1&pageSize=1"),
          apiClient.get("/pharmacy/orders?status=Accepted&page=1&pageSize=1"),
          apiClient.get(
            "/pharmacy/orders?status=ReadyForPickup&page=1&pageSize=10&sort=-createdAt"
          ),
          apiClient.get("/pharmacy/orders?status=Dispensed&page=1&pageSize=1"),
          apiClient.get("/pharmacy/orders?status=Rejected&page=1&pageSize=1"),
        ]);
        if (!mounted) return;
        setStats({
          inventoryTotal: inv.data?.total || 0,
          orders: {
            new: qNew.data?.total || 0,
            accepted: qAcc.data?.total || 0,
            ready: qReady.data?.total || 0,
            dispensed: qDisp.data?.total || 0,
            rejected: qRej.data?.total || 0,
          },
          recentOrders: Array.isArray(qReady.data?.data)
            ? qReady.data.data
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
        <p>Loading pharmacy dashboard…</p>
      </div>
    );
  if (error)
    return (
      <div className="admin-page">
        <div className="card" style={{ borderColor: "crimson" }}>
          <p style={{ color: "crimson" }}>{String(error)}</p>
          {String(error).toLowerCase().includes("no pharmacy profile") && (
            <div style={{ marginTop: 8 }}>
              <p>Please register your pharmacy profile first.</p>
              <Link className="btn" to="/pharmacy/portal">
                Open Pharmacy Portal
              </Link>
            </div>
          )}
        </div>
      </div>
    );

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Pharmacy Dashboard</h1>
        <div className="actions">
          <Link className="btn" to="/pharmacy/inventory">
            Manage Inventory
          </Link>
          <Link className="btn" to="/pharmacy/orders">
            View Orders
          </Link>
          <Link className="btn" to="/chat">
            Open Chat
          </Link>
          <Link className="btn" to="/pharmacy/profile/edit">
            Update Profile
          </Link>
        </div>
      </div>

      <div className="analytics-overview">
        <div className="stat-card">
          <div className="stat-icon">💊</div>
          <div className="stat-content">
            <h3>{stats.inventoryTotal}</h3>
            <p>Inventory Items</p>
          </div>
        </div>
        <Link className="stat-card" to="/pharmacy/orders?status=New">
          <div className="stat-icon">🆕</div>
          <div className="stat-content">
            <h3>{stats.orders.new}</h3>
            <p>New Orders</p>
          </div>
        </Link>
        <Link className="stat-card" to="/pharmacy/orders?status=Accepted">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.orders.accepted}</h3>
            <p>Accepted</p>
          </div>
        </Link>
        <Link className="stat-card" to="/pharmacy/orders?status=ReadyForPickup">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats.orders.ready}</h3>
            <p>Ready for Pickup</p>
          </div>
        </Link>
        <Link className="stat-card" to="/pharmacy/orders?status=Dispensed">
          <div className="stat-icon">🧾</div>
          <div className="stat-content">
            <h3>{stats.orders.dispensed}</h3>
            <p>Dispensed</p>
          </div>
        </Link>
        <Link className="stat-card" to="/pharmacy/orders?status=Rejected">
          <div className="stat-icon">⛔</div>
          <div className="stat-content">
            <h3>{stats.orders.rejected}</h3>
            <p>Rejected</p>
          </div>
        </Link>
      </div>

      <div className="analytics-section">
        <h2>Recently Ready Orders</h2>
        <div className="top-doctors">
          {stats.recentOrders.length === 0 && (
            <div className="no-data">No orders yet</div>
          )}
          {stats.recentOrders.map((o) => (
            <div key={o._id} className="doctor-stat">
              <div className="doctor-info">
                <div className="doctor-name">
                  Order #{String(o._id).slice(-6)}
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
          <li>Use Inventory to keep stock and pricing up to date.</li>
          <li>Accept new orders to open a chat thread with the patient.</li>
          <li>
            Dispense will record a stock movement and notify stakeholders.
          </li>
        </ul>
      </div>
    </div>
  );
}
