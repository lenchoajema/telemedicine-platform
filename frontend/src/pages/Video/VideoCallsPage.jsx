import React, { useState, useEffect } from "react";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../contexts/AuthContext";
import { Video } from "lucide-react";

const VideoCallsPage = () => {
  const [upcomingCalls, setUpcomingCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchVideoCallData = async () => {
      if (!user) return;
      try {
        setLoading(true);
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

        // Filter for upcoming appointments that are of type 'video'
        const upcoming = appointments.filter(
          (appt) =>
            new Date(appt.startTime || appt.date) > new Date() &&
            appt.type === "video"
        );

        setUpcomingCalls(upcoming);
      } catch (err) {
        console.error("Error fetching video call data:", err);
        setError(err.message || "Failed to fetch data.");
        setUpcomingCalls([]); // Ensure state is an array on error
      } finally {
        setLoading(false);
      }
    };

    fetchVideoCallData();
  }, [user]);

  if (loading) {
    return <div className="text-center p-4">Loading video calls...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Upcoming Video Calls</h1>
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
                {new Date(call.startTime || call.date).toLocaleString()}
              </p>
              <button className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center">
                <Video className="mr-2" size={20} />
                Join Call
              </button>
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
