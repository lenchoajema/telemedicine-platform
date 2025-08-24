import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../../services/apiClient";
import "./AppointmentLifecyclePage.css";

export default function AppointmentLifecyclePage() {
  const { appointmentId } = useParams();
  const [lifecycle, setLifecycle] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch lifecycle and events
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(
          `/appointments/${appointmentId}/lifecycle`
        );
        const { lifecycle: lc, events: ev } = response.data.data;
        setLifecycle(lc);
        setEvents(ev);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [appointmentId]);

  if (loading) return <p>Loading lifecycle data...</p>;
  if (error) return <p className="error">Error: {error}</p>;
  if (!lifecycle) return <p>No lifecycle found for this appointment.</p>;

  return (
    <div className="lifecycle-page">
      <h2>Appointment Lifecycle Audit</h2>
      <div className="lifecycle-header">
        <table>
          <tbody>
            <tr>
              <th>Lifecycle ID</th>
              <td>{lifecycle.lifecycleId}</td>
            </tr>
            <tr>
              <th>Appointment ID</th>
              <td>{lifecycle.appointmentId}</td>
            </tr>
            <tr>
              <th>Patient</th>
              <td>
                {lifecycle.patientId.profile?.firstName}{" "}
                {lifecycle.patientId.profile?.lastName} (
                {lifecycle.patientId._id})
              </td>
            </tr>
            <tr>
              <th>Doctor</th>
              <td>
                {lifecycle.doctorId.profile?.firstName}{" "}
                {lifecycle.doctorId.profile?.lastName} ({lifecycle.doctorId._id}
                )
              </td>
            </tr>
            <tr>
              <th>Status</th>
              <td>{lifecycle.currentStatus}</td>
            </tr>
            <tr>
              <th>Start At</th>
              <td>{new Date(lifecycle.startAt).toLocaleString()}</td>
            </tr>
            <tr>
              <th>End At</th>
              <td>
                {lifecycle.endAt
                  ? new Date(lifecycle.endAt).toLocaleString()
                  : "—"}
              </td>
            </tr>
            <tr>
              <th>Last Updated</th>
              <td>{new Date(lifecycle.lastUpdatedAt).toLocaleString()}</td>
            </tr>
            <tr>
              <th>Updated By</th>
              <td>{lifecycle.lastUpdatedBy}</td>
            </tr>
            <tr>
              <th>Closure Notes</th>
              <td>{lifecycle.closureNotes || "—"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Event Timeline</h3>
      <table className="lifecycle-events">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Event Type</th>
            <th>Actor</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {events.map((evt) => (
            <tr key={evt._id}>
              <td>{new Date(evt.timestamp).toLocaleString()}</td>
              <td>{evt.eventType}</td>
              <td>{evt.actorId}</td>
              <td>
                <pre>{JSON.stringify(evt.payload, null, 2)}</pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
