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
        
        // Mock availability data for demonstration
        const mockAvailability = [
          {
            day: 'monday',
            slots: [
              { time: '09:00', available: true },
              { time: '09:30', available: true },
              { time: '10:00', available: false },
              { time: '10:30', available: true },
              { time: '11:00', available: true },
              { time: '11:30', available: true },
              { time: '14:00', available: true },
              { time: '14:30', available: true },
              { time: '15:00', available: false },
              { time: '15:30', available: true },
              { time: '16:00', available: true },
              { time: '16:30', available: true }
            ]
          },
          {
            day: 'tuesday',
            slots: [
              { time: '09:00', available: true },
              { time: '09:30', available: true },
              { time: '10:00', available: true },
              { time: '10:30', available: false },
              { time: '11:00', available: true },
              { time: '14:00', available: true },
              { time: '14:30', available: true },
              { time: '15:00', available: true },
              { time: '15:30', available: true },
              { time: '16:00', available: false },
              { time: '16:30', available: true }
            ]
          }
        ];

        try {
          // Try to fetch from API first
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const response = await fetch(`${apiUrl}/doctors/my-availability`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            // Process the availability data to include slots for display
            const processedData = Array.isArray(data) ? data.map(avail => ({
              ...avail,
              slots: avail.startTime && avail.endTime && avail.slotDuration 
                ? generateTimeSlots(avail.startTime, avail.endTime, avail.slotDuration)
                : []
            })) : mockAvailability;
            setAvailability(processedData);
          } else {
            throw new Error(`API returned ${response.status}`);
          }
        } catch (apiError) {
          console.log('API unavailable, using mock data:', apiError.message);
          // Use mock data as fallback
          setAvailability(mockAvailability);
        }

      } catch (error) {
        console.error('Error fetching availability:', error);
        addNotification('Failed to load availability data. Using demo data.', 'warning');
        // Set empty availability as last resort
        setAvailability([]);
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
      // Create new availability slots based on the time range
      const slots = generateTimeSlots(timeSlots.start, timeSlots.end, timeSlots.slotDuration);
      const newDayAvailability = {
        day: selectedDay,
        slots: slots
      };

      try {
        // Try to save to API
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/doctors/availability`, {
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

        if (response.ok) {
          const result = await response.json();
          // Handle the new response format from the backend
          const savedData = result.availability || result;
          
          // Generate slots for display
          const slots = generateTimeSlots(savedData.startTime, savedData.endTime, savedData.slotDuration);
          const dayAvailabilityWithSlots = {
            day: savedData.day,
            startTime: savedData.startTime,
            endTime: savedData.endTime,
            slotDuration: savedData.slotDuration,
            slots: slots,
            createdAt: savedData.createdAt,
            updatedAt: savedData.updatedAt
          };
          
          setAvailability([...availability.filter(a => a.day !== selectedDay), dayAvailabilityWithSlots]);
          addNotification('Availability updated successfully', 'success');
          return;
        } else {
          throw new Error(`API returned ${response.status}`);
        }
      } catch (apiError) {
        console.log('API unavailable, saving locally:', apiError.message);
        // Fallback to local state update with slots
        const slots = generateTimeSlots(timeSlots.start, timeSlots.end, timeSlots.slotDuration);
        const localDayAvailability = {
          day: selectedDay,
          startTime: timeSlots.start,
          endTime: timeSlots.end,
          slotDuration: timeSlots.slotDuration,
          slots: slots,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setAvailability([...availability.filter(a => a.day !== selectedDay), localDayAvailability]);
        addNotification('Availability updated (demo mode)', 'success');
      }

    } catch (error) {
      console.error('Error adding availability:', error);
      addNotification('Failed to update availability', 'error');
    }
  };

  const removeAvailability = async (day) => {
    try {
      try {
        // Try to delete from API
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/doctors/availability/${day}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          setAvailability(availability.filter(a => a.day !== day));
          addNotification('Availability removed successfully', 'success');
          return;
        } else {
          throw new Error(`API returned ${response.status}`);
        }
      } catch (apiError) {
        console.log('API unavailable, removing locally:', apiError.message);
        // Fallback to local state update
        setAvailability(availability.filter(a => a.day !== day));
        addNotification('Availability removed (demo mode)', 'success');
      }

    } catch (error) {
      console.error('Error removing availability:', error);
      addNotification('Failed to remove availability', 'error');
    }
  };

  // Helper function to generate time slots
  const generateTimeSlots = (startTime, endTime, duration) => {
    const slots = [];
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    let current = start;
    while (current < end) {
      slots.push({
        time: current.toTimeString().slice(0, 5),
        available: true
      });
      current = new Date(current.getTime() + duration * 60000);
    }
    
    return slots;
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
              <h3>Current Time Slots for {days.find(d => d.id === selectedDay)?.label}</h3>
              <div className="slots-container">
                {dayAvailability.slots && dayAvailability.slots.length > 0 ? (
                  dayAvailability.slots.map((slot, index) => (
                    <div 
                      key={index} 
                      className={`time-slot ${slot.available ? 'available' : 'booked'}`}
                    >
                      {slot.time}
                      {slot.available ? ' (Available)' : ' (Booked)'}
                    </div>
                  ))
                ) : (
                  <div className="no-slots">No time slots configured for this day</div>
                )}
              </div>
              
              {dayAvailability && (
                <button 
                  className="btn danger"
                  onClick={() => removeAvailability(selectedDay)}
                >
                  Remove All Availability for {days.find(d => d.id === selectedDay)?.label}
                </button>
              )}
            </div>
          )}

          {!dayAvailability && (
            <div className="no-availability">
              <p>No availability set for {days.find(d => d.id === selectedDay)?.label}</p>
              <p>Use the form above to add your available hours.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
