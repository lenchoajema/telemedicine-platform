import { useState, useEffect } from "react";
import apiClient from "../../api/apiClient";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import { useNotifications } from "../../contexts/NotificationContextCore";
import "./AdminPages.css";

export default function AdminAuditLogsPage() {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/admin/audit-logs", {
        params: { page, limit },
      });
      if (response.data.logs) {
        addNotification(
          `Loaded ${response.data.logs.length} audit logs`,
          "success"
        );
        setLogs(response.data.logs);
        setTotal(response.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const handleNext = () => {
    if (page * limit < total) setPage((p) => p + 1);
  };

  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <div className="admin-page">
        <p>{error}</p>
      </div>
    );

  return (
    <div className="admin-page audit-logs-page">
      <h1>Audit Logs</h1>
      <table className="users-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Role</th>
            <th>Action</th>
            <th>Resource</th>
            <th>Resource ID</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log._id}>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td>
                {log.userId
                  ? `${log.userId.profile?.firstName || ""} ${
                      log.userId.profile?.lastName || ""
                    }`
                  : "System"}
              </td>
              <td>{log.userRole}</td>
              <td>{log.action}</td>
              <td>{log.resourceType}</td>
              <td>{log.resourceId}</td>
              <td>
                <pre>{JSON.stringify(log.details)}</pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        <button onClick={handlePrev} disabled={page === 1}>
          Previous
        </button>
        <span>
          Page {page} of {Math.ceil(total / limit) || 1}
        </span>
        <button onClick={handleNext} disabled={page * limit >= total}>
          Next
        </button>
      </div>
    </div>
  );
}
