import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import apiClient from "../../services/apiClient";
import "./ReminderSettingsPage.css";

export default function ReminderSettingsPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [channels, setChannels] = useState({
    Push: false,
    SMS: false,
    Email: false,
    Dashboard: false,
  });
  const [reminderTimes, setReminderTimes] = useState([""]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const res = await apiClient.get("/appointments");
        if (res.data?.data) setAppointments(res.data.data);
      } catch (err) {
        console.log("Error fetching appointments", err);
        addNotification("Failed to load appointments", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, []);

  const toggleAppointment = (id) => {
    setSelectedAppointments((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleChannelChange = (e) => {
    const { name, checked } = e.target;
    setChannels((prev) => ({ ...prev, [name]: checked }));
  };

  const handleTimeChange = (index, value) => {
    const times = [...reminderTimes];
    times[index] = value;
    setReminderTimes(times);
  };

  const addTimeField = () => setReminderTimes((prev) => [...prev, ""]);
  const removeTimeField = (index) =>
    setReminderTimes((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!selectedAppointments.length) {
      addNotification("Select at least one appointment", "warning");
      return;
    }
    const chosenChannels = Object.keys(channels).filter((key) => channels[key]);
    if (!chosenChannels.length) {
      addNotification("Select at least one channel", "warning");
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        appointmentId: selectedAppointments,
        channels: chosenChannels,
        reminderTimes: reminderTimes.filter((t) => t),
      };
      await apiClient.post("/reminders/schedule", payload);
      addNotification("Reminders scheduled successfully", "success");
      navigate("/dashboard");
    } catch (err) {
      console.log("Error scheduling reminders", err);
      addNotification("Failed to schedule reminders", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="reminder-settings-page">
      <h1>Schedule Appointment Reminders</h1>
      <section>
        <h2>Select Appointments</h2>
        {appointments.length ? (
          <ul className="appointments-list">
            {appointments.map((appt) => (
              <li key={appt._id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedAppointments.includes(appt._id)}
                    onChange={() => toggleAppointment(appt._id)}
                  />
                  {new Date(appt.date).toLocaleString()} -{" "}
                  {appt.doctor.profile?.firstName}{" "}
                  {appt.doctor.profile?.lastName}
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p>No appointments found.</p>
        )}
      </section>

      <section>
        <h2>Select Channels</h2>
        {["Push", "SMS", "Email", "Dashboard"].map((ch) => (
          <label key={ch}>
            <input
              type="checkbox"
              name={ch}
              checked={channels[ch]}
              onChange={handleChannelChange}
            />{" "}
            {ch}
          </label>
        ))}
      </section>

      <section>
        <h2>Reminder Times</h2>
        {reminderTimes.map((time, idx) => (
          <div className="time-field" key={idx}>
            <input
              type="datetime-local"
              value={time}
              onChange={(e) => handleTimeChange(idx, e.target.value)}
            />
            {idx > 0 && (
              <button
                onClick={() => removeTimeField(idx)}
                className="btn btn-secondary"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button onClick={addTimeField} className="btn btn-primary">
          Add Time
        </button>
      </section>

      <section className="form-actions">
        <button
          onClick={handleSave}
          disabled={submitting}
          className="btn btn-primary"
        >
          {submitting ? "Saving..." : "Save Reminders"}
        </button>
      </section>
    </div>
  );
}
