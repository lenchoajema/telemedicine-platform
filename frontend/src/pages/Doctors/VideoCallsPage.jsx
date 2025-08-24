import React, { useState, useEffect } from "react";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../contexts/AuthContext";
import { Video } from "lucide-react";
import { useNavigate } from "react-router-dom";

const VideoCallsPage = () => {
  const [upcomingCalls, setUpcomingCalls] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startError, setStartError] = useState(null); // inline start call error
  const { user } = useAuth();

  useEffect(() => {
    let interval; // Initialize interval variable
    const fetchVideoCallData = async () => {
      if (!user) return;
      try {
        // Only show spinner on very first load
        setLoading((prev) => (prev === true ? true : false));
        const response = await apiClient.get("/appointments");

        // CORRECTED: Safely access the nested appointments array
        let appointments = [];
        if (
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data.appointments)
        ) {
          appointments = response.data.data.appointments;
        } else if (response.data && Array.isArray(response.data.data)) {
          appointments = response.data.data;
        } else if (Array.isArray(response.data)) {
          appointments = response.data;
        }

        const now = new Date();
        const upcoming = appointments
          .filter((appt) => appt.status === "scheduled")
          .map((a) => {
            const start = new Date(a.date);
            if (a.time && /^\d{2}:\d{2}$/.test(a.time)) {
              const [hh, mm] = a.time.split(":").map(Number);
              start.setHours(hh, mm, 0, 0);
            }
            const duration = a.duration || 30;
            const end = new Date(start.getTime() + duration * 60000);
            return { ...a, _start: start, _end: end };
          })
          .filter((a) => a._end > now)
          .sort((a, b) => a._start - b._start);

        setUpcomingCalls(upcoming);
        if (selectedAppt) {
          const still = upcoming.find((a) => a._id === selectedAppt._id);
          if (!still) {
            setSelectedAppt(null);
          } else if (
            still.status !== selectedAppt.status ||
            still.earlyJoinEnabled !== selectedAppt.earlyJoinEnabled
          ) {
            // Only update when meaningful fields changed to avoid re-render loop
            setSelectedAppt(still);
          }
        }
      } catch (err) {
        console.error("Error fetching video call data:", err);
        setError(err.message || "Failed to fetch data.");
        setUpcomingCalls([]); // Ensure state is an array on error
      } finally {
        setLoading(false);
      }
    };
    fetchVideoCallData();
    interval = setInterval(fetchVideoCallData, 30000); // Set interval for auto-refresh
    return () => interval && clearInterval(interval);
  }, [user]);

  if (loading) {
    return <div className="text-center p-4">Loading video calls...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  }

  const withinJoinWindow = (appt) => {
    const now = new Date();
    const start = appt._start || new Date(appt.date);
    const minutesUntil = (start.getTime() - now.getTime()) / 60000;
    return minutesUntil <= 15;
  };

  const handleStartCall = async () => {
    if (!selectedAppt) return;
    setStartError(null);
    setStarting(true);
    const apptId = selectedAppt._id;
    const attemptCreateRoom = async (retry = false) => {
      try {
        const roomRes = await apiClient.post(
          `/video-calls/appointment/${apptId}/room`
        );
        if (roomRes.data?.data?.roomId) {
          navigate(`/video-call/${apptId}`);
        }
      } catch (e) {
        const msg = e.response?.data?.message || "Failed to start video call";
        // If backend still says not available yet on first attempt *after* we just enabled early join, retry once after short delay
        if (!retry && /not available yet/i.test(msg)) {
          setTimeout(() => attemptCreateRoom(true), 400); // brief wait for DB update & controller override
          return;
        }
        console.error("Failed to start call", e);
        setStartError(msg);
      } finally {
        if (!retry) setStarting(false);
      }
    };
    try {
      // If outside join window ensure early join is enabled before creating room
      if (!withinJoinWindow(selectedAppt) && !selectedAppt.earlyJoinEnabled) {
        try {
          await apiClient.put(`/appointments/${apptId}`, {
            earlyJoinEnabled: true,
            earlyJoinNote:
              "Doctor is preparing early, you may enter the waiting room.",
          });
          // Small delay to reduce race with backend early override logic
          await new Promise((r) => setTimeout(r, 150));
        } catch (e) {
          // Non-fatal: proceed to room creation anyway
          console.log("Early join enable failed (non-fatal)", e?.message);
        }
      }
      await attemptCreateRoom(false);
    } catch (outer) {
      setStartError(outer.message || "Unexpected error starting call");
      setStarting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Video Consultations</h1>
      <p className="text-gray-600 mb-4">
        Select an appointment and start a secure video session. Starting early
        enables the patient's waiting room & sends a reminder.
      </p>
      {upcomingCalls.length > 0 && (
        <div className="mb-4 flex gap-2 items-center">
          <select
            className="border rounded px-3 py-2 flex-1"
            value={selectedAppt?._id || ""}
            onChange={(e) => {
              const appt = upcomingCalls.find((a) => a._id === e.target.value);
              setSelectedAppt(appt || null);
            }}
          >
            <option value="">Select appointment...</option>
            {upcomingCalls.map((a) => (
              <option key={a._id} value={a._id}>
                {new Date(a._start).toLocaleString()} –{" "}
                {a.patient?.profile?.firstName || a.patient?.firstName}{" "}
                {a.patient?.profile?.lastName || a.patient?.lastName}
              </option>
            ))}
          </select>
          <button
            disabled={!selectedAppt || starting}
            onClick={handleStartCall}
            className={`px-4 py-2 rounded text-white ${
              !selectedAppt || starting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {starting
              ? "Starting..."
              : withinJoinWindow(selectedAppt || {})
              ? "Start Call"
              : "Start Early"}
          </button>
          {selectedAppt && !withinJoinWindow(selectedAppt) && (
            <span className="text-xs text-amber-600">
              Early start will open waiting room
            </span>
          )}
          {startError && (
            <div className="text-xs text-red-600 ml-2">{startError}</div>
          )}
        </div>
      )}
      {upcomingCalls.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {upcomingCalls.map((call) => (
            <div key={call._id} className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-bold text-lg">
                {user.role === "doctor"
                  ? `Patient: ${call.patient?.profile?.firstName}`
                  : `Dr. ${call.doctor?.profile?.firstName}`}
              </h2>
              <p className="text-gray-600">
                {new Date(call._start || call.date).toLocaleString()}{" "}
                {call.status === "in-progress" && (
                  <span className="ml-2 inline-block bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                    In Progress
                  </span>
                )}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setSelectedAppt(call);
                    handleStartCall();
                  }}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center"
                >
                  <Video className="mr-2" size={20} />
                  {call.status === "in-progress"
                    ? "Rejoin Call"
                    : withinJoinWindow(call)
                    ? "Start Now"
                    : "Start Early"}
                </button>
                <button
                  onClick={() => navigate(`/video-call/waiting/${call._id}`)}
                  className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 text-sm"
                >
                  Waiting Room
                </button>
                {call.earlyJoinEnabled && call.status === "scheduled" && (
                  <span className="text-xs text-amber-600 font-medium">
                    Early access enabled
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">
          No upcoming video calls scheduled.
        </p>
      )}
    </div>
  );
};

export default VideoCallsPage;
