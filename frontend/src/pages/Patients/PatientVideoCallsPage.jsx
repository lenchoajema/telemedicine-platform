import React, { useState, useEffect } from 'react';
import './PatientVideoCallsPage.css';

const PatientVideoCallsPage = () => {
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
      // Mock data - replace with actual API calls
      const mockData = {
        activeCall: null,
        upcomingCalls: [
          {
            id: 1,
            doctorName: 'Dr. Sarah Johnson',
            specialty: 'Cardiology',
            scheduledTime: '2024-01-20T14:00:00Z',
            type: 'Follow-up',
            meetingLink: 'https://meet.example.com/room1'
          },
          {
            id: 2,
            doctorName: 'Dr. Michael Chen',
            specialty: 'Dermatology',
            scheduledTime: '2024-01-22T10:30:00Z',
            type: 'Consultation',
            meetingLink: 'https://meet.example.com/room2'
          }
        ],
        callHistory: [
          {
            id: 3,
            doctorName: 'Dr. Emily Davis',
            specialty: 'General Medicine',
            date: '2024-01-15T11:00:00Z',
            duration: '25 minutes',
            type: 'Consultation',
            status: 'completed',
            recording: 'available'
          },
          {
            id: 4,
            doctorName: 'Dr. James Wilson',
            specialty: 'Pediatrics',
            date: '2024-01-10T15:30:00Z',
            duration: '30 minutes',
            type: 'Follow-up',
            status: 'completed',
            recording: 'not-available'
          }
        ]
      };

      setActiveCall(mockData.activeCall);
      setUpcomingCalls(mockData.upcomingCalls);
      setCallHistory(mockData.callHistory);
    } catch (err) {
      setError('Failed to load video call data');
      console.error('Error fetching video call data:', err);
    } finally {
      setLoading(false);
    }
  };

  const joinCall = (meetingLink) => {
    window.open(meetingLink, '_blank');
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
              <button className="btn-rejoin" onClick={() => joinCall(activeCall.meetingLink)}>
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
                      onClick={() => joinCall(call.meetingLink)}
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
