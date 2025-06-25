import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContextCore';
import apiClient from '../../api/apiClient';
import './DoctorPages.css';

export default function VideoCallsPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [activeCall, setActiveCall] = useState(null);
  const [upcomingCalls, setUpcomingCalls] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideoCallData();
  }, []);

  const fetchVideoCallData = async () => {
    try {
      setLoading(true);
      
      // Fetch appointments that are scheduled for today and have video calls
      const response = await apiClient.get('/appointments?status=scheduled');
      const appointments = response.data || [];
      
      const now = new Date();
      const today = now.toDateString();
      
      // Filter for today's appointments
      const todaysAppointments = appointments.filter(apt => 
        new Date(apt.date).toDateString() === today
      );
      
      // Determine active call (happening now)
      const currentTime = now.getTime();
      const active = todaysAppointments.find(apt => {
        const appointmentTime = new Date(apt.date).getTime();
        const endTime = appointmentTime + (apt.duration || 30) * 60000;
        return currentTime >= appointmentTime && currentTime <= endTime;
      });
      
      setActiveCall(active);
      setUpcomingCalls(todaysAppointments.filter(apt => new Date(apt.date).getTime() > currentTime));
      
      // Fetch call history (completed appointments)
      const historyResponse = await apiClient.get('/appointments?status=completed');
      setCallHistory((historyResponse.data || []).slice(0, 10)); // Last 10 calls
      
    } catch (error) {
      console.error('Error fetching video call data:', error);
      addNotification('Failed to load video call data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startVideoCall = (appointmentId) => {
    // In a real app, this would integrate with a video calling service like Twilio, Zoom API, etc.
    const meetingUrl = `https://meet.telemedicine.com/room/${appointmentId}`;
    window.open(meetingUrl, '_blank', 'width=1200,height=800');
    addNotification('Video call started', 'success');
  };

  const endVideoCall = async (appointmentId) => {
    try {
      await apiClient.put(`/appointments/${appointmentId}`, { status: 'completed' });
      addNotification('Video call ended successfully', 'success');
      fetchVideoCallData(); // Refresh data
    } catch (error) {
      addNotification('Failed to end call', 'error');
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="doctor-page">
        <div className="loading-spinner"></div>
        <p>Loading video calls...</p>
      </div>
    );
  }

  return (
    <div className="doctor-page">
      <div className="page-header">
        <h1>Video Calls</h1>
        <p>Manage your virtual consultations</p>
      </div>

      {/* Active Call Section */}
      {activeCall && (
        <div className="active-call-section">
          <div className="active-call-card">
            <div className="call-status">
              <div className="status-indicator active"></div>
              <span>Active Call</span>
            </div>
            <div className="call-details">
              <h3>
                {activeCall.patient?.profile?.fullName || 
                 `${activeCall.patient?.profile?.firstName} ${activeCall.patient?.profile?.lastName}` || 
                 'Patient'}
              </h3>
              <p>Started at {formatTime(activeCall.date)}</p>
              <p>Reason: {activeCall.reason || 'General Consultation'}</p>
            </div>
            <div className="call-actions">
              <button 
                className="btn btn-danger"
                onClick={() => endVideoCall(activeCall._id)}
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Calls Section */}
      <div className="calls-section">
        <div className="section-header">
          <h2>Today's Upcoming Calls</h2>
          <span className="call-count">{upcomingCalls.length} scheduled</span>
        </div>
        
        {upcomingCalls.length === 0 ? (
          <div className="empty-state">
            <p>No upcoming video calls for today</p>
          </div>
        ) : (
          <div className="calls-grid">
            {upcomingCalls.map(call => (
              <div key={call._id} className="call-card">
                <div className="call-time">
                  <div className="time">{formatTime(call.date)}</div>
                  <div className="duration">{call.duration || 30} min</div>
                </div>
                <div className="call-info">
                  <h4>
                    {call.patient?.profile?.fullName || 
                     `${call.patient?.profile?.firstName} ${call.patient?.profile?.lastName}` || 
                     'Patient'}
                  </h4>
                  <p className="reason">{call.reason || 'General Consultation'}</p>
                  <p className="type">{call.type || 'Video Call'}</p>
                </div>
                <div className="call-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => startVideoCall(call._id)}
                  >
                    Start Call
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call History Section */}
      <div className="calls-section">
        <div className="section-header">
          <h2>Recent Call History</h2>
        </div>
        
        {callHistory.length === 0 ? (
          <div className="empty-state">
            <p>No call history available</p>
          </div>
        ) : (
          <div className="history-list">
            {callHistory.map(call => (
              <div key={call._id} className="history-item">
                <div className="history-date">
                  <div className="date">{formatDate(call.date)}</div>
                  <div className="time">{formatTime(call.date)}</div>
                </div>
                <div className="history-info">
                  <h4>
                    {call.patient?.profile?.fullName || 
                     `${call.patient?.profile?.firstName} ${call.patient?.profile?.lastName}` || 
                     'Patient'}
                  </h4>
                  <p>{call.reason || 'General Consultation'}</p>
                </div>
                <div className="history-status">
                  <span className="status completed">Completed</span>
                  <span className="duration">{call.duration || 30}m</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button 
            className="btn btn-secondary"
            onClick={() => window.open('https://meet.telemedicine.com/test', '_blank')}
          >
            Test Video Setup
          </button>
          <button 
            className="btn btn-secondary"
            onClick={fetchVideoCallData}
          >
            Refresh Calls
          </button>
        </div>
      </div>
    </div>
  );
}
