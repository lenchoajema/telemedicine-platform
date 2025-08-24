import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContextCore";
import apiClient from "../../api/apiClient";
import "./AdminPages.css";

export default function AdminAppointmentsPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { t, i18n } = useTranslation(["common", "admin"]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    // Fetch appointments after language (translations now auto-loaded via changeAppLanguage)
    fetchAppointments();
  }, [i18n.language]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/appointments");

      // Handle both direct array and {success: true, data: array} formats
      let appointmentsData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          appointmentsData = response.data;
        } else if (response.data.success && Array.isArray(response.data.data)) {
          appointmentsData = response.data.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          appointmentsData = response.data.data;
        }
      }

      console.log("Fetched appointments:", appointmentsData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      addNotification("Failed to load appointments", "error");
      setAppointments([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await apiClient.put(`/appointments/${appointmentId}`, { status });
      addNotification(`Appointment ${status} successfully`, "success");
      fetchAppointments(); // Refresh the list
    } catch (error) {
      addNotification("Failed to update appointment status", "error");
    }
  };

  const filteredAppointments = Array.isArray(appointments)
    ? appointments.filter((appointment) => {
        const matchesSearch =
          !searchTerm ||
          appointment.patient?.profile?.firstName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          appointment.patient?.profile?.lastName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          appointment.doctor?.user?.profile?.firstName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          appointment.doctor?.user?.profile?.lastName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesStatus = filter === "all" || appointment.status === filter;

        const matchesDate =
          !dateFilter ||
          new Date(appointment.date).toDateString() ===
            new Date(dateFilter).toDateString();

        return matchesSearch && matchesStatus && matchesDate;
      })
    : [];

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "#2563eb";
      case "completed":
        return "#10b981";
      case "cancelled":
        return "#dc2626";
      case "no-show":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-spinner"></div>
        <p>Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div
        className="page-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <h1>{t("appointments.title", "Appointment Management")}</h1>
        <p>
          {t("appointments.subtitle", "Monitor and manage all appointments")}
        </p>
        <LanguageSwitcher />
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder={t(
              "filters.searchPlaceholder",
              "Search by patient or doctor name..."
            )}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">
              {t("filters.allAppointments", "All Appointments")}
            </option>
            <option value="scheduled">
              {t("filters.scheduled", "Scheduled")}
            </option>
            <option value="completed">
              {t("filters.completed", "Completed")}
            </option>
            <option value="cancelled">
              {t("filters.cancelled", "Cancelled")}
            </option>
            <option value="no-show">{t("filters.noShow", "No Show")}</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            placeholder="Filter by date"
          />
        </div>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <h3>{appointments.filter((a) => a.status === "scheduled").length}</h3>
          <p>{t("stats.scheduled", "Scheduled")}</p>
        </div>
        <div className="stat-card">
          <h3>{appointments.filter((a) => a.status === "completed").length}</h3>
          <p>{t("stats.completed", "Completed")}</p>
        </div>
        <div className="stat-card">
          <h3>{appointments.filter((a) => a.status === "cancelled").length}</h3>
          <p>{t("stats.cancelled", "Cancelled")}</p>
        </div>
        <div className="stat-card">
          <h3>{appointments.length}</h3>
          <p>{t("stats.total", "Total")}</p>
        </div>
      </div>

      <div className="appointments-table">
        <table>
          <thead>
            <tr>
              <th>{t("table.patient", "Patient")}</th>
              <th>{t("table.doctor", "Doctor")}</th>
              <th>{t("table.dateTime", "Date & Time")}</th>
              <th>{t("table.type", "Type")}</th>
              <th>{t("table.status", "Status")}</th>
              <th>{t("table.reason", "Reason")}</th>
              <th>{t("table.actions", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.map((appointment) => (
              <tr key={appointment._id}>
                <td>
                  <div className="patient-info">
                    <div className="patient-name">
                      {appointment.patient?.profile?.firstName}{" "}
                      {appointment.patient?.profile?.lastName}
                    </div>
                    <div className="patient-email">
                      {appointment.patient?.email}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="doctor-info">
                    <div className="doctor-name">
                      {appointment.doctor?.user?.profile?.firstName}{" "}
                      {appointment.doctor?.user?.profile?.lastName}
                    </div>
                    <div className="doctor-specialty">
                      {appointment.doctor?.specialization}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="datetime-info">
                    <div className="date">
                      {formatDateTime(appointment.date)}
                    </div>
                    <div className="duration">
                      {appointment.duration || 30} min
                    </div>
                  </div>
                </td>
                <td>{appointment.type || "Consultation"}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: getStatusColor(appointment.status),
                    }}
                  >
                    {appointment.status}
                  </span>
                </td>
                <td>
                  <div className="reason" title={appointment.reason}>
                    {appointment.reason
                      ? appointment.reason.length > 30
                        ? appointment.reason.substring(0, 30) + "..."
                        : appointment.reason
                      : "No reason provided"}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    {appointment.status === "scheduled" && (
                      <>
                        <button
                          className="btn btn-success"
                          onClick={() =>
                            updateAppointmentStatus(
                              appointment._id,
                              "completed"
                            )
                          }
                        >
                          {t("actions.complete", "Complete")}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() =>
                            updateAppointmentStatus(
                              appointment._id,
                              "cancelled"
                            )
                          }
                        >
                          {t("actions.cancel", "Cancel")}
                        </button>
                      </>
                    )}
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        console.log(
                          "View appointment details:",
                          appointment._id
                        );
                      }}
                    >
                      {t("table.details", "Details")}
                    </button>
                    {/* Link to lifecycle audit page */}
                    <Link
                      to={`/admin/appointments/${appointment._id}/lifecycle`}
                      className="btn btn-info"
                    >
                      {t("table.lifecycle", "Lifecycle")}
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAppointments.length === 0 && (
          <div className="empty-state">
            <p>
              {t(
                "empty.noAppointments",
                "No appointments found matching your criteria."
              )}
            </p>
          </div>
        )}
      </div>

      <div className="appointment-insights">
        <h2>{t("insights.title", "Appointment Insights")}</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <h3>{t("insights.mostPopularTime", "Most Popular Time")}</h3>
            <p>2:00 PM - 4:00 PM</p>
          </div>
          <div className="insight-card">
            <h3>{t("insights.averageDuration", "Average Duration")}</h3>
            <p>32 minutes</p>
          </div>
          <div className="insight-card">
            <h3>{t("insights.completionRate", "Completion Rate")}</h3>
            <p>
              {appointments.length > 0
                ? Math.round(
                    (appointments.filter((a) => a.status === "completed")
                      .length /
                      appointments.length) *
                      100
                  )
                : 0}
              %
            </p>
          </div>
          <div className="insight-card">
            <h3>{t("insights.noShowRate", "No-Show Rate")}</h3>
            <p>
              {appointments.length > 0
                ? Math.round(
                    (appointments.filter((a) => a.status === "no-show").length /
                      appointments.length) *
                      100
                  )
                : 0}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
