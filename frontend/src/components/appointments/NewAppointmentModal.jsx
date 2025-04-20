import { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';

export default function NewAppointmentModal({ 
  onClose, 
  onCreate, 
  availableSlots,
  selectedDate 
}) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    doctorId: '',
    date: selectedDate,
    slot: '',
    reason: '',
    symptoms: '',
    duration: 30
  });

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/doctors`);
        if (!response.ok) throw new Error('Failed to fetch doctors');
        const data = await response.json();
        setDoctors(data);
      } catch (error) {
        console.error('Error fetching doctors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.doctorId || !formData.slot) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          doctorId: formData.doctorId,
          date: new Date(formData.slot),
          duration: formData.duration,
          reason: formData.reason,
          symptoms: formData.symptoms ? formData.symptoms.split(',').map(s => s.trim()) : []
        })
      });

      if (!response.ok) throw new Error('Failed to create appointment');
      
      const appointment = await response.json();
      onCreate(appointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Schedule New Appointment</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="appointment-form">
          <div className="form-group">
            <label>Select Doctor:</label>
            <select 
              name="doctorId" 
              value={formData.doctorId}
              onChange={handleChange}
              required
            >
              <option value="">-- Select a doctor --</option>
              {doctors.map(doctor => (
                <option key={doctor._id} value={doctor._id}>
                  Dr. {doctor.profile.firstName} {doctor.profile.lastName} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Date:</label>
            <div className="selected-date">{formatDate(selectedDate)}</div>
          </div>
          
          <div className="form-group">
            <label>Available Slots:</label>
            <select 
              name="slot"
              value={formData.slot}
              onChange={handleChange}
              required
            >
              <option value="">-- Select a time --</option>
              {availableSlots.map((slot, index) => (
                <option key={index} value={slot}>
                  {new Date(slot).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Duration (minutes):</label>
            <select 
              name="duration" 
              value={formData.duration}
              onChange={handleChange}
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Reason for Visit:</label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="E.g., Annual check-up, Flu symptoms"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Symptoms (comma separated):</label>
            <textarea
              name="symptoms"
              value={formData.symptoms}
              onChange={handleChange}
              placeholder="E.g., Headache, Fever, Cough"
              rows={3}
            ></textarea>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Scheduling...' : 'Schedule Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}