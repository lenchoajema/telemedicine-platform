import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReminders } from "../../contexts/RemindersContext";
import { BellIcon, ClockIcon } from "@heroicons/react/24/outline";
import "./RemindersDropdown.css";

export default function RemindersDropdown() {
  const { reminders, loading, markAsRead } = useReminders();
  // Debug: log reminders state
  React.useEffect(() => {
    console.log("RemindersDropdown state:", { reminders, loading });
  }, [reminders, loading]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleToggle = () => setOpen((prev) => !prev);

  const handleClick = (id, apptId) => {
    markAsRead(id);
    setOpen(false);
    if (apptId) navigate(`/appointments/${apptId}`);
  };

  // Sort a cloned array to prevent mutating state
  const sorted = [...reminders].sort(
    (a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)
  );

  return (
    <div className="reminders-dropdown">
      <button className="reminders-btn" onClick={handleToggle}>
        <BellIcon className="reminders-icon" />
        {reminders.some((r) => !r.read) && <span className="badge" />}
      </button>
      {open && (
        <div className="reminders-menu">
          <h4>Upcoming Reminders</h4>
          {loading && <p>Loading...</p>}
          {!loading && sorted.length === 0 && <p>No reminders.</p>}
          {!loading &&
            sorted.map((r) => (
              <div
                key={r._id}
                className={`reminder-item ${r.read ? "read" : "unread"}`}
                onClick={() => handleClick(r._id, r.appointmentId?._id)}
              >
                <ClockIcon className="reminder-icon" />
                <div className="reminder-info">
                  <div className="reminder-text">
                    Appointment {r.appointmentId?.status} on{" "}
                    {new Date(r.appointmentId?.date).toLocaleDateString()} at{" "}
                    {new Date(r.scheduledAt).toLocaleTimeString()}
                  </div>
                  <div className="reminder-time">
                    {new Date(r.scheduledAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
