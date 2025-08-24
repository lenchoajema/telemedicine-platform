import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import AppointmentCard from "../../components/appointments/AppointmentCard";
import AppointmentFilter from "../../components/appointments/AppointmentFilter";
import NewAppointmentModal from "../../components/appointments/NewAppointmentModal";
import AppointmentDetails from "../../components/appointments/AppointmentDetails";
import AppointmentService from "../../api/AppointmentService";

const AppointmentsPage = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [initialEditMode, setInitialEditMode] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    status: "all",
    date: "upcoming",
    sortBy: "date-asc",
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  // Medical document upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Use useCallback to memoize functions used in useEffect dependencies
  const applyFilters = useCallback(() => {
    // Ensure appointments is always an array
    const appointmentsArray = Array.isArray(appointments) ? appointments : [];
    let filtered = [...appointmentsArray];

    // Filter by status
    if (filterOptions.status !== "all") {
      filtered = filtered.filter(
        (appointment) => appointment.status === filterOptions.status
      );
    }

    // Filter by upcoming or past
    const now = new Date();
    if (filterOptions.date === "upcoming") {
      filtered = filtered.filter(
        (appointment) => new Date(appointment.date) > now
      );
    } else if (filterOptions.date === "past") {
      filtered = filtered.filter(
        (appointment) => new Date(appointment.date) < now
      );
    }

    // Filter by selected calendar date
    filtered = filtered.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      return (
        appointmentDate.getFullYear() === selectedDate.getFullYear() &&
        appointmentDate.getMonth() === selectedDate.getMonth() &&
        appointmentDate.getDate() === selectedDate.getDate()
      );
    });

    setFilteredAppointments(filtered);
  }, [appointments, filterOptions, selectedDate]);

  const fetchAvailableSlots = useCallback(
    async (date, doctorId = null) => {
      try {
        if (doctorId) {
          const slots = await AppointmentService.getAvailableSlots(
            date,
            doctorId
          );
          setAvailableSlots(slots);
        } else {
          // If no doctorId provided, don't fetch slots
          setAvailableSlots([]);
        }
      } catch (err) {
        addNotification(
          `Failed to fetch available slots: ${err.message}`,
          "error"
        );
        setAvailableSlots([]);
      }
    },
    [addNotification]
  );

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        console.log("Fetching appointments for patient...");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/appointments`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch appointments");
        }

        const data = await response.json();
        console.log("Patient appointments API response:", data);

        // Handle different response formats
        let appointmentsArray = [];
        if (Array.isArray(data)) {
          appointmentsArray = data;
        } else if (data && data.success && Array.isArray(data.data)) {
          appointmentsArray = data.data;
        } else if (data && Array.isArray(data.data)) {
          appointmentsArray = data.data;
        }

        console.log(
          "Processed appointments array for patient:",
          appointmentsArray
        );
        setAppointments(appointmentsArray);
        setFilteredAppointments(appointmentsArray);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        addNotification(err.message, "error");
        setAppointments([]); // Ensure it's always an array
        setFilteredAppointments([]); // Ensure it's always an array
      }
    };

    fetchAppointments();
  }, [addNotification]);

  useEffect(() => {
    applyFilters();
  }, [filterOptions, appointments, selectedDate, applyFilters]);

  useEffect(() => {
    // Don't automatically fetch slots - let the modal handle this when a doctor is selected
    setAvailableSlots([]);
  }, [selectedDate]);

  const handleFilterChange = (newFilters) => {
    setFilterOptions((prev) => ({ ...prev, ...newFilters }));
  };

  const handleCancelAppointment = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/appointments/${id}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel appointment");
      }

      setAppointments((prev) =>
        prev.map((app) =>
          app._id === id ? { ...app, status: "cancelled" } : app
        )
      );

      addNotification("Appointment cancelled successfully", "success");
    } catch (err) {
      addNotification(err.message, "error");
    }
  };

  const handleCreateAppointment = (newAppointment) => {
    setAppointments((prev) => [...prev, newAppointment]);
    addNotification("Appointment created successfully", "success");
    setShowNewModal(false);
  };

  const handleViewDetails = (appointment) => {
    setInitialEditMode(false);
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };
  const handleEditAppointment = (appointment) => {
    setInitialEditMode(true);
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleUpdateAppointment = (updatedAppointment) => {
    setAppointments((prev) =>
      prev.map((app) =>
        app._id === updatedAppointment._id ? updatedAppointment : app
      )
    );
    addNotification("Appointment updated successfully", "success");
    setShowDetailsModal(false);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // File selection handler
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0] || null);
  };
  // Upload the selected document
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("patientId", user._id);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/medical-documents/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: formData,
        }
      );
      if (!response.ok) throw new Error("Upload failed");
      await response.json();
      addNotification("Document uploaded successfully", "success");
      setSelectedFile(null);
    } catch (error) {
      addNotification(error.message, "error");
    } finally {
      setUploading(false);
    }
  };

  if (loading)
    return <div className="loading-spinner">Loading appointments...</div>;

  return (
    <div className="appointments-page">
      <div className="page-header">
        <h1>My Appointments</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowNewModal(true)}
        >
          New Appointment
        </button>
      </div>{" "}
      {/* close page-header */}
      <div className="appointments-list">
        {appointments && appointments.length > 0 ? (
          appointments.map((appointment) => {
            const start = new Date(appointment.date);
            const now = new Date();
            const diffMin = (start.getTime() - now.getTime()) / 60000; // minutes until start
            const canEnterWaiting =
              appointment.status === "scheduled" &&
              diffMin <= 30 &&
              diffMin > -90; // 30 min before until 90 after
            return (
              <div key={appointment._id} className="appointment-with-waiting">
                <AppointmentCard
                  appointment={appointment}
                  onCancel={() => handleCancelAppointment(appointment._id)}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEditAppointment}
                  isPatient={user.role === "patient"}
                />
                {canEnterWaiting && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() =>
                        window.location.assign(
                          `/video-call/waiting/${appointment._id}`
                        )
                      }
                    >
                      Enter Waiting Room
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="no-appointments">No appointments available</div>
        )}
      </div>
      {showNewModal && (
        <NewAppointmentModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreateAppointment}
          availableSlots={availableSlots}
          selectedDate={selectedDate}
        />
      )}
      {showDetailsModal && selectedAppointment && (
        <AppointmentDetails
          appointment={selectedAppointment}
          initialEditMode={initialEditMode}
          onClose={() => setShowDetailsModal(false)}
          onUpdate={handleUpdateAppointment}
        />
      )}
    </div>
  );
};

export default AppointmentsPage;
