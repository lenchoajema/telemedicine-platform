import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContextCore";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import "./DoctorMedicalRecordsPage.css";

// Mock components for now - we will build these out
const PatientSelector = ({ patients, onSelect, selectedPatient }) => (
  <div className="patient-list">
    <h3>My Patients</h3>
    <input
      type="text"
      placeholder="Search patients..."
      className="patient-search"
    />
    <ul>
      {patients.map((p) => (
        <li
          key={p._id}
          className={selectedPatient?._id === p._id ? "active" : ""}
          onClick={() => onSelect(p)}
        >
          {p.profile?.firstName} {p.profile?.lastName}
        </li>
      ))}
    </ul>
  </div>
);

const RecordViewer = ({
  patient,
  onAddNote,
  onCreatePrescription,
  onOrderLabTest,
}) => {
  if (!patient) {
    return (
      <div className="record-viewer-placeholder">
        <h2>Select a patient to view their medical records.</h2>
      </div>
    );
  }

  return (
    <div className="record-viewer">
      <div className="record-viewer-header">
        <h2>
          Medical History for {patient.profile.firstName}{" "}
          {patient.profile.lastName}
        </h2>
        <div className="record-actions">
          <button className="btn primary" onClick={onAddNote}>
            Add New Note
          </button>
          <button className="btn" onClick={onCreatePrescription}>
            Create Prescription
          </button>
          <button className="btn" onClick={onOrderLabTest}>
            Order Lab Test
          </button>
        </div>
      </div>
      <div className="records-content">
        {/* We will map over actual records here */}
        <div className="record-item">
          <p>
            <strong>Date:</strong> July 23, 2025
          </p>
          <p>
            <strong>Diagnosis:</strong> General Check-up
          </p>
          <p>
            <strong>Notes:</strong> Patient is in good health.
          </p>
        </div>
      </div>
    </div>
  );
};

export default function DoctorMedicalRecordsPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/doctors/my-patients");
        if (response.data.success) {
          setPatients(response.data.data);
        } else {
          throw new Error("Failed to fetch patients");
        }
      } catch (error) {
        console.error("Error fetching doctor's patients:", error);
        addNotification(
          error.message || "Could not fetch patient list.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [addNotification]);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    // In a real implementation, we would fetch records for this patient
    // fetchRecordsForPatient(patient._id);
  };
  const handleAddNote = () => {
    if (selectedPatient)
      navigate(`/doctor/medical-records/new?patientId=${selectedPatient._id}`);
  };
  const handleCreatePrescription = () => {
    if (selectedPatient)
      navigate(`/doctor/prescriptions/new?patientId=${selectedPatient._id}`);
  };
  const handleOrderLabTest = () => {
    if (selectedPatient)
      navigate(`/doctor/lab-orders/new?patientId=${selectedPatient._id}`);
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <div className="doctor-medical-records-page">
      <div className="page-header">
        <h1>Patient Medical Records</h1>
        <p>
          Manage your patients' health records, prescriptions, and lab orders.
        </p>
      </div>
      <div className="records-layout">
        <PatientSelector
          patients={patients}
          onSelect={handleSelectPatient}
          selectedPatient={selectedPatient}
        />
        <RecordViewer
          patient={selectedPatient}
          records={records}
          onAddNote={handleAddNote}
          onCreatePrescription={handleCreatePrescription}
          onOrderLabTest={handleOrderLabTest}
        />
      </div>
    </div>
  );
}
