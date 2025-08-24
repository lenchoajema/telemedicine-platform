import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContextCore";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import apiClient from "../../api/apiClient";
import "./PatientMedicalRecordsPage.css";

export default function PatientMedicalRecordsPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");

  useEffect(() => {
    async function loadRecords() {
      try {
        setLoading(true);
        const response = await apiClient.get("/medical-records");
        if (response.data.success) {
          setMedicalRecords(response.data.data);
        } else {
          throw new Error(
            response.data.message || "Failed to fetch medical records"
          );
        }
      } catch (error) {
        console.error("Error fetching medical records:", error);
        addNotification(`Error: ${error.message}`, "error");
        setMedicalRecords([]);
      } finally {
        setLoading(false);
      }
    }
    loadRecords();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const filteredRecords = Array.isArray(medicalRecords)
    ? medicalRecords.filter((record) => {
        const matchesSearch =
          record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.treatment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.doctor?.profile?.fullName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase());

        if (filterBy === "all") return matchesSearch;
        if (filterBy === "recent") {
          const recordDate = new Date(record.date);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return matchesSearch && recordDate >= thirtyDaysAgo;
        }
        return matchesSearch;
      })
    : [];

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="medical-records-page">
      <div className="page-header">
        <h1>My Medical Records</h1>
        <p>View your complete medical history and records</p>
      </div>

      <div className="records-controls">
        <div className="search-filter-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search records, diagnoses, treatments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-section">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Records</option>
              <option value="recent">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="records-container">
        {filteredRecords.length === 0 ? (
          <div className="no-records">
            <div className="no-records-icon">📋</div>
            <h3>No Medical Records Found</h3>
            <p>
              {searchTerm
                ? "No records match your search criteria."
                : "You don't have any medical records yet. Records will appear here after your appointments."}
            </p>
          </div>
        ) : (
          <div className="records-grid">
            {filteredRecords.map((record) => (
              <div
                key={record._id}
                className="record-card"
                onClick={() => setSelectedRecord(record)}
              >
                <div className="record-header">
                  <div className="record-date">{formatDate(record.date)}</div>
                  <div className="record-doctor">
                    Dr.{" "}
                    {record.doctor?.profile?.firstName ||
                      record.doctor?.firstName}{" "}
                    {record.doctor?.profile?.lastName ||
                      record.doctor?.lastName}
                    {!record.doctor?.profile?.firstName &&
                      !record.doctor?.firstName &&
                      "Unknown Doctor"}
                  </div>
                </div>

                <div className="record-content">
                  <div className="diagnosis">
                    <strong>Diagnosis:</strong> {record.diagnosis}
                  </div>
                  {record.treatment && (
                    <div className="treatment">
                      <strong>Treatment:</strong> {record.treatment}
                    </div>
                  )}
                </div>

                {record.medications && record.medications.length > 0 && (
                  <div className="medications-preview">
                    <strong>Medications:</strong> {record.medications.length}{" "}
                    prescribed
                  </div>
                )}

                <div className="record-footer">
                  <span className="view-details">Click to view details →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Medical Record Detail Modal */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div
            className="modal-content record-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Medical Record Details</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedRecord(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="record-info-grid">
                <div className="info-section">
                  <h3>General Information</h3>
                  <div className="info-item">
                    <label>Date:</label>
                    <span>{formatDate(selectedRecord.date)}</span>
                  </div>
                  <div className="info-item">
                    <label>Doctor:</label>
                    <span>
                      Dr.{" "}
                      {selectedRecord.doctor?.profile?.firstName ||
                        selectedRecord.doctor?.firstName}{" "}
                      {selectedRecord.doctor?.profile?.lastName ||
                        selectedRecord.doctor?.lastName}
                      {!selectedRecord.doctor?.profile?.firstName &&
                        !selectedRecord.doctor?.firstName &&
                        "Unknown Doctor"}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Specialization:</label>
                    <span>
                      {selectedRecord.doctor?.specialization ||
                        selectedRecord.doctor?.profile?.specialization ||
                        "N/A"}
                    </span>
                  </div>
                </div>

                <div className="info-section">
                  <h3>Medical Details</h3>
                  <div className="info-item">
                    <label>Diagnosis:</label>
                    <span>{selectedRecord.diagnosis}</span>
                  </div>
                  {selectedRecord.treatment && (
                    <div className="info-item">
                      <label>Treatment:</label>
                      <span>{selectedRecord.treatment}</span>
                    </div>
                  )}
                  {selectedRecord.notes && (
                    <div className="info-item">
                      <label>Notes:</label>
                      <span>{selectedRecord.notes}</span>
                    </div>
                  )}
                </div>

                {selectedRecord.vitals &&
                  Object.keys(selectedRecord.vitals).length > 0 && (
                    <div className="info-section">
                      <h3>Vital Signs</h3>
                      {selectedRecord.vitals.bloodPressure && (
                        <div className="info-item">
                          <label>Blood Pressure:</label>
                          <span>{selectedRecord.vitals.bloodPressure}</span>
                        </div>
                      )}
                      {selectedRecord.vitals.heartRate && (
                        <div className="info-item">
                          <label>Heart Rate:</label>
                          <span>{selectedRecord.vitals.heartRate} bpm</span>
                        </div>
                      )}
                      {selectedRecord.vitals.temperature && (
                        <div className="info-item">
                          <label>Temperature:</label>
                          <span>{selectedRecord.vitals.temperature}°F</span>
                        </div>
                      )}
                      {selectedRecord.vitals.weight && (
                        <div className="info-item">
                          <label>Weight:</label>
                          <span>{selectedRecord.vitals.weight} lbs</span>
                        </div>
                      )}
                    </div>
                  )}

                {selectedRecord.medications &&
                  selectedRecord.medications.length > 0 && (
                    <div className="info-section medications-section">
                      <h3>Medications</h3>
                      <div className="medications-list">
                        {selectedRecord.medications.map((medication, index) => (
                          <div key={index} className="medication-item">
                            <div className="medication-name">
                              {medication.name}
                            </div>
                            <div className="medication-details">
                              <span>Dosage: {medication.dosage}</span>
                              <span>Frequency: {medication.frequency}</span>
                              {medication.duration && (
                                <span>Duration: {medication.duration}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn secondary"
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
