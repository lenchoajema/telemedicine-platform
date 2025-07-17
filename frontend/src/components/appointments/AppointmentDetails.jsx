import React, { useState, useEffect } from 'react';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

export default function AppointmentDetails({ 
  appointment, 
  onClose, 
  onUpdate,
  onCreateMedicalRecord 
}) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [followUpData, setFollowUpData] = useState({
    required: appointment.followUpRequired || false,
    date: appointment.followUpDate || '',
    notes: appointment.followUpNotes || ''
  });

  useEffect(() => {
    if (appointment._id) {
      fetchMedicalRecord();
      fetchAuditLogs();
    }
  }, [appointment._id]);

  const fetchMedicalRecord = async () => {
    if (appointment.medicalRecord) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/medical-records/${appointment.medicalRecord}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setMedicalRecord(data.data || data);
        }
      } catch (error) {
        console.error('Error fetching medical record:', error);
      }
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/audit-logs?resourceType=appointment&resourceId=${appointment._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const handleCompleteAppointment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/appointments/${appointment._id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          followUpRequired: followUpData.required,
          followUpDate: followUpData.date,
          followUpNotes: followUpData.notes
        })
      });

      if (response.ok) {
        const updatedAppointment = await response.json();
        onUpdate(updatedAppointment.data);
        addNotification('Appointment completed successfully', 'success');
        fetchAuditLogs(); // Refresh logs
      } else {
        throw new Error('Failed to complete appointment');
      }
    } catch (error) {
      addNotification(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMedicalRecord = () => {
    if (onCreateMedicalRecord) {
      onCreateMedicalRecord(appointment);
    }
  };

  const isDoctor = user?.role === 'doctor';
  const isAdmin = user?.role === 'admin';
  const canEdit = isDoctor && appointment.status === 'scheduled';
  const canComplete = isDoctor && appointment.status === 'scheduled';

  return (
    <div className="appointment-details-modal">
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Appointment Details</h2>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>

          <div className="modal-body">
            {/* Basic Appointment Information */}
            <section className="appointment-info">
              <h3>Appointment Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Status:</label>
                  <span className={`status-badge ${appointment.status}`}>
                    {appointment.status}
                  </span>
                </div>
                
                <div className="info-item">
                  <label>Date & Time:</label>
                  <span>{formatDate(appointment.date)} at {formatTime(appointment.date)}</span>
                </div>
                
                <div className="info-item">
                  <label>Duration:</label>
                  <span>{appointment.duration} minutes</span>
                </div>

                <div className="info-item">
                  <label>Doctor:</label>
                  <span>
                    Dr. {appointment.doctor?.profile?.firstName || appointment.doctor?.firstName}{' '}
                    {appointment.doctor?.profile?.lastName || appointment.doctor?.lastName}
                    {appointment.doctor?.specialization && (
                      <span className="specialization"> - {appointment.doctor.specialization}</span>
                    )}
                  </span>
                </div>

                <div className="info-item">
                  <label>Patient:</label>
                  <span>
                    {appointment.patient?.profile?.firstName || appointment.patient?.firstName}{' '}
                    {appointment.patient?.profile?.lastName || appointment.patient?.lastName}
                  </span>
                </div>

                {appointment.reason && (
                  <div className="info-item full-width">
                    <label>Reason for Visit:</label>
                    <span>{appointment.reason}</span>
                  </div>
                )}

                {appointment.symptoms && appointment.symptoms.length > 0 && (
                  <div className="info-item full-width">
                    <label>Symptoms:</label>
                    <span>{appointment.symptoms.join(', ')}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Follow-up Information */}
            {(appointment.followUpRequired || canEdit) && (
              <section className="follow-up-info">
                <h3>Follow-up Information</h3>
                {canEdit ? (
                  <div className="follow-up-form">
                    <label>
                      <input
                        type="checkbox"
                        checked={followUpData.required}
                        onChange={(e) => setFollowUpData(prev => ({ ...prev, required: e.target.checked }))}
                      />
                      Follow-up appointment required
                    </label>
                    
                    {followUpData.required && (
                      <>
                        <div className="form-group">
                          <label>Follow-up Date:</label>
                          <input
                            type="date"
                            value={followUpData.date}
                            onChange={(e) => setFollowUpData(prev => ({ ...prev, date: e.target.value }))}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Follow-up Notes:</label>
                          <textarea
                            value={followUpData.notes}
                            onChange={(e) => setFollowUpData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Notes for follow-up appointment..."
                          />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="follow-up-display">
                    <p>Follow-up Required: {appointment.followUpRequired ? 'Yes' : 'No'}</p>
                    {appointment.followUpDate && (
                      <p>Follow-up Date: {formatDate(appointment.followUpDate)}</p>
                    )}
                    {appointment.followUpNotes && (
                      <p>Notes: {appointment.followUpNotes}</p>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Medical Record Section */}
            <section className="medical-record-info">
              <h3>Medical Record</h3>
              {medicalRecord ? (
                <div className="medical-record-summary">
                  <p><strong>Diagnosis:</strong> {medicalRecord.diagnosis}</p>
                  <p><strong>Treatment:</strong> {medicalRecord.treatment}</p>
                  {medicalRecord.prescription && (
                    <p><strong>Prescription:</strong> {medicalRecord.prescription}</p>
                  )}
                  <button className="btn btn-secondary">View Full Record</button>
                </div>
              ) : (
                <div className="no-medical-record">
                  <p>No medical record created for this appointment.</p>
                  {canEdit && appointment.status !== 'cancelled' && (
                    <button 
                      className="btn btn-primary"
                      onClick={handleCreateMedicalRecord}
                    >
                      Create Medical Record
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Audit Logs - Admin and Doctor only */}
            {(isAdmin || isDoctor) && (
              <section className="audit-logs">
                <h3>Activity History</h3>
                <div className="audit-log-list">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log, index) => (
                      <div key={index} className="audit-log-item">
                        <div className="log-header">
                          <span className="log-action">{log.action.replace('_', ' ')}</span>
                          <span className="log-timestamp">{formatDate(log.timestamp)}</span>
                        </div>
                        <div className="log-details">
                          <span className="log-user">
                            by {log.userId?.profile?.firstName} {log.userId?.profile?.lastName} ({log.userRole})
                          </span>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="log-extra">
                              {JSON.stringify(log.details, null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No activity history available</p>
                  )}
                </div>
              </section>
            )}
          </div>

          <div className="modal-footer">
            {canComplete && (
              <button 
                className="btn btn-success"
                onClick={handleCompleteAppointment}
                disabled={loading}
              >
                {loading ? 'Completing...' : 'Complete Appointment'}
              </button>
            )}
            
            {appointment.meetingUrl && appointment.status === 'scheduled' && (
              <a 
                href={appointment.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Join Call
              </a>
            )}
            
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
