import React, { useState } from 'react';
import AppointmentService from '../../api/AppointmentService';
import DatePicker from 'react-datepicker';
import { useNotifications } from '../../contexts/NotificationContext';
import 'react-datepicker/dist/react-datepicker.css';
import './AppointmentActions.css';

export default function AppointmentActions({ appointment, onActionComplete }) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();
  
  // Calculate if appointment is in the future
  const isUpcoming = new Date(appointment.date) > new Date();
  
  // Handle date change
  const handleDateChange = async (date) => {
    setNewDate(date);
    setLoading(true);
    
    try {
      const slots = await AppointmentService.getAvailableSlots(date, appointment.doctor._id);
      setAvailableSlots(slots);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Error fetching available slots:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle slot selection
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };
  
  // Handle appointment cancellation
  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }
    
    setLoading(true);
    
    try {
      await AppointmentService.cancelAppointment(appointment._id);
      addNotification('Appointment cancelled successfully', 'success');
      
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error) {
      console.error('Error canceling appointment:', error);
      addNotification('Failed to cancel appointment', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle appointment rescheduling
  const handleReschedule = async () => {
    if (!selectedSlot) {
      addNotification('Please select an available time slot', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      await AppointmentService.rescheduleAppointment(appointment._id, selectedSlot);
      addNotification('Appointment rescheduled successfully', 'success');
      setShowReschedule(false);
      
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      addNotification('Failed to reschedule appointment', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isUpcoming) {
    return null;
  }
  
  return (
    <div className="appointment-actions">
      {showReschedule ? (
        <div className="reschedule-form">
          <h4>Reschedule Appointment</h4>
          
          <div className="form-group">
            <label>Select New Date:</label>
            <DatePicker
              selected={newDate}
              onChange={handleDateChange}
              minDate={new Date()}
              dateFormat="MMMM d, yyyy"
              className="date-input"
            />
          </div>
          
          <div className="form-group">
            <label>Available Time Slots:</label>
            {loading ? (
              <div className="loading">Loading available slots...</div>
            ) : availableSlots.length > 0 ? (
              <div className="time-slots">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    className={`time-slot ${selectedSlot === slot ? 'selected' : ''}`}
                    onClick={() => handleSlotSelect(slot)}
                  >
                    {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </button>
                ))}
              </div>
            ) : (
              <div className="no-slots">No available slots for selected date</div>
            )}
          </div>
          
          <div className="action-buttons">
            <button
              className="btn-secondary"
              onClick={() => setShowReschedule(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleReschedule}
              disabled={loading || !selectedSlot}
            >
              {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
          </div>
        </div>
      ) : (
        <div className="action-buttons">
          <button
            className="btn-secondary"
            onClick={() => setShowReschedule(true)}
            disabled={loading}
          >
            Reschedule
          </button>
          <button
            className="btn-danger"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel Appointment
          </button>
        </div>
      )}
    </div>
  );
}
