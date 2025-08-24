import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { useNotifications } from "../../contexts/NotificationContextCore";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import "./NewMedicalRecordPage.css";

export default function NewMedicalRecordPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const patientId = params.get("patientId");
  const appointmentId = params.get("appointmentId");

  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientId) return;
    try {
      setSubmitting(true);
      const response = await apiClient.post("/medical-records", {
        patientId,
        appointmentId,
        diagnosis,
        notes,
      });
      if (response.data.success) {
        addNotification("Medical record created successfully", "success");
        navigate("/doctor/medical-records");
      } else {
        throw new Error(response.data.message || "Failed to create record");
      }
    } catch (error) {
      console.error(error);
      addNotification(
        error.message || "Error creating medical record",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) return <LoadingSpinner fullPage />;

  return (
    <div className="new-medical-record-page">
      <h1>New Medical Record</h1>
      <form onSubmit={handleSubmit} className="record-form">
        <div className="form-group">
          <label>Diagnosis</label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>
        <button type="submit" className="btn primary">
          Save Record
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => navigate("/doctor/medical-records")}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
