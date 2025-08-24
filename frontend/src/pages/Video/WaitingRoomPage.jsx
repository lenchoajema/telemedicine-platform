import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import "./WaitingRoomPage.css";

export default function WaitingRoomPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nowTs, setNowTs] = useState(Date.now());
  const [nextRefreshIn, setNextRefreshIn] = useState(0);
  const pollRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const prevPresenceRef = useRef(null);
  const [toasts, setToasts] = useState([]);

  const pushToast = (msg, type = 'info', ttl = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, ttl);
  };

  const fetchInfo = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const res = await apiClient.get(
        `/video-calls/appointment/${appointmentId}/waiting-room`
      );
      const data = res.data.data;
      const prevPresence = prevPresenceRef.current;
      // Detect presence edge changes
      if (prevPresence) {
        if (!prevPresence.doctorPresent && data.presence?.doctorPresent) {
          pushToast('Doctor entered the waiting room', 'success');
        }
        if (!prevPresence.patientPresent && data.presence?.patientPresent) {
          pushToast('Patient entered the waiting room', 'success');
        }
        if (prevPresence.doctorPresent && !data.presence?.doctorPresent) {
          pushToast('Doctor left the waiting room', 'warn');
        }
        if (prevPresence.patientPresent && !data.presence?.patientPresent) {
          pushToast('Patient left the waiting room', 'warn');
        }
      }
      prevPresenceRef.current = data.presence || null;
      setInfo(data);
      setError(null);
    } catch (e) {
      console.error("Waiting room fetch failed", e);
      setError(e.response?.data?.message || "Failed to load waiting room");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    if (!appointmentId) return;
    // Initial fetch
    fetchInfo(true);
    // Polling every 15s
    pollRef.current = setInterval(fetchInfo, 15000);
    // Countdown to next refresh (UI only, 1s resolution)
    setNextRefreshIn(15);
    refreshTimerRef.current = setInterval(() => {
      setNextRefreshIn((v) => (v <= 1 ? 15 : v - 1));
    }, 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [appointmentId]);

  // Second-level ticking for live countdown until start
  useEffect(() => {
    const tick = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const canJoin = info?.joinAllowed;
  const early = info?.earlyJoin;

  const handleJoin = () => navigate(`/video-call/${appointmentId}`);

  const minutesText = () => {
    if (!info) return "";
    const startMs = new Date(info.scheduledTime).getTime();
    const diffSec = Math.floor((startMs - nowTs) / 1000);
    if (diffSec > 0) {
      const m = Math.floor(diffSec / 60);
      const s = diffSec % 60;
      return `Starts in ${m}m ${s}s`;
    }
    const sinceSec = Math.floor((nowTs - startMs) / 1000);
    if (sinceSec >= 0) {
      const m = Math.floor(sinceSec / 60);
      const s = sinceSec % 60;
      return `Started ${m}m ${s}s ago`;
    }
    return "";
  };

  // Auto-redirect when join becomes allowed
  useEffect(() => {
    if (info?.joinAllowed) {
      pushToast('Call is now open. Joining...','success', 1500);
      const t = setTimeout(() => navigate(`/video-call/${appointmentId}`), 1200);
      return () => clearTimeout(t);
    }
  }, [info?.joinAllowed, navigate, appointmentId]);

  if (loading)
    return (
      <div className="waiting-room-page">
        <div className="loading">Loading waiting room...</div>
      </div>
    );

  return (
    <div className="waiting-room-page">
      <h1>Video Call Waiting Room</h1>
      {error && <div className="error">{error}</div>}
      {info && (
        <div className="waiting-room-card">
          <div className="meta">
            <p>
              <strong>Appointment:</strong>{" "}
              {new Date(info.scheduledTime).toLocaleString()}
            </p>
            <p>
              <strong>Duration:</strong> {info.duration} mins
            </p>
            <p>
              <strong>Status:</strong> {info.status}
            </p>
            <p>
              <strong>Doctor:</strong> {info.participants.doctor.name}
            </p>
            <p>
              <strong>Patient:</strong> {info.participants.patient.name}
            </p>
            <p>
              <strong>Meeting Link:</strong> <code>{info.meetingUrl}</code>{" "}
              {early?.overrideActive && (
                <span className="badge-early">EARLY ACCESS</span>
              )}
            </p>
            {early?.enabled && (
              <p className="early-note">
                <strong>Early Join:</strong>{" "}
                {early.note
                  ? early.note
                  : early.overrideActive
                  ? "Doctor has opened early access."
                  : "Enabled; waiting for early access time."}
              </p>
            )}
            <p>{minutesText()}</p>
            <p className="next-refresh">Auto refresh in {nextRefreshIn}s</p>
            {info.presence && (
              <div className="presence">
                <strong>Presence:</strong>{' '}
                <span className={info.presence.doctorPresent ? 'present' : 'absent'}>
                  Doctor {info.presence.doctorPresent ? 'present' : 'away'}
                </span>{' | '}
                <span className={info.presence.patientPresent ? 'present' : 'absent'}>
                  Patient {info.presence.patientPresent ? 'present' : 'away'}
                </span>
                <span className="participants-count"> ( {info.presence.participantsPresent} / 2 )</span>
              </div>
            )}
          </div>
          <div className="actions">
            <button className="btn" disabled={!canJoin} onClick={handleJoin}>
              {canJoin ? "Join Call" : "Not Yet Open"}
            </button>
            <button className="btn secondary" onClick={() => fetchInfo(true)}>
              Refresh
            </button>
          </div>
        </div>
      )}
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
}
