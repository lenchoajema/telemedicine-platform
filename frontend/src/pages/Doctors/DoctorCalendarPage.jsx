import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContextCore';
import apiClient from '../../api/apiClient';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import './DoctorCalendarPage.css';

export default function DoctorCalendarPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('month'); // month, week, day
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, view]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch appointments for the current month/week/day
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();

      const [appointmentsResponse, availabilityResponse] = await Promise.all([
        apiClient.get('/appointments', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        }),
        apiClient.get('/doctors/my-availability')
      ]);

      setAppointments(appointmentsResponse.data?.data || []);
      setAvailability(availabilityResponse.data || []);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setError('Failed to load calendar data');
      addNotification('Failed to load calendar data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getViewStartDate = () => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setDate(1);
      date.setDate(date.getDate() - date.getDay());
    } else if (view === 'week') {
      date.setDate(date.getDate() - date.getDay());
    }
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const getViewEndDate = () => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      date.setDate(date.getDate() + (6 - date.getDay()));
    } else if (view === 'week') {
      date.setDate(date.getDate() + 6);
    }
    date.setHours(23, 59, 59, 999);
    return date;
  };

  const navigateCalendar = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (view === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const getAvailableSlotsForDate = (date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const dayAvailability = availability.find(avail => avail.day === dayName);
    
    if (!dayAvailability || !dayAvailability.isAvailable) {
      return [];
    }

    const slots = [];
    const startTime = new Date(`1970-01-01T${dayAvailability.startTime}`);
    const endTime = new Date(`1970-01-01T${dayAvailability.endTime}`);
    const slotDuration = 30; // 30 minutes

    for (let time = startTime; time < endTime; time.setMinutes(time.getMinutes() + slotDuration)) {
      const timeString = time.toTimeString().slice(0, 5);
      const isBooked = appointments.some(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.toDateString() === date.toDateString() && apt.time === timeString;
      });

      slots.push({
        time: timeString,
        isBooked,
        date: date
      });
    }

    return slots;
  };

  const handleTimeSlotClick = (slot) => {
    if (!slot.isBooked) {
      setSelectedTimeSlot(slot);
      setShowScheduleModal(true);
    }
  };

  const createTimeSlot = async (slotData) => {
    try {
      await apiClient.post('/doctors/time-slots', {
        date: slotData.date,
        startTime: slotData.time,
        duration: 30
      });
      
      addNotification('Time slot created successfully', 'success');
      setShowScheduleModal(false);
      fetchCalendarData();
    } catch (error) {
      console.error('Error creating time slot:', error);
      addNotification('Failed to create time slot', 'error');
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await apiClient.put(`/appointments/${appointmentId}`, { status });
      addNotification(`Appointment ${status} successfully`, 'success');
      fetchCalendarData();
    } catch (error) {
      console.error('Error updating appointment:', error);
      addNotification('Failed to update appointment', 'error');
    }
  };

  const renderMonthView = () => {
    const startDate = getViewStartDate();
    const weeks = [];
    let currentWeek = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayAppointments = getAppointmentsForDate(date);
      const isCurrentMonth = date.getMonth() === currentDate.getMonth();
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();

      currentWeek.push(
        <div
          key={date.toISOString()}
          className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} 
                     ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => setSelectedDate(new Date(date))}
        >
          <div className="day-header">
            <span className="day-number">{date.getDate()}</span>
          </div>
          <div className="day-appointments">
            {dayAppointments.slice(0, 3).map(apt => (
              <div 
                key={apt._id} 
                className={`appointment-item ${apt.status}`}
                title={`${apt.time} - ${apt.patient?.profile?.firstName} ${apt.patient?.profile?.lastName}`}
              >
                <span className="appointment-time">{apt.time}</span>
                <span className="appointment-patient">
                  {apt.patient?.profile?.firstName} {apt.patient?.profile?.lastName}
                </span>
              </div>
            ))}
            {dayAppointments.length > 3 && (
              <div className="more-appointments">+{dayAppointments.length - 3} more</div>
            )}
          </div>
        </div>
      );

      if (currentWeek.length === 7) {
        weeks.push(<div key={weeks.length} className="calendar-week">{currentWeek}</div>);
        currentWeek = [];
      }
    }

    return <div className="calendar-month">{weeks}</div>;
  };

  const renderWeekView = () => {
    const startDate = getViewStartDate();
    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayAppointments = getAppointmentsForDate(date);
      const availableSlots = getAvailableSlotsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div key={date.toISOString()} className={`week-day ${isToday ? 'today' : ''}`}>
          <div className="week-day-header">
            <div className="day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className="day-date">{date.getDate()}</div>
          </div>
          <div className="week-day-content">
            <div className="time-slots">
              {availableSlots.map(slot => (
                <div
                  key={`${date.toISOString()}-${slot.time}`}
                  className={`time-slot ${slot.isBooked ? 'booked' : 'available'}`}
                  onClick={() => handleTimeSlotClick(slot)}
                >
                  <span className="slot-time">{slot.time}</span>
                  {slot.isBooked && (
                    <div className="booked-appointment">
                      {dayAppointments.find(apt => apt.time === slot.time)?.patient?.profile?.firstName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return <div className="calendar-week-view">{days}</div>;
  };

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDate(selectedDate);
    const availableSlots = getAvailableSlotsForDate(selectedDate);

    return (
      <div className="calendar-day-view">
        <div className="day-view-header">
          <h3>{selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</h3>
        </div>
        <div className="day-view-content">
          <div className="time-schedule">
            {availableSlots.map(slot => {
              const appointment = dayAppointments.find(apt => apt.time === slot.time);
              
              return (
                <div
                  key={slot.time}
                  className={`schedule-slot ${slot.isBooked ? 'booked' : 'available'}`}
                  onClick={() => handleTimeSlotClick(slot)}
                >
                  <div className="slot-time">{slot.time}</div>
                  <div className="slot-content">
                    {appointment ? (
                      <div className="appointment-details">
                        <div className="patient-name">
                          {appointment.patient?.profile?.firstName} {appointment.patient?.profile?.lastName}
                        </div>
                        <div className="appointment-reason">{appointment.reason}</div>
                        <div className="appointment-status">{appointment.status}</div>
                        <div className="appointment-actions">
                          {appointment.status === 'scheduled' && (
                            <>
                              <button 
                                className="btn-complete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateAppointmentStatus(appointment._id, 'completed');
                                }}
                              >
                                Complete
                              </button>
                              <button 
                                className="btn-cancel"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateAppointmentStatus(appointment._id, 'cancelled');
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="available-slot">
                        <span>Available</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="doctor-calendar-page">
      <div className="calendar-header">
        <div className="calendar-title">
          <h1>Schedule & Calendar</h1>
          <p>Manage your appointments and availability</p>
        </div>
        
        <div className="calendar-controls">
          <div className="view-selector">
            <button 
              className={view === 'month' ? 'active' : ''}
              onClick={() => setView('month')}
            >
              Month
            </button>
            <button 
              className={view === 'week' ? 'active' : ''}
              onClick={() => setView('week')}
            >
              Week
            </button>
            <button 
              className={view === 'day' ? 'active' : ''}
              onClick={() => setView('day')}
            >
              Day
            </button>
          </div>
          
          <div className="navigation-controls">
            <button onClick={() => navigateCalendar(-1)}>
              ←
            </button>
            <button onClick={() => setCurrentDate(new Date())}>
              Today
            </button>
            <button onClick={() => navigateCalendar(1)}>
              →
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-navigation">
        <div className="current-period">
          {view === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          {view === 'week' && `Week of ${getViewStartDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          {view === 'day' && selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchCalendarData}>Retry</button>
        </div>
      )}

      <div className="calendar-content">
        {view === 'month' && (
          <>
            <div className="calendar-weekdays">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="weekday-header">{day}</div>
              ))}
            </div>
            {renderMonthView()}
          </>
        )}
        
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && selectedTimeSlot && (
        <div className="schedule-modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Time Slot</h3>
              <button 
                className="close-button"
                onClick={() => setShowScheduleModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <p>
                <strong>Date:</strong> {selectedTimeSlot.date.toLocaleDateString()}
              </p>
              <p>
                <strong>Time:</strong> {selectedTimeSlot.time}
              </p>
              <p>Create an available time slot for patient bookings?</p>
            </div>
            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-confirm"
                onClick={() => createTimeSlot(selectedTimeSlot)}
              >
                Create Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color scheduled"></div>
          <span>Scheduled</span>
        </div>
        <div className="legend-item">
          <div className="legend-color completed"></div>
          <span>Completed</span>
        </div>
        <div className="legend-item">
          <div className="legend-color cancelled"></div>
          <span>Cancelled</span>
        </div>
        <div className="legend-item">
          <div className="legend-color available"></div>
          <span>Available</span>
        </div>
      </div>
    </div>
  );
}
