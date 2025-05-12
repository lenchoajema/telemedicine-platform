import { useState, useEffect } from 'react';
//import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContextCore';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import './DoctorPages.css';

export default function DoctorAvailabilityPage() {
 // const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState([]);
  const [selectedDay, setSelectedDay] = useState('monday');
  const [timeSlots, setTimeSlots] = useState({
    start: '09:00',
    end: '17:00',
    slotDuration: 30
  });

  // Days of the week
  const days = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' }
  ];

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/doctors/availability`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch availability');
        }

        const data = await response.json();
        setAvailability(data || []);
      } catch (error) {
        addNotification(`Error: ${error.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [addNotification]);

  const handleDayChange = (day) => {
    setSelectedDay(day);
  };

  const handleStartTimeChange = (e) => {
    setTimeSlots({ ...timeSlots, start: e.target.value });
  };

  const handleEndTimeChange = (e) => {
    setTimeSlots({ ...timeSlots, end: e.target.value });
  };

  const handleSlotDurationChange = (e) => {
    setTimeSlots({ ...timeSlots, slotDuration: parseInt(e.target.value, 10) });
  };

  const addAvailability = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/doctors/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          day: selectedDay,
          startTime: timeSlots.start,
          endTime: timeSlots.end,
          slotDuration: timeSlots.slotDuration
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add availability');
      }

      const newAvailability = await response.json();
      
      setAvailability([...availability.filter(a => a.day !== selectedDay), newAvailability]);
      addNotification('Availability updated successfully', 'success');
    } catch (error) {
      addNotification(`Error: ${error.message}`, 'error');
    }
  };

  const removeAvailability = async (day) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/doctors/availability/${day}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove availability');
      }

      setAvailability(availability.filter(a => a.day !== day));
      addNotification('Availability removed successfully', 'success');
    } catch (error) {
      addNotification(`Error: ${error.message}`, 'error');
    }
  };

  if (loading) return <LoadingSpinner />;

  const dayAvailability = availability.find(a => a.day === selectedDay);

  return (
    <div className="doctor-page availability-page">
      <h1>Set Your Availability</h1>
      <p>Configure when you're available to see patients.</p>

      <div className="availability-container">
        <div className="days-sidebar">
          <h3>Days</h3>
          <div className="days-list">
            {days.map(day => (
              <div 
                key={day.id}
                className={`day-item ${selectedDay === day.id ? 'selected' : ''} ${availability.some(a => a.day === day.id) ? 'has-availability' : ''}`}
                onClick={() => handleDayChange(day.id)}
              >
                <span className="day-name">{day.label}</span>
                {availability.some(a => a.day === day.id) && (
                  <span className="availability-indicator">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="day-config">
          <div className="day-header">
            <h2>{days.find(d => d.id === selectedDay)?.label}</h2>
            {dayAvailability && (
              <button 
                className="btn-sm danger"
                onClick={() => removeAvailability(selectedDay)}
              >
                Remove Availability
              </button>
            )}
          </div>

          <div className="time-config">
            <div className="time-inputs">
              <div className="input-group">
                <label>Start Time</label>
                <input 
                  type="time" 
                  value={dayAvailability?.startTime || timeSlots.start}
                  onChange={handleStartTimeChange}
                />
              </div>

              <div className="input-group">
                <label>End Time</label>
                <input 
                  type="time" 
                  value={dayAvailability?.endTime || timeSlots.end}
                  onChange={handleEndTimeChange}
                />
              </div>

              <div className="input-group">
                <label>Appointment Duration (minutes)</label>
                <select 
                  value={dayAvailability?.slotDuration || timeSlots.slotDuration}
                  onChange={handleSlotDurationChange}
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>
            </div>

            <button 
              className="btn primary"
              onClick={addAvailability}
              disabled={!selectedDay || !timeSlots.start || !timeSlots.end}
            >
              {dayAvailability ? 'Update Availability' : 'Add Availability'}
            </button>
          </div>

          {dayAvailability && (
            <div className="time-slots-preview">
              <h3>Generated Time Slots</h3>
              <div className="slots-container">
                {/* This would be dynamically generated based on start, end, and duration */}
                <div className="time-slot">9:00 AM - 9:30 AM</div>
                <div className="time-slot">9:30 AM - 10:00 AM</div>
                <div className="time-slot">10:00 AM - 10:30 AM</div>
                <div className="time-slot">10:30 AM - 11:00 AM</div>
                {/* More slots would appear here */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
