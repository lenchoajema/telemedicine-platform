import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContextCore';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import './NewAppointmentPage.css';

export default function NewAppointmentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Doctor, 2: Select Time, 3: Confirm
  
  const [appointmentData, setAppointmentData] = useState({
    doctorId: searchParams.get('doctorId') || '',
    date: '',
    timeSlot: '',
    reason: '',
    notes: '',
    type: 'consultation'
  });

  useEffect(() => {
    fetchDoctors();
    if (appointmentData.doctorId) {
      // If doctor is pre-selected (from query params), find and set it
      fetchDoctorById(appointmentData.doctorId);
    }
  }, [appointmentData.doctorId]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      console.log('Fetching doctors...');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/doctors`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }

      const data = await response.json();
      console.log('Doctors API response:', data);
      
      // Handle different response formats
      let doctorsArray = [];
      if (Array.isArray(data)) {
        doctorsArray = data;
      } else if (data && data.success && Array.isArray(data.data)) {
        doctorsArray = data.data;
      } else if (data && Array.isArray(data.data)) {
        doctorsArray = data.data;
      }
      
      console.log('Processed doctors array:', doctorsArray);
      setDoctors(doctorsArray);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      addNotification(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorById = async (doctorId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/doctors/${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const doctor = await response.json();
        setSelectedDoctor(doctor);
        setStep(2);
      }
    } catch (error) {
      console.error('Error fetching doctor:', error);
    }
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/doctors/availability?doctorId=${doctorId}&date=${date}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const slots = await response.json();
        setAvailableSlots(slots || []);
      } else {
        // Generate default slots if availability endpoint doesn't work
        generateDefaultSlots();
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      generateDefaultSlots();
    }
  };

  const generateDefaultSlots = () => {
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    setAvailableSlots(slots);
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setAppointmentData({ ...appointmentData, doctorId: doctor._id });
    setStep(2);
  };

  const handleDateChange = (date) => {
    setAppointmentData({ ...appointmentData, date, timeSlot: '' });
    if (selectedDoctor) {
      fetchAvailableSlots(selectedDoctor._id, date);
    }
  };

  const handleTimeSlotSelect = (timeSlot) => {
    setAppointmentData({ ...appointmentData, timeSlot });
    setStep(3);
  };

  const handleBookAppointment = async () => {
    if (!appointmentData.reason.trim()) {
      addNotification('Please provide a reason for the appointment', 'error');
      return;
    }

    try {
      setBookingLoading(true);
      
      const appointmentDateTime = new Date(`${appointmentData.date}T${appointmentData.timeSlot}`);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          doctorId: appointmentData.doctorId,
          date: appointmentDateTime.toISOString(),
          reason: appointmentData.reason,
          symptoms: appointmentData.notes, // Backend expects 'symptoms' field
          duration: 30
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book appointment');
      }

      addNotification('Appointment booked successfully!', 'success');
      navigate('/appointments');
    } catch (error) {
      console.error('Error booking appointment:', error);
      addNotification(`Error: ${error.message}`, 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="new-appointment-page">
      <div className="page-header">
        <h1>Book New Appointment</h1>
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Select Doctor</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Choose Time</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Confirm</div>
        </div>
      </div>

      {step === 1 && (
        <div className="doctor-selection">
          <h2>Select a Doctor</h2>
          <div className="doctors-grid">
            {Array.isArray(doctors) && doctors.map(doctor => (
              <div 
                key={doctor._id}
                className="doctor-card selectable"
                onClick={() => handleDoctorSelect(doctor)}
              >
                <div className="doctor-avatar">
                  <img 
                    src={doctor.user?.profile?.photo || '/default-doctor.png'} 
                    alt={doctor.user?.profile?.fullName || `${doctor.user?.profile?.firstName} ${doctor.user?.profile?.lastName}`}
                    onError={(e) => {
                      e.target.src = '/default-doctor.png';
                    }}
                  />
                </div>
                <div className="doctor-info">
                  <h3>{doctor.user?.profile?.fullName || `${doctor.user?.profile?.firstName} ${doctor.user?.profile?.lastName}`}</h3>
                  <p className="specialization">{doctor.specialization}</p>
                  {doctor.experience && (
                    <p className="experience">{doctor.experience} years experience</p>
                  )}
                  {doctor.bio && (
                    <p className="bio">{doctor.bio}</p>
                  )}
                </div>
                <div className="select-button">
                  <button className="btn primary">Select Doctor</button>
                </div>
              </div>
            )) || <div className="no-doctors">No doctors available</div>}
          </div>
        </div>
      )}

      {step === 2 && selectedDoctor && (
        <div className="time-selection">
          <div className="selected-doctor-info">
            <h2>Selected Doctor</h2>
            <div className="doctor-summary">
              <img 
                src={selectedDoctor.user?.profile?.photo || '/default-doctor.png'} 
                alt={selectedDoctor.user?.profile?.fullName || `${selectedDoctor.user?.profile?.firstName} ${selectedDoctor.user?.profile?.lastName}`}
                onError={(e) => {
                  e.target.src = '/default-doctor.png';
                }}
              />
              <div>
                <h3>{selectedDoctor.user?.profile?.fullName || `${selectedDoctor.user?.profile?.firstName} ${selectedDoctor.user?.profile?.lastName}`}</h3>
                <p>{selectedDoctor.specialization}</p>
              </div>
              <button 
                className="btn secondary"
                onClick={() => setStep(1)}
              >
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
                <div className="slots-grid">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      className={`time-slot ${appointmentData.timeSlot === slot ? 'selected' : ''}`}
                      onClick={() => handleTimeSlotSelect(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
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
                  src={selectedDoctor.user?.profile?.photo || '/default-doctor.png'} 
                  alt={selectedDoctor.user?.profile?.fullName || `${selectedDoctor.user?.profile?.firstName} ${selectedDoctor.user?.profile?.lastName}`}
                  onError={(e) => {
                    e.target.src = '/default-doctor.png';
                  }}
                />
                <div>
                  <h4>{selectedDoctor.user?.profile?.fullName || `${selectedDoctor.user?.profile?.firstName} ${selectedDoctor.user?.profile?.lastName}`}</h4>
                  <p>{selectedDoctor.specialization}</p>
                </div>
              </div>
            </div>

            <div className="summary-section">
              <h3>Appointment Details</h3>
              <div className="appointment-details">
                <div className="detail-item">
                  <label>Date:</label>
                  <span>{new Date(appointmentData.date).toLocaleDateString()}</span>
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
                onChange={(e) => setAppointmentData({ ...appointmentData, reason: e.target.value })}
                placeholder="Brief description of your concern"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Appointment Type</label>
              <select
                id="type"
                value={appointmentData.type}
                onChange={(e) => setAppointmentData({ ...appointmentData, type: e.target.value })}
              >
                <option value="consultation">Consultation</option>
                <option value="follow-up">Follow-up</option>
                <option value="check-up">Check-up</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional Notes</label>
              <textarea
                id="notes"
                value={appointmentData.notes}
                onChange={(e) => setAppointmentData({ ...appointmentData, notes: e.target.value })}
                placeholder="Any additional information or symptoms..."
                rows="4"
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              className="btn secondary"
              onClick={() => setStep(2)}
            >
              Back
            </button>
            <button 
              className="btn primary"
              onClick={handleBookAppointment}
              disabled={bookingLoading || !appointmentData.reason.trim()}
            >
              {bookingLoading ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
