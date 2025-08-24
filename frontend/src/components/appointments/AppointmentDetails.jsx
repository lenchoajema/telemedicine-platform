import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate, formatTime } from "../../utils/dateUtils";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import apiClient from "../../api/apiClient";
import diagnoses from "../../data/who-diagnoses.json";
import medicines from "../../data/essential-medicines.json";
import "./AppointmentDetails.css";

export default function AppointmentDetails({
  appointment,
  onClose,
  onUpdate,
  onCreateMedicalRecord,
  initialEditMode = false,
}) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(initialEditMode);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [followUpData, setFollowUpData] = useState({
    required: appointment.followUpRequired || false,
    date: appointment.followUpDate || "",
    notes: appointment.followUpNotes || "",
  });
  // Edit form state: include reason and symptoms for patient; status and notes for doctor/admin
  const [editData, setEditData] = useState({
    reason: appointment.reason || "",
    symptoms: appointment.symptoms ? appointment.symptoms.join(", ") : "",
    status: appointment.status,
    notes: appointment.notes || "",
    earlyJoinEnabled: appointment.earlyJoinEnabled || false,
    earlyJoinVisibleAt: appointment.earlyJoinVisibleAt || "",
    earlyJoinNote: appointment.earlyJoinNote || "",
  });
  const [newDocFiles, setNewDocFiles] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);

  // New form state
  const diseaseOptions = Array.isArray(diagnoses) ? diagnoses : [];
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [newRecord, setNewRecord] = useState({
    diagnosis: "",
    medications: [{ name: "", dosage: "", frequency: "", instructions: "" }],
    notes: "",
    date: new Date().toISOString(),
  });

  const handleRecordChange = (field, value) => {
    setNewRecord((prev) => ({ ...prev, [field]: value }));
  };
  const handleMedicationChange = (index, field, value) => {
    const meds = [...newRecord.medications];
    meds[index][field] = value;
    setNewRecord((prev) => ({ ...prev, medications: meds }));
  };
  const addMedication = () => {
    setNewRecord((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        { name: "", dosage: "", frequency: "", instructions: "" },
      ],
    }));
  };
  const removeMedication = (index) => {
    setNewRecord((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };
  const saveRecord = async () => {
    try {
      const response = await apiClient.post("/medical-records", {
        patientId: appointment.patient._id,
        appointmentId: appointment._id,
        ...newRecord,
      });
      const created = response.data.record || response.data;
      addNotification("Medical record added successfully", "success");
      // Update local and parent state
      setMedicalRecord(created);
      if (onUpdate) {
        onUpdate({ ...appointment, medicalRecord: created._id });
      }
      setShowRecordForm(false);
    } catch (error) {
      console.error("Error adding medical record:", error);
      addNotification("Failed to add medical record", "error");
    }
  };

  useEffect(() => {
    if (appointment._id) {
      fetchMedicalRecord();
      fetchAuditLogs();
    }
  }, [appointment._id, appointment.medicalRecord]);

  const fetchMedicalRecord = async () => {
    if (appointment.medicalRecord) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/medical-records/${
            appointment.medicalRecord
          }`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setMedicalRecord(data.data || data);
        }
      } catch (error) {
        console.error("Error fetching medical record:", error);
      }
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/admin/audit-logs?resourceType=appointment&resourceId=${
          appointment._id
        }`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    }
  };

  const handleCompleteAppointment = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/appointments/${
          appointment._id
        }/complete`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            followUpRequired: followUpData.required,
            followUpDate: followUpData.date,
            followUpNotes: followUpData.notes,
          }),
        }
      );

      if (response.ok) {
        const updatedAppointment = await response.json();
        onUpdate(updatedAppointment.data);
        addNotification("Appointment completed successfully", "success");
        fetchAuditLogs(); // Refresh logs
      } else {
        throw new Error("Failed to complete appointment");
      }
    } catch (error) {
      addNotification(`Error: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMedicalRecord = () => {
    if (onCreateMedicalRecord) {
      onCreateMedicalRecord(appointment);
    }
  };

  const isDoctor = user?.role === "doctor";
  const isAdmin = user?.role === "admin";
  const canEdit = isDoctor && appointment.status === "scheduled";
  const canComplete = isDoctor && appointment.status === "scheduled";

  // Handler for edit form change
  const handleEditChange = (field, value) =>
    setEditData((prev) => ({ ...prev, [field]: value }));

  // Submit edit
  const handleEditSubmit = async () => {
    try {
      setLoading(true);
      let payload = {};
      // Patients can update reason, symptoms, and attach document
      if (user.role === "patient") {
        payload.reason = editData.reason;
        payload.symptoms = editData.symptoms
          ? editData.symptoms.split(",").map((s) => s.trim())
          : [];
        if (newDocFiles.length > 0) {
          const docIds = [];
          for (const file of newDocFiles) {
            const form = new FormData();
            form.append("file", file);
            form.append("patientId", appointment.patient._id);
            const upRes = await fetch(
              `${import.meta.env.VITE_API_URL}/medical-documents/upload`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: form,
              }
            );
            if (!upRes.ok) throw new Error("Document upload failed");
            const upJson = await upRes.json();
            if (upJson.data?._id) docIds.push(upJson.data._id);
          }
          if (docIds.length) payload.medicalDocumentIds = docIds;
        }
      } else {
        // Doctors/admins can update status and notes
        payload.status = editData.status;
        payload.notes = editData.notes;
        payload.earlyJoinEnabled = editData.earlyJoinEnabled;
        payload.earlyJoinVisibleAt = editData.earlyJoinVisibleAt || null;
        payload.earlyJoinNote = editData.earlyJoinNote || "";
      }
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/appointments/${appointment._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Update failed");
      }
      const result = await response.json();
      onUpdate(result.data || result);
      setEditMode(false);
    } catch (err) {
      console.error(err);
      addNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="appointment-details-modal">
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Appointment Details</h2>
            <button className="close-btn" onClick={onClose}>
              &times;
            </button>
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
                  <span>
                    {formatDate(appointment.date)} at{" "}
                    {formatTime(appointment.date)}
                  </span>
                </div>

                <div className="info-item">
                  <label>Duration:</label>
                  <span>{appointment.duration} minutes</span>
                </div>

                <div className="info-item">
                  <label>Doctor:</label>
                  <span>
                    Dr.{" "}
                    {appointment.doctor?.profile?.firstName ||
                      appointment.doctor?.firstName}{" "}
                    {appointment.doctor?.profile?.lastName ||
                      appointment.doctor?.lastName}
                    {appointment.doctor?.specialization && (
                      <span className="specialization">
                        {" "}
                        - {appointment.doctor.specialization}
                      </span>
                    )}
                  </span>
                </div>

                <div className="info-item">
                  <label>Patient:</label>
                  <span>
                    {appointment.patient?.profile?.firstName ||
                      appointment.patient?.firstName}{" "}
                    {appointment.patient?.profile?.lastName ||
                      appointment.patient?.lastName}
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
                    <span>{appointment.symptoms.join(", ")}</span>
                  </div>
                )}
                {appointment.earlyJoinEnabled && (
                  <div className="info-item full-width">
                    <label>Early Join:</label>
                    <span>
                      Enabled
                      {appointment.earlyJoinVisibleAt && (
                        <>
                          {" "}
                          (Visible At:{" "}
                          {new Date(
                            appointment.earlyJoinVisibleAt
                          ).toLocaleString()}
                          )
                        </>
                      )}
                      {appointment.earlyJoinNote && (
                        <> – {appointment.earlyJoinNote}</>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </section>{" "}
            {/* end Appointment Information section */}
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
                        onChange={(e) =>
                          setFollowUpData((prev) => ({
                            ...prev,
                            required: e.target.checked,
                          }))
                        }
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
                            onChange={(e) =>
                              setFollowUpData((prev) => ({
                                ...prev,
                                date: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>Follow-up Notes:</label>
                          <textarea
                            value={followUpData.notes}
                            onChange={(e) =>
                              setFollowUpData((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                            placeholder="Notes for follow-up appointment..."
                          />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="follow-up-display">
                    <p>
                      Follow-up Required:{" "}
                      {appointment.followUpRequired ? "Yes" : "No"}
                    </p>
                    {appointment.followUpDate && (
                      <p>
                        Follow-up Date: {formatDate(appointment.followUpDate)}
                      </p>
                    )}
                    {appointment.followUpNotes && (
                      <p>Notes: {appointment.followUpNotes}</p>
                    )}
                  </div>
                )}
              </section>
            )}
            {/* Attached Documents Section */}
            <section className="attached-documents">
              <h3>Attached Documents</h3>
              {appointment.medicalDocuments &&
              appointment.medicalDocuments.length > 0 ? (
                <ul className="document-list">
                  {appointment.medicalDocuments.map((doc) => (
                    <li key={doc._id} className="document-item">
                      <button
                        type="button"
                        className="document-link btn btn-link"
                        onClick={() => setPreviewDoc(doc)}
                      >
                        {doc.filename}
                        <span className="doc-date">
                          ({new Date(doc.createdAt).toLocaleString()})
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No documents attached.</p>
              )}
            </section>
            {/* Medical Record Section */}
            <section className="medical-record-info">
              <h3>Medical Record</h3>
              {medicalRecord ? (
                <div className="medical-record-summary">
                  <p>
                    <strong>Diagnosis:</strong> {medicalRecord.diagnosis}
                  </p>
                  <p>
                    <strong>Treatment:</strong> {medicalRecord.treatment}
                  </p>
                  {medicalRecord.prescription && (
                    <p>
                      <strong>Prescription:</strong>{" "}
                      {medicalRecord.prescription}
                    </p>
                  )}
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      navigate(`/medical-records/${medicalRecord._id}`)
                    }
                  >
                    View Full Record
                  </button>
                </div>
              ) : (
                <div className="no-medical-record">
                  {canEdit && appointment.status !== "cancelled" && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowRecordForm(true)}
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
                          <span className="log-action">
                            {log.action.replace("_", " ")}
                          </span>
                          <span className="log-timestamp">
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                        <div className="log-details">
                          <span className="log-user">
                            by {log.userId?.profile?.firstName}{" "}
                            {log.userId?.profile?.lastName} ({log.userRole})
                          </span>
                          {log.details &&
                            Object.keys(log.details).length > 0 && (
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
            {/* Inline New Record Form */}
            {showRecordForm && (
              <section className="new-medical-record-form">
                <h3>New Medical Record</h3>
                <div className="form-group">
                  <label>Diagnosis:</label>
                  <select
                    value={newRecord.diagnosis}
                    onChange={(e) =>
                      handleRecordChange("diagnosis", e.target.value)
                    }
                  >
                    <option value="">Select disease</option>
                    {diseaseOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Medications:</label>
                  <datalist id="med-list">
                    {medicines.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                  {newRecord.medications.map((med, idx) => (
                    <div key={idx} className="med-row">
                      <input
                        list="med-list"
                        placeholder="Medication"
                        value={med.name}
                        onChange={(e) =>
                          handleMedicationChange(idx, "name", e.target.value)
                        }
                      />
                      <input
                        placeholder="Dosage"
                        value={med.dosage}
                        onChange={(e) =>
                          handleMedicationChange(idx, "dosage", e.target.value)
                        }
                      />
                      <input
                        placeholder="Frequency"
                        value={med.frequency}
                        onChange={(e) =>
                          handleMedicationChange(
                            idx,
                            "frequency",
                            e.target.value
                          )
                        }
                      />
                      <input
                        placeholder="Instructions"
                        value={med.instructions}
                        onChange={(e) =>
                          handleMedicationChange(
                            idx,
                            "instructions",
                            e.target.value
                          )
                        }
                      />
                      {newRecord.medications.length > 1 && (
                        <button onClick={() => removeMedication(idx)}>
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button className="btn btn-secondary" onClick={addMedication}>
                    Add Medication
                  </button>
                </div>
                <div className="form-group">
                  <label>Notes:</label>
                  <textarea
                    value={newRecord.notes}
                    onChange={(e) =>
                      handleRecordChange("notes", e.target.value)
                    }
                  />
                </div>
                <div className="form-actions">
                  <button className="btn btn-primary" onClick={saveRecord}>
                    Save Record
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowRecordForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </section>
            )}
            {/* Document Preview */}
            {previewDoc && (
              <section className="document-preview">
                <h4>Preview: {previewDoc.filename}</h4>
                {previewDoc.mimeType.startsWith("image/") ? (
                  <img
                    src={previewDoc.fileUrl}
                    alt={previewDoc.filename}
                    className="preview-img"
                  />
                ) : (
                  <iframe
                    src={previewDoc.fileUrl}
                    title={previewDoc.filename}
                    className="preview-iframe"
                  />
                )}
                <button
                  className="btn btn-secondary"
                  onClick={() => setPreviewDoc(null)}
                >
                  Close Preview
                </button>
              </section>
            )}
          </div>

          {/* Edit form if in editMode */}
          {editMode && (
            <section className="edit-appointment-form">
              <h3>Edit Appointment</h3>
              {/* Patient can edit reason, symptoms, and attach a document */}
              {user.role === "patient" && (
                <>
                  <div className="form-group">
                    <label>Reason:</label>
                    <input
                      type="text"
                      value={editData.reason}
                      onChange={(e) =>
                        handleEditChange("reason", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Symptoms:</label>
                    <input
                      type="text"
                      value={editData.symptoms}
                      onChange={(e) =>
                        handleEditChange("symptoms", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Attach Documents:</label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) =>
                        setNewDocFiles(Array.from(e.target.files))
                      }
                    />
                    {newDocFiles.length > 0 && (
                      <ul className="selected-files-list">
                        {newDocFiles.map((file, idx) => (
                          <li key={idx}>{file.name}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
              {/* Doctor/Admin can edit status and notes */}
              <div className="form-group">
                <label>Status:</label>
                <select
                  value={editData.status}
                  onChange={(e) => handleEditChange("status", e.target.value)}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  value={editData.notes}
                  onChange={(e) => handleEditChange("notes", e.target.value)}
                />
              </div>
              {(isDoctor || isAdmin) && (
                <>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={editData.earlyJoinEnabled}
                        onChange={(e) =>
                          handleEditChange("earlyJoinEnabled", e.target.checked)
                        }
                      />{" "}
                      Enable Early Join
                    </label>
                    <small>Allow patient to access waiting room earlier.</small>
                  </div>
                  {editData.earlyJoinEnabled && (
                    <>
                      <div className="form-group">
                        <label>Early Join Visible At (optional)</label>
                        <input
                          type="datetime-local"
                          value={
                            editData.earlyJoinVisibleAt
                              ? new Date(editData.earlyJoinVisibleAt)
                                  .toISOString()
                                  .slice(0, 16)
                              : ""
                          }
                          onChange={(e) =>
                            handleEditChange(
                              "earlyJoinVisibleAt",
                              e.target.value
                                ? new Date(e.target.value).toISOString()
                                : ""
                            )
                          }
                        />
                        <small>
                          Leave blank to allow up to 4h early access
                          immediately.
                        </small>
                      </div>
                      <div className="form-group">
                        <label>Early Join Note (optional)</label>
                        <textarea
                          value={editData.earlyJoinNote}
                          onChange={(e) =>
                            handleEditChange("earlyJoinNote", e.target.value)
                          }
                          placeholder="Message shown to patient in waiting room"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleEditSubmit}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </button>
              </div>
            </section>
          )}

          <div className="modal-footer">
            {!editMode && canEdit && appointment.status === "scheduled" && (
              <button
                className="btn btn-primary"
                onClick={() => setEditMode(true)}
              >
                Edit Appointment
              </button>
            )}
            {canComplete && (
              <button
                className="btn btn-success"
                onClick={handleCompleteAppointment}
                disabled={loading}
              >
                {loading ? "Completing..." : "Complete Appointment"}
              </button>
            )}

            {appointment.meetingUrl && appointment.status === "scheduled" && (
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
