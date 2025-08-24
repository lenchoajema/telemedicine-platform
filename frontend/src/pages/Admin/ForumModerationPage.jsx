import { useState, useEffect } from "react";
import { useNotifications } from "../../contexts/NotificationContextCore";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ForumService from "../../api/ForumService";
import "./AdminPages.css";

export default function ForumModerationPage() {
  const { addNotification } = useNotifications();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const data = await ForumService.getReports();
        setReports(data);
        addNotification("Reports loaded", "success");
      } catch (err) {
        addNotification("Error loading reports", "error");
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, [addNotification]);

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await ForumService.updateReportStatus(reportId, newStatus);
      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? { ...r, status: newStatus } : r))
      );
      addNotification("Report status updated", "success");
    } catch (err) {
      addNotification("Error updating report status", "error");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-page moderation-page">
      <h1>Forum Moderation</h1>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Post</th>
            <th>Author</th>
            <th>Reason</th>
            <th>Reporter</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report._id}>
              <td>{report.postId.content.slice(0, 50)}...</td>
              <td>
                {report.postId.authorId.profile.firstName}{" "}
                {report.postId.authorId.profile.lastName}
              </td>
              <td>{report.reason}</td>
              <td>
                {report.reporterId.profile.firstName}{" "}
                {report.reporterId.profile.lastName}
              </td>
              <td>
                <select
                  value={report.status}
                  onChange={(e) =>
                    handleStatusChange(report._id, e.target.value)
                  }
                >
                  <option value="Pending">Pending</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="ActionTaken">ActionTaken</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
