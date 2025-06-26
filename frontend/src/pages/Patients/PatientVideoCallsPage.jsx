import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PatientVideoCallsPage.css';

const PatientVideoCallsPage = () => {
  const navigate = useNavigate();
  const [activeCall, setActiveCall] = useState(null);
  const [upcomingCalls, setUpcomingCalls] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVideoCallData();
  }, []);

  const fetchVideoCallData = async () => {
    try {
      setLoading(true);
      
      // Fetch real appointment data from API
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/appointments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const appointments = await response.json();
        
        // Process appointments to categorize them
        const now = new Date();
        
        // Filter for scheduled appointments (upcoming calls)
        const upcoming = appointments
          .filter(apt => apt.status === 'scheduled' && new Date(apt.date) > now)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .map(apt => ({
            id: apt._id,
            doctorName: apt.doctor ? `Dr. ${apt.doctor.profile.firstName} ${apt.doctor.profile.lastName}` : 'Doctor Assigned',
            specialty: apt.doctor?.profile?.specialization || 'General Medicine',
            scheduledTime: apt.date,
            type: apt.reason || 'Consultation',
            meetingLink: apt.meetingUrl || `https://meet.telemedicine.com/room/${apt._id}`,
            duration: apt.duration || 30
          }));

        // Filter for completed appointments (call history)
        const history = appointments
          .filter(apt => apt.status === 'completed')
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map(apt => ({
            id: apt._id,
            doctorName: apt.doctor ? `Dr. ${apt.doctor.profile.firstName} ${apt.doctor.profile.lastName}` : 'Doctor',
            specialty: apt.doctor?.profile?.specialization || 'General Medicine',
            date: apt.date,
            duration: `${apt.duration || 30} minutes`,
            type: apt.reason || 'Consultation',
            status: 'completed',
            recording: 'not-available', // Could be enhanced to check for actual recordings
            notes: apt.notes
          }));

        // Check for any active call (appointment happening now)
        const activeAppointment = appointments.find(apt => {
          const aptDate = new Date(apt.date);
          const aptEndTime = new Date(aptDate.getTime() + (apt.duration || 30) * 60000);
          return apt.status === 'scheduled' && aptDate <= now && now <= aptEndTime;
        });

        const activeCall = activeAppointment ? {
          id: activeAppointment._id,
          doctorName: activeAppointment.doctor 
            ? `Dr. ${activeAppointment.doctor.profile.firstName} ${activeAppointment.doctor.profile.lastName}` 
            : 'Doctor',
          specialty: activeAppointment.doctor?.profile?.specialization || 'General Medicine',
          startTime: activeAppointment.date,
          meetingLink: activeAppointment.meetingUrl || `https://meet.telemedicine.com/room/${activeAppointment._id}`,
          type: activeAppointment.reason || 'Consultation'
        } : null;

        setActiveCall(activeCall);
        setUpcomingCalls(upcoming);
        setCallHistory(history);
      } else {
        throw new Error(`Failed to fetch appointments: ${response.status}`);
      }
    } catch (err) {
      setError('Failed to load video call data');
      console.error('Error fetching video call data:', err);
      // Set empty arrays instead of mock data
      setActiveCall(null);
      setUpcomingCalls([]);
      setCallHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const joinCall = (appointmentId) => {
    // Navigate to the WebRTC video call room
    navigate(`/video-call/${appointmentId}`);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const isCallStartable = (scheduledTime) => {
    const now = new Date();
    const callTime = new Date(scheduledTime);
    const timeDiff = callTime.getTime() - now.getTime();
    return timeDiff <= 15 * 60 * 1000 && timeDiff >= -5 * 60 * 1000; // 15 minutes before to 5 minutes after
  };

  if (loading) {
    return (
      <div className="patient-video-calls-page">
        <div className="loading-spinner">Loading video calls...</div>
      </div>
    );
  }

  return (
    <div className="patient-video-calls-page">
      <div className="page-header">
        <h1>Video Calls</h1>
        <p>Manage your video consultations with doctors</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Active Call Section */}
      {activeCall && (
        <div className="active-call-section">
          <h2>Active Call</h2>
          <div className="active-call-card">
            <div className="call-info">
              <h3>{activeCall.doctorName}</h3>
              <p>{activeCall.specialty}</p>
              <p>Started: {formatDateTime(activeCall.startTime)}</p>
            </div>
            <div className="call-actions">
              <button className="btn-rejoin" onClick={() => joinCall(activeCall.id)}>
                Rejoin Call
              </button>
              <button className="btn-end-call">
                End Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Calls Section */}
      <div className="upcoming-calls-section">
        <h2>Upcoming Calls</h2>
        {upcomingCalls.length === 0 ? (
          <div className="no-data">
            <p>No upcoming video calls scheduled</p>
          </div>
        ) : (
          <div className="calls-grid">
            {upcomingCalls.map(call => (
              <div key={call.id} className="call-card">
                <div className="call-header">
                  <h3>{call.doctorName}</h3>
                  <span className="call-type">{call.type}</span>
                </div>
                <div className="call-details">
                  <p><strong>Specialty:</strong> {call.specialty}</p>
                  <p><strong>Scheduled:</strong> {formatDateTime(call.scheduledTime)}</p>
                </div>
                <div className="call-actions">
                  {isCallStartable(call.scheduledTime) ? (
                    <button 
                      className="btn-join"
                      onClick={() => joinCall(call.id)}
                    >
                      Join Call
                    </button>
                  ) : (
                    <button className="btn-join disabled" disabled>
                      Not Yet Available
                    </button>
                  )}
                  <button className="btn-reschedule">
                    Reschedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call History Section */}
      <div className="call-history-section">
        <h2>Call History</h2>
        {callHistory.length === 0 ? (
          <div className="no-data">
            <p>No previous video calls</p>
          </div>
        ) : (
          <div className="history-table">
            <table>
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialty</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Recording</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {callHistory.map(call => (
                  <tr key={call.id}>
                    <td>{call.doctorName}</td>
                    <td>{call.specialty}</td>
                    <td>{formatDateTime(call.date)}</td>
                    <td>{call.duration}</td>
                    <td>{call.type}</td>
                    <td>
                      <span className={`status-badge ${call.status}`}>
                        {call.status}
                      </span>
                    </td>
                    <td>
                      {call.recording === 'available' ? (
                        <button className="btn-small">View</button>
                      ) : (
                        <span className="not-available">N/A</span>
                      )}
                    </td>
                    <td>
                      <button className="btn-small">Book Follow-up</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientVideoCallsPage;
