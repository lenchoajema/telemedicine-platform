import { useState, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useParams, useNavigate } from "react-router-dom";
import AppointmentDetails from "../../components/appointments/AppointmentDetails";
import apiClient from "../../api/apiClient";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import { useNotifications } from "../../contexts/NotificationContextCore";
import { useAuth } from "../../contexts/AuthContext";

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await apiClient.get(`/appointments/${id}`);
        setAppointment(response.data.data);
      } catch (error) {
        addNotification(error.message || "Failed to load appointment", "error");
        // Redirect to appropriate appointments list based on role
        if (user?.role === "doctor") {
          navigate("/doctor/appointments");
        } else {
          navigate("/appointments");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [id, addNotification, navigate, user]);

  if (loading) return <LoadingSpinner fullPage />;

  // Handle closing: route back based on role
  const handleClose = () => {
    if (user?.role === "doctor") {
      navigate("/doctor/appointments");
    } else {
      navigate("/appointments");
    }
  };

  const handleCreateRecord = (appt) => {
    // Navigate to new medical record page for this patient
    const patientId = appt.patient?._id;
    const appointmentId = appt._id;
    navigate(
      `/doctor/medical-records/new?patientId=${patientId}&appointmentId=${appointmentId}`
    );
  };

  // Chat handler
  const handleChat = async () => {
    if (!appointment) return;
    const otherUserId =
      user.role === "doctor" ? appointment.patient._id : appointment.doctor._id;
    // create or reuse session
    const session = await createSession(
      [user._id, otherUserId],
      appointment._id
    );
    // select session in context
    selectSession(session);
    // navigate to chat page with sessionId param
    navigate(`/chat?sessionId=${session._id}`);
  };

  return (
    <div className="appointment-detail-page">
      <button onClick={handleChat} className="btn btn-primary chat-btn">
        Chat about this appointment
      </button>
      <AppointmentDetails
        appointment={appointment}
        onClose={handleClose}
        onUpdate={(updated) => setAppointment(updated)}
        onCreateMedicalRecord={handleCreateRecord}
      />
    </div>
  );
}
