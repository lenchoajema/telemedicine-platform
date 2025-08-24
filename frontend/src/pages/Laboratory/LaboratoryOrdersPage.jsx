import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import apiClient from "../../api/apiClient";

const statuses = [
  "ordered",
  "in-progress",
  "completed",
  "rejected",
  "canceled",
];

export default function LaboratoryOrdersPage() {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const status = params.get("status") || "";

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const url = `/laboratory/orders?${
          status ? `status=${encodeURIComponent(status)}&` : ""
        }page=1&pageSize=50&sort=-createdAt`;
        const res = await apiClient.get(url);
        if (!mounted) return;
        setRows(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [status]);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Laboratory Orders</h1>
        <div className="actions">
          <select
            value={status}
            onChange={(e) => {
              const v = e.target.value;
              if (v) params.set("status", v);
              else params.delete("status");
              setParams(params, { replace: true });
            }}
          >
            <option value="">All</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      {loading && <p>Loading…</p>}
      {error && (
        <div className="card" style={{ borderColor: "crimson" }}>
          <p style={{ color: "crimson" }}>{String(error)}</p>
          {String(error).toLowerCase().includes("no laboratory profile") && (
            <div style={{ marginTop: 8 }}>
              <p>Please register your laboratory profile first.</p>
              <Link className="btn" to="/laboratory/portal">
                Go to Laboratory Portal
              </Link>
            </div>
          )}
        </div>
      )}
      <table className="table">
        <thead>
          <tr>
            <th>Exam</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r._id}>
              <td>{String(r._id).slice(-8)}</td>
              <td>{r.status}</td>
              <td>
                {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
