import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PatientVideoCallsPage.css";

const PatientVideoCallsPage = () => {
  const navigate = useNavigate();
  // Timestamp ticker for early access countdowns (kept in component scope per Hooks rules)
  const [nowTs, setNowTs] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const [activeCall, setActiveCall] = useState(null);
  const [upcomingCalls, setUpcomingCalls] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVideoCallData();
  }, []);

  const fetchVideoCallData = async () => {
    try {
      setLoading(true);

      // Fetch real appointment data from API
      const apiUrl =
        import.meta.env.VITE_API_URL ||
        "https://telemedicine-platform-mt8a.onrender.com/api";
      const response = await fetch(`${apiUrl}/appointments`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch appointments: ${response.status}`);
      }

      const raw = await response.json();
      // Handle API returning either {success,data:[]} or a direct array
      const appointments = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : [];

      const now = new Date();

      const safeAppointments = appointments.filter((a) => a && a._id);

      const withDerived = safeAppointments.map((a) => {
        // Some endpoints may provide date and time separately; build combined start date
        const start = new Date(a.date);
        // If a.time exists and is HH:MM, adjust start
        if (a.time && /^\d{2}:\d{2}$/.test(a.time)) {
          const [hh, mm] = a.time.split(":").map(Number);
          start.setHours(hh, mm, 0, 0);
        }
        const durationMin = a.duration || 30;
        const end = new Date(start.getTime() + durationMin * 60000);
        return { raw: a, start, end, durationMin };
      });

      const upcoming = withDerived
        .filter((x) => x.raw.status === "scheduled" && x.start > now)
        .sort((a, b) => a.start - b.start)
        .map((x) => ({
          id: x.raw._id,
          doctorName: x.raw.doctor
            ? `Dr. ${x.raw.doctor.profile.firstName} ${x.raw.doctor.profile.lastName}`
            : "Doctor Assigned",
          specialty:
            x.raw.doctor?.profile?.specialization || "General Medicine",
          scheduledTime: x.start.toISOString(),
          type: x.raw.reason || "Consultation",
          meetingLink: x.raw.meetingUrl || buildMeetingUrl(x.raw),
          duration: x.durationMin,
          earlyJoinEnabled: x.raw.earlyJoinEnabled,
          earlyJoinVisibleAt: x.raw.earlyJoinVisibleAt,
          earlyJoinNote: x.raw.earlyJoinNote,
        }));

      const history = withDerived
        .filter((x) => x.raw.status === "completed")
        .sort((a, b) => b.start - a.start)
        .map((x) => ({
          id: x.raw._id,
          doctorName: x.raw.doctor
            ? `Dr. ${x.raw.doctor.profile.firstName} ${x.raw.doctor.profile.lastName}`
            : "Doctor",
          specialty:
            x.raw.doctor?.profile?.specialization || "General Medicine",
          date: x.start.toISOString(),
          duration: `${x.durationMin} minutes`,
          type: x.raw.reason || "Consultation",
          status: "completed",
          recording: "not-available",
          notes: x.raw.notes,
        }));

      const active = withDerived.find(
        (x) => x.raw.status === "scheduled" && x.start <= now && now <= x.end
      );
      const activeCallObj = active
        ? {
            id: active.raw._id,
            doctorName: active.raw.doctor
              ? `Dr. ${active.raw.doctor.profile.firstName} ${active.raw.doctor.profile.lastName}`
              : "Doctor",
            specialty:
              active.raw.doctor?.profile?.specialization || "General Medicine",
            startTime: active.start.toISOString(),
            meetingLink: active.raw.meetingUrl || buildMeetingUrl(active.raw),
            type: active.raw.reason || "Consultation",
          }
        : null;

      setActiveCall(activeCallObj);
      setUpcomingCalls(upcoming);
      setCallHistory(history);
    } catch (err) {
      setError("Failed to load video call data");
      console.error("Error fetching video call data:", err);
      // Set empty arrays instead of mock data
      setActiveCall(null);
      setUpcomingCalls([]);
      setCallHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const joinCall = (appointmentId) => {
    // Navigate to the WebRTC video call room
    navigate(`/video-call/${appointmentId}`);
  };

  const enterWaitingRoom = (appointmentId) => {
    navigate(`/video-call/waiting/${appointmentId}`);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const isCallStartable = (scheduledTime) => {
    const now = new Date();
    const callTime = new Date(scheduledTime);
    const timeDiff = callTime.getTime() - now.getTime();
    return timeDiff <= 15 * 60 * 1000 && timeDiff >= -5 * 60 * 1000; // 15 minutes before to 5 minutes after
  };

  const canEnterWaitingEarly = (call) => {
    if (!call.earlyJoinEnabled) return false;
    if (!call.earlyJoinVisibleAt) return true; // immediate early access (within backend safety window)
    const now = new Date();
    return now >= new Date(call.earlyJoinVisibleAt);
  };
  const isEarlyPending = (call) =>
    call.earlyJoinEnabled && !canEnterWaitingEarly(call);

  const earlyPendingCountdown = (call) => {
    if (!isEarlyPending(call) || !call.earlyJoinVisibleAt) return null;
    const target = new Date(call.earlyJoinVisibleAt).getTime();
    const diffMs = target - nowTs;
    if (diffMs <= 0) return null;
    const totalSec = Math.floor(diffMs / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  };

  // Build deterministic meeting URL fallback so doctor & patient land in same room
  function buildMeetingUrl(apt) {
    const base =
      import.meta.env.VITE_MEETING_BASE || "https://meet.telemedicine.com/room";
    return `${base}/${apt._id}`;
  }

  if (loading) {
    return (
      <div className="patient-video-calls-page">
        <div className="loading-spinner">Loading video calls...</div>
      </div>
    );
  }

  return (
    <div className="patient-video-calls-page">
      <div className="page-header">
        <h1>Video Calls</h1>
        <p>Manage your video consultations with doctors</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Active Call Section */}
      {activeCall && (
        <div className="active-call-section">
          <h2>Active Call</h2>
          <div className="active-call-card">
            <div className="call-info">
              <h3>{activeCall.doctorName}</h3>
              <p>{activeCall.specialty}</p>
              <p>Started: {formatDateTime(activeCall.startTime)}</p>
            </div>
            <div className="call-actions">
              <button
                className="btn-waiting-room"
                onClick={() => enterWaitingRoom(activeCall.id)}
              >
                Enter Waiting Room
              </button>
              <button
                className="btn-rejoin"
                onClick={() => joinCall(activeCall.id)}
              >
                Rejoin Call
              </button>
              <button className="btn-end-call">End Call</button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Calls Section */}
      <div className="upcoming-calls-section">
        <h2>Upcoming Calls</h2>
        {upcomingCalls.length === 0 ? (
          <div className="no-data">
            <p>No upcoming video calls scheduled</p>
          </div>
        ) : (
          <div className="calls-grid">
            {upcomingCalls.map((call) => (
              <div key={call.id} className="call-card">
                <div className="call-header">
                  <h3>{call.doctorName}</h3>
                  <span className="call-type">{call.type}</span>
                  {call.earlyJoinEnabled && (
                    <span
                      className="early-badge"
                      title={
                        call.earlyJoinNote || "Doctor enabled early access"
                      }
                      aria-label={
                        call.earlyJoinNote ||
                        "Early access enabled for this appointment"
                      }
                      role="status"
                      aria-live="polite"
                    >
                      Early Access
                    </span>
                  )}
                </div>
                <div className="call-details">
                  <p>
                    <strong>Specialty:</strong> {call.specialty}
                  </p>
                  <p>
                    <strong>Scheduled:</strong>{" "}
                    {formatDateTime(call.scheduledTime)}
                  </p>
                  {call.earlyJoinEnabled && (
                    <p className="early-note" role="status" aria-live="polite">
                      <strong>Early Join:</strong>{" "}
                      {call.earlyJoinNote
                        ? call.earlyJoinNote
                        : canEnterWaitingEarly(call)
                        ? "Early waiting room open."
                        : call.earlyJoinVisibleAt
                        ? `Opens at ${formatDateTime(call.earlyJoinVisibleAt)}`
                        : "Doctor opened early access."}
                    </p>
                  )}
                </div>
                <div className="call-actions">
                  {isCallStartable(call.scheduledTime) ? (
                    <>
                      <button
                        className="btn-waiting-room"
                        onClick={() => enterWaitingRoom(call.id)}
                      >
                        Enter Waiting Room
                      </button>
                      <button
                        className="btn-join"
                        onClick={() => joinCall(call.id)}
                      >
                        Join Call
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className={`btn-waiting-room ${
                          !canEnterWaitingEarly(call) ? "disabled" : ""
                        } ${isEarlyPending(call) ? "early-pending" : ""}`}
                        disabled={!canEnterWaitingEarly(call)}
                        aria-disabled={!canEnterWaitingEarly(call)}
                        aria-label={
                          canEnterWaitingEarly(call)
                            ? "Enter early waiting room"
                            : isEarlyPending(call)
                            ? call.earlyJoinVisibleAt
                              ? `Early access pending. Waiting until ${formatDateTime(
                                  call.earlyJoinVisibleAt
                                )}`
                              : "Early access pending"
                            : "Waiting room not yet available"
                        }
                        onClick={() =>
                          canEnterWaitingEarly(call) &&
                          enterWaitingRoom(call.id)
                        }
                      >
                        {canEnterWaitingEarly(call)
                          ? "Enter Early Waiting Room"
                          : call.earlyJoinEnabled
                          ? "Early Access Pending"
                          : call.earlyJoinEnabled
                          ? `Early Access Pending${
                              earlyPendingCountdown(call)
                                ? " (" + earlyPendingCountdown(call) + ")"
                                : ""
                            }`
                          : "Waiting Room Unavailable Yet"}
                      </button>
                    </>
                  )}
                  <button className="btn-reschedule">Reschedule</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call History Section */}
      <div className="call-history-section">
        <h2>Call History</h2>
        {callHistory.length === 0 ? (
          <div className="no-data">
            <p>No previous video calls</p>
          </div>
        ) : (
          <div className="history-table">
            <table>
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialty</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Recording</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {callHistory.map((call) => (
                  <tr key={call.id}>
                    <td>{call.doctorName}</td>
                    <td>{call.specialty}</td>
                    <td>{formatDateTime(call.date)}</td>
                    <td>{call.duration}</td>
                    <td>{call.type}</td>
                    <td>
                      <span className={`status-badge ${call.status}`}>
                        {call.status}
                      </span>
                    </td>
                    <td>
                      {call.recording === "available" ? (
                        <button className="btn-small">View</button>
                      ) : (
                        <span className="not-available">N/A</span>
                      )}
                    </td>
                    <td>
                      <button className="btn-small">Book Follow-up</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientVideoCallsPage;
