import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContextCore';
import apiClient from '../../api/apiClient';
import './DoctorPages.css';

export default function DoctorPatientsPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/doctors/my-patients');
      setPatients(response.data.patients || response.data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('Failed to load patients');
      addNotification('Failed to load patients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientMedicalRecords = async (patientId) => {
    try {
      const response = await apiClient.get(`/medical-records?patientId=${patientId}`);
      setMedicalRecords(response.data.records || response.data || []);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      addNotification('Failed to load medical records', 'error');
    }
  };

  const addMedicalRecord = async (patientId, recordData) => {
    try {
      await apiClient.post('/medical-records', {
        patientId,
        ...recordData
      });
      addNotification('Medical record added successfully', 'success');
      fetchPatientMedicalRecords(patientId);
    } catch (error) {
      console.error('Error adding medical record:', error);
      addNotification('Failed to add medical record', 'error');
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openPatientDetails = (patient) => {
    setSelectedPatient(patient);
    fetchPatientMedicalRecords(patient._id);
  };

  const closePatientDetails = () => {
    setSelectedPatient(null);
    setMedicalRecords([]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="doctor-page">
        <div className="loading-spinner"></div>
        <p>Loading patients...</p>
      </div>
    );
  }

  return (
    <div className="doctor-page">
      <div className="page-header">
        <h1>My Patients</h1>
        <p>Manage your patient records and medical history</p>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchPatients}>Retry</button>
        </div>
      )}

      <div className="patients-search">
        <input
          type="text"
          placeholder="Search patients by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="patients-list">
        {filteredPatients.length === 0 ? (
          <div className="empty-state">
            <p>No patients found.</p>
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div key={patient._id} className="patient-card">
              <div className="patient-info">
                <h3>{patient.firstName} {patient.lastName}</h3>
                <p className="patient-email">{patient.email}</p>
                <p className="patient-phone">{patient.phone || 'No phone number'}</p>
                <p className="patient-dob">
                  DOB: {patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'Not provided'}
                </p>
              </div>
              <div className="patient-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => openPatientDetails(patient)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="modal-overlay">
          <div className="modal-content patient-details-modal">
            <div className="modal-header">
              <h2>{selectedPatient.firstName} {selectedPatient.lastName}</h2>
              <button className="close-btn" onClick={closePatientDetails}>×</button>
            </div>

            <div className="modal-body">
              <div className="patient-info-section">
                <h3>Patient Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Email:</strong> {selectedPatient.email}
                  </div>
                  <div className="info-item">
                    <strong>Phone:</strong> {selectedPatient.phone || 'Not provided'}
                  </div>
                  <div className="info-item">
                    <strong>Date of Birth:</strong> 
                    {selectedPatient.dateOfBirth ? formatDate(selectedPatient.dateOfBirth) : 'Not provided'}
                  </div>
                  <div className="info-item">
                    <strong>Gender:</strong> {selectedPatient.gender || 'Not specified'}
                  </div>
                  <div className="info-item">
                    <strong>Address:</strong> {selectedPatient.address || 'Not provided'}
                  </div>
                </div>
              </div>

              <div className="medical-records-section">
                <div className="section-header">
                  <h3>Medical Records</h3>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      const diagnosis = prompt('Enter diagnosis:');
                      const treatment = prompt('Enter treatment:');
                      const notes = prompt('Enter notes:');
                      if (diagnosis) {
                        addMedicalRecord(selectedPatient._id, {
                          diagnosis,
                          treatment,
                          notes,
                          date: new Date().toISOString()
                        });
                      }
                    }}
                  >
                    Add Record
                  </button>
                </div>

                <div className="medical-records-list">
                  {medicalRecords.length === 0 ? (
                    <p>No medical records found.</p>
                  ) : (
                    medicalRecords.map((record) => (
                      <div key={record._id} className="medical-record-card">
                        <div className="record-header">
                          <h4>{record.diagnosis}</h4>
                          <span className="record-date">{formatDate(record.date)}</span>
                        </div>
                        <div className="record-content">
                          {record.treatment && (
                            <p><strong>Treatment:</strong> {record.treatment}</p>
                          )}
                          {record.notes && (
                            <p><strong>Notes:</strong> {record.notes}</p>
                          )}
                          {record.prescription && (
                            <p><strong>Prescription:</strong> {record.prescription}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closePatientDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
