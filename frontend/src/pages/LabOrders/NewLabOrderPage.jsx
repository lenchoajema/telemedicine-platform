import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { useNotifications } from "../../contexts/NotificationContextCore";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import "./NewLabOrderPage.css";

export default function NewLabOrderPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const paramRecordId = new URLSearchParams(search).get("recordId");
  const patientId = new URLSearchParams(search).get("patientId");
  const [recordId, setRecordId] = useState(paramRecordId);
  const { addNotification } = useNotifications();

  // If no recordId, fetch patient's records and use the latest
  useEffect(() => {
    if (!recordId && patientId) {
      apiClient
        .get(`/medical-records?patientId=${patientId}`)
        .then((res) => {
          if (res.data.success && res.data.data.length) {
            setRecordId(res.data.data[0]._id);
          }
        })
        .catch((e) => {
          console.error("Error loading records for lab order:", e);
        });
    }
  }, [patientId, recordId]);

  // Define available lab tests
  const testsOptions = [
    "Complete Blood Count",
    "Lipid Panel",
    "Basic Metabolic Panel",
    "Liver Function Test",
    "Thyroid Panel",
    "Hemoglobin A1C",
    "Urinalysis",
  ];
  // Track selected tests
  const [selectedTests, setSelectedTests] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recordId) {
      addNotification(
        "No medical record found. Please create a medical record first.",
        "error"
      );
      return;
    }
    try {
      setSubmitting(true);
      const response = await apiClient.post("/lab-orders", {
        recordId,
        labTests: selectedTests,
      });
      if (response.data.success) {
        addNotification("Lab order created successfully", "success");
        navigate("/doctor/medical-records");
      } else {
        throw new Error(response.data.message || "Failed to create lab order");
      }
    } catch (error) {
      console.error(error);
      addNotification(error.message || "Error creating lab order", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTest = (test) => {
    setSelectedTests((prev) =>
      prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]
    );
  };

  if (submitting) return <LoadingSpinner fullPage />;

  return (
    <div className="new-lab-order-page">
      <h1>New Lab Order</h1>
      <form onSubmit={handleSubmit} className="lab-order-form">
        <div className="form-group">
          <label>Tests</label>
          <div className="tests-options">
            {testsOptions.map((test) => (
              <div key={test} className="test-option">
                <input
                  type="checkbox"
                  id={test}
                  checked={selectedTests.includes(test)}
                  onChange={() => toggleTest(test)}
                />
                <label htmlFor={test}>{test}</label>
              </div>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="btn primary"
          disabled={!recordId || selectedTests.length === 0 || submitting}
        >
          Save Order
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
