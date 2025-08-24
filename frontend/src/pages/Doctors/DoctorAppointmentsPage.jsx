import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../contexts/AuthContext";

const DoctorAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const response = await apiClient.get("/appointments");

        let fetchedAppointments = [];
        if (
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data.appointments)
        ) {
          fetchedAppointments = response.data.data.appointments;
        } else if (response.data && Array.isArray(response.data.data)) {
          fetchedAppointments = response.data.data;
        } else if (Array.isArray(response.data)) {
          fetchedAppointments = response.data;
        }

        console.log(
          "Processed Doctor appointments array:",
          fetchedAppointments
        );
        setAppointments(fetchedAppointments);
      } catch (err) {
        console.error("Error fetching doctor appointments:", err);
        setError(err.message || "Failed to fetch appointments.");
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  if (loading) {
    return <div className="text-center p-4">Loading appointments...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Appointments</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(appointments) && appointments.length > 0 ? (
              appointments.map((appt) => (
                <tr key={appt._id}>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">
                      {appt.patient?.profile?.firstName}{" "}
                      {appt.patient?.profile?.lastName || "N/A"}
                    </p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">
                      {new Date(appt.startTime || appt.date).toLocaleString()}
                    </p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <span className="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-green-200 opacity-50 rounded-full"
                      ></span>
                      <span className="relative">{appt.status}</span>
                    </span>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <button
                      className="text-blue-500 hover:text-blue-700 mr-3"
                      onClick={() => navigate(`/appointments/${appt._id}`)}
                    >
                      View Details
                    </button>
                    <button
                      className="text-green-600 hover:text-green-800"
                      onClick={() =>
                        navigate(`/doctor/appointments/${appt._id}/consult`)
                      }
                    >
                      Consult
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-10 text-gray-500">
                  No appointments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorAppointmentsPage;
