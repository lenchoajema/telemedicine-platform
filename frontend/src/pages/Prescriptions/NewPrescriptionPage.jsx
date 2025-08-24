import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { useNotifications } from "../../contexts/NotificationContextCore";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import "./NewPrescriptionPage.css";

export default function NewPrescriptionPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const recordId = new URLSearchParams(search).get("recordId");
  const { addNotification } = useNotifications();

  const [prescription, setPrescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recordId) return;
    try {
      setSubmitting(true);
      const response = await apiClient.put(`/medical-records/${recordId}`, {
        prescription,
      });
      if (response.data.success) {
        addNotification("Prescription created successfully", "success");
        navigate("/doctor/medical-records");
      } else {
        throw new Error(
          response.data.message || "Failed to create prescription"
        );
      }
    } catch (error) {
      console.error(error);
      addNotification(error.message || "Error creating prescription", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) return <LoadingSpinner fullPage />;

  return (
    <div className="new-prescription-page">
      <h1>New Prescription</h1>
      <form onSubmit={handleSubmit} className="prescription-form">
        <div className="form-group">
          <label>Prescription Details</label>
          <textarea
            value={prescription}
            onChange={(e) => setPrescription(e.target.value)}
            rows={4}
            required
          />
        </div>
        <button type="submit" className="btn primary">
          Save Prescription
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
