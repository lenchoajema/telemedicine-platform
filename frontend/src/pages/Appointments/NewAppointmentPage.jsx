import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContextCore";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import apiClient from "../../services/apiClient";
import { fetchAllDoctors } from "../../services/doctorService";
import AppointmentService from "../../api/AppointmentService";
import "./NewAppointmentPage.css";

export default function NewAppointmentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [step, setStep] = useState(1); // 1: Select Doctor, 2: Select Time, 3: Confirm

  const [appointmentData, setAppointmentData] = useState({
    doctorId: searchParams.get("doctorId") || "",
    date: "",
    timeSlot: "",
    reason: "",
    symptoms: "",
    notes: "",
    type: "consultation",
  });

  // On mount, fetch doctors
  useEffect(() => {
    fetchDoctors();
  }, []);

  // On mount, handle pre-selected doctor from URL
  useEffect(() => {
    const preselectedDoctorId = searchParams.get("doctorId");
    if (preselectedDoctorId) {
      // Load doctor details and initial slots
      fetchDoctorById(preselectedDoctorId);
      const tomorrow = getTomorrowDate();
      setAppointmentData((prev) => ({
        ...prev,
        doctorId: preselectedDoctorId,
        date: tomorrow,
        timeSlot: "",
      }));
      setStep(2);
      fetchAvailableSlots(preselectedDoctorId, tomorrow);
    }
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const normalized = await fetchAllDoctors();
      setDoctors(normalized);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      addNotification(`Error: ${error.message}`, "error");
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorById = async (doctorId) => {
    try {
      const response = await apiClient.get(`/doctors/${doctorId}`);
      // API returns { success: true, data: doctor }
      const doctor = response.data?.data || response.data;
      setSelectedDoctor(doctor);
      // Do not override step here; handled by caller to avoid race conditions
    } catch (error) {
      console.error("Error fetching doctor:", error);
    }
  };

  const fetchAvailableSlots = useCallback(
    async (doctorId, dateString) => {
      if (!doctorId || !dateString) return;
      try {
        setSlotsLoading(true);
        const dateObj = new Date(dateString);
        console.log(
          `Fetching available slots (service) doctor=${doctorId} date=${dateString}`
        );
        const slots = await AppointmentService.getAvailableSlots(
          dateObj,
          doctorId
        );
        setAvailableSlots(slots || []);
        if (!slots || slots.length === 0)
          addNotification("No available slots for the selected date.", "info");
      } catch (error) {
        console.error("Error fetching available slots:", error);
        addNotification(`Error: ${error.message}`, "error");
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    [addNotification]
  );

  const handleDoctorSelect = (doctor) => {
    const docId = doctor.doctorId || doctor.doctorDocId || doctor._id; // prefer Doctor model id
    setSelectedDoctor({ ...doctor, resolvedDoctorId: docId });
    fetchDoctorById(docId);
    const tomorrow = getTomorrowDate();
    setAppointmentData((prev) => ({
      ...prev,
      doctorId: docId,
      date: tomorrow,
      timeSlot: "",
    }));
    setStep(2);
    fetchAvailableSlots(docId, tomorrow);
  };

  const handleDateChange = (date) => {
    setAppointmentData((prev) => ({ ...prev, date, timeSlot: "" }));
    if (selectedDoctor || appointmentData.doctorId) {
      const docId =
        appointmentData.doctorId ||
        selectedDoctor?.resolvedDoctorId ||
        selectedDoctor?._id;
      if (docId) fetchAvailableSlots(docId, date);
    }
  };

  // If doctorId + date set via URL params or state changes later, ensure slots stay in sync
  useEffect(() => {
    if (appointmentData.doctorId && appointmentData.date) {
      fetchAvailableSlots(appointmentData.doctorId, appointmentData.date);
    }
  }, [appointmentData.doctorId, appointmentData.date, fetchAvailableSlots]);

  // Select a time slot (object or raw string) and proceed to confirmation step
  const handleTimeSlotSelect = (timeSlot) => {
    // Determine display time and identifier for slot
    const selectedTime = timeSlot.startTime || timeSlot;
    const slotIdentifier = timeSlot.id || timeSlot._id || selectedTime;
    setAppointmentData((prev) => ({
      ...prev,
      timeSlot: selectedTime,
      slotId: slotIdentifier,
      slotHash: timeSlot.slotHash, // capture integrity token
    }));
    // After selecting time slot, proceed to confirmation step
    setStep(3);
  };

  // Book the appointment using API client
  const handleBookAppointment = async () => {
    try {
      setBookingLoading(true);
      const requestBody = {
        doctorId: appointmentData.doctorId,
        reason: appointmentData.reason,
        symptoms: appointmentData.symptoms
          ? appointmentData.symptoms.split(",").map((s) => s.trim())
          : [],
        caseDetails: appointmentData.notes,
        slotId: appointmentData.slotId,
        slotHash: appointmentData.slotHash, // required by backend for integrity
      };
      // Upload each selected file and collect IDs
      if (selectedFiles.length > 0) {
        const docIds = [];
        for (const file of selectedFiles) {
          const uploadData = new FormData();
          uploadData.append("file", file);
          uploadData.append("patientId", user._id);
          const uploadRes = await apiClient.post(
            "/medical-documents/upload",
            uploadData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          if (uploadRes.data?.success && uploadRes.data.data?._id) {
            docIds.push(uploadRes.data.data._id);
          }
        }
        if (docIds.length) {
          requestBody.medicalDocumentIds = docIds;
        }
      }
      console.log("Booking appointment with data:", requestBody);
      const response = await apiClient.post("/appointments", requestBody);
      const data = response.data;
      addNotification(
        data?.message || "Appointment booked successfully!",
        "success"
      );
      navigate("/appointments");
    } catch (error) {
      console.error("Error booking appointment:", error);
      const serverMsg =
        error?.response?.data?.message || error?.response?.data?.error;
      addNotification(
        serverMsg ? `Error: ${serverMsg}` : `Error: ${error.message}`,
        "error"
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="new-appointment-page">
      <div className="page-header">
        <h1>Book New Appointment</h1>
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? "active" : ""}`}>
            1. Select Doctor
          </div>
          <div className={`step ${step >= 2 ? "active" : ""}`}>
            2. Choose Time
          </div>
          <div className={`step ${step >= 3 ? "active" : ""}`}>3. Confirm</div>
        </div>
      </div>

      {step === 1 && (
        <div className="doctor-selection">
          <h2>Select a Doctor</h2>
          <div className="doctors-grid">
            {(Array.isArray(doctors) &&
              doctors.map((doctor) => (
                <div
                  key={doctor._id}
                  className="doctor-card selectable"
                  onClick={() => handleDoctorSelect(doctor)}
                >
                  <div className="doctor-avatar">
                    <img
                      src={doctor.user?.profile?.photo || "/default-doctor.png"}
                      alt={doctor.user?.profile?.fullName || "Doctor"}
                      onError={(e) => {
                        e.target.src = "/default-doctor.png";
                      }}
                    />
                  </div>
                  <div className="doctor-info">
                    <h3>{doctor.user?.profile?.fullName || "Dr. Anonymous"}</h3>
                    <p className="specialization">
                      {doctor.specialization || "General"}
                    </p>
                    {doctor.experience && (
                      <p className="experience">
                        {doctor.experience} years experience
                      </p>
                    )}
                    {doctor.bio && <p className="bio">{doctor.bio}</p>}
                  </div>
                  <div className="select-button">
                    <button className="btn primary">Select Doctor</button>
                  </div>
                </div>
              ))) || (
              <div className="no-doctors">
                <p>
                  No doctors are available at the moment. Please check back
                  later.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && selectedDoctor && (
        <div className="time-selection">
          <div className="selected-doctor-info">
            <h2>Selected Doctor</h2>
            <div className="doctor-summary">
              <img
                src={
                  selectedDoctor.user?.profile?.photo || "/default-doctor.png"
                }
                alt={
                  selectedDoctor.user?.profile?.fullName ||
                  `${selectedDoctor.user?.profile?.firstName} ${selectedDoctor.user?.profile?.lastName}`
                }
                onError={(e) => {
                  e.target.src = "/default-doctor.png";
                }}
              />
              <div>
                <h3>
                  {selectedDoctor.user?.profile?.fullName ||
                    `${selectedDoctor.user?.profile?.firstName} ${selectedDoctor.user?.profile?.lastName}`}
                </h3>
                <p>{selectedDoctor.specialization}</p>
              </div>
              <button className="btn secondary" onClick={() => setStep(1)}>
                Change Doctor
              </button>
            </div>
          </div>

          <div className="date-time-selection">
            <h3>Select Date and Time</h3>

            <div className="date-selection">
              <label>Select Date:</label>
              <input
                type="date"
                min={getTomorrowDate()}
                value={appointmentData.date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="date-input"
              />
            </div>

            {appointmentData.date && (
              <div className="time-slots">
                <label>Available Time Slots:</label>
                {slotsLoading ? (
                  <LoadingSpinner />
                ) : (
                  <div className="slots-grid">
                    {availableSlots.length > 0 ? (
                      availableSlots.map((slot, index) => {
                        const timeDisplay = slot.startTime || slot;
                        const isSelected =
                          appointmentData.timeSlot === timeDisplay;
                        const isAvailable = slot.isAvailable !== false;

                        return (
                          <button
                            key={
                              slot.id ||
                              slot._id ||
                              `${timeDisplay}-${slot.endTime || ""}` ||
                              index
                            }
                            className={`time-slot ${
                              isSelected ? "selected" : ""
                            } ${!isAvailable ? "unavailable" : ""}`}
                            onClick={() => handleTimeSlotSelect(slot)}
                            disabled={!isAvailable}
                          >
                            {timeDisplay}
                            {slot.endTime && (
                              <span className="slot-duration">
                                {" "}
                                - {slot.endTime}
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <p>No available slots for this date.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="appointment-confirmation">
          <h2>Appointment Details</h2>

          <div className="appointment-summary">
            <div className="summary-section">
              <h3>Doctor Information</h3>
              <div className="doctor-summary">
                <img
                  src={
                    selectedDoctor.user?.profile?.photo || "/default-doctor.png"
                  }
                  alt={
                    selectedDoctor.user?.profile?.fullName ||
                    `${selectedDoctor.user?.profile?.firstName} ${selectedDoctor.user?.profile?.lastName}`
                  }
                  onError={(e) => {
                    e.target.src = "/default-doctor.png";
                  }}
                />
                <div>
                  <h4>
                    {selectedDoctor.user?.profile?.fullName ||
                      `${selectedDoctor.user?.profile?.firstName} ${selectedDoctor.user?.profile?.lastName}`}
                  </h4>
                  <p>{selectedDoctor.specialization}</p>
                </div>
              </div>
            </div>

            <div className="summary-section">
              <h3>Appointment Details</h3>
              <div className="appointment-details">
                <div className="detail-item">
                  <label>Date:</label>
                  <span>
                    {new Date(appointmentData.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Time:</label>
                  <span>{appointmentData.timeSlot}</span>
                </div>
                <div className="detail-item">
                  <label>Duration:</label>
                  <span>30 minutes</span>
                </div>
              </div>
            </div>
          </div>

          <div className="appointment-form">
            <div className="form-group">
              <label htmlFor="reason">Reason for Visit *</label>
              <input
                type="text"
                id="reason"
                value={appointmentData.reason}
                onChange={(e) =>
                  setAppointmentData({
                    ...appointmentData,
                    reason: e.target.value,
                  })
                }
                placeholder="Brief description of your concern"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="symptoms">Symptoms</label>
              <input
                type="text"
                id="symptoms"
                value={appointmentData.symptoms}
                onChange={(e) =>
                  setAppointmentData({
                    ...appointmentData,
                    symptoms: e.target.value,
                  })
                }
                placeholder="Comma-separated symptoms"
              />
            </div>
            {/* Upload medical document (PHI) */}
            <div className="form-group">
              <label htmlFor="medicalDocument">Upload Medical Document</label>
              <input
                type="file"
                id="medicalDocument"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                multiple
                onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
              />
              {selectedFiles.length > 0 && (
                <div>
                  <p>Selected files:</p>
                  <ul>
                    {selectedFiles.map((file, idx) => (
                      <li key={idx}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="type">Appointment Type</label>
              <select
                id="type"
                value={appointmentData.type}
                onChange={(e) =>
                  setAppointmentData({
                    ...appointmentData,
                    type: e.target.value,
                  })
                }
              >
                <option value="consultation">Consultation</option>
                <option value="follow-up">Follow-up</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional Notes</label>
              <textarea
                id="notes"
                value={appointmentData.notes}
                onChange={(e) =>
                  setAppointmentData({
                    ...appointmentData,
                    notes: e.target.value,
                  })
                }
                placeholder="Any additional information or symptoms..."
                rows="4"
              />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn secondary" onClick={() => setStep(2)}>
              Back
            </button>
            <button
              className="btn primary"
              onClick={handleBookAppointment}
              disabled={bookingLoading || !appointmentData.reason.trim()}
            >
              {bookingLoading ? "Booking..." : "Book Appointment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
