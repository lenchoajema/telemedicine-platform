import { useEffect, useState } from "react";
import apiClient from "../../api/apiClient";

export default function AdminMetricsPage() {
  const [snapshot, setSnapshot] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await apiClient.get("/admin/metrics");
        if (!mounted) return;
        setSnapshot(res.data || res);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 10000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Admin Metrics</h1>
      </div>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "crimson" }}>{String(error)}</p>}
      <div className="analytics-overview">
        {Object.entries(snapshot?.counters || {}).map(([k, v]) => (
          <div className="stat-card" key={k}>
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>{v}</h3>
              <p>{k}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
