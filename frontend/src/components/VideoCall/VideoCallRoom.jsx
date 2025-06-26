import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useWebRTC from '../../hooks/useWebRTC';
import apiClient from '../../api/apiClient';
import './VideoCallRoom.css';

const VideoCallRoom = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());
  const callStartTime = useRef(null);

  // Initialize room data
  useEffect(() => {
    const initializeRoom = async () => {
      try {
        setLoading(true);
        
        // Create video call room
        const response = await apiClient.post(`/video-calls/appointment/${appointmentId}/room`);
        const data = response.data.data;
        
        setRoomData(data);
        callStartTime.current = new Date();
        
        // Start call duration timer
        const interval = setInterval(() => {
          if (callStartTime.current) {
            const duration = Math.floor((new Date() - callStartTime.current) / 1000);
            setCallDuration(duration);
          }
        }, 1000);

        return () => clearInterval(interval);
        
      } catch (err) {
        console.error('Failed to initialize video call room:', err);
        setError(err.response?.data?.message || 'Failed to start video call');
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      initializeRoom();
    }
  }, [appointmentId]);

  // WebRTC hook
  const {
    localStream,
    peers,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    chatMessages,
    participants,
    connectionQuality,
    error: webrtcError,
    isConnected,
    joinRoom,
    leaveRoom,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    sendChatMessage,
    endCall
  } = useWebRTC(
    roomData?.roomId,
    roomData?.webrtcToken,
    appointmentId
  );

  // Join room when room data is available
  useEffect(() => {
    if (roomData && isConnected) {
      joinRoom();
    }
  }, [roomData, isConnected, joinRoom]);

  // Update local video
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Handle remote video streams
  useEffect(() => {
    peers.forEach((peer, userId) => {
      if (peer.streams && peer.streams[0]) {
        const videoElement = remoteVideoRefs.current.get(userId);
        if (videoElement) {
          videoElement.srcObject = peer.streams[0];
        }
      }
    });
  }, [peers]);

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendChatMessage(chatInput);
      setChatInput('');
    }
  };

  const handleEndCall = async () => {
    try {
      // End call on server
      await apiClient.post(`/video-calls/appointment/${appointmentId}/end`, {
        duration: callDuration,
        quality: connectionQuality
      });
      
      // End WebRTC call
      endCall();
      
      // Navigate back
      navigate('/dashboard');
    } catch (err) {
      console.error('Error ending call:', err);
      // Still end call locally even if server request fails
      endCall();
      navigate('/dashboard');
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <div className="video-call-loading">
        <div className="loading-spinner"></div>
        <p>Initializing video call...</p>
      </div>
    );
  }

  if (error || webrtcError) {
    return (
      <div className="video-call-error">
        <div className="error-content">
          <h2>Video Call Error</h2>
          <p>{error || webrtcError}</p>
          <button onClick={() => navigate('/dashboard')} className="btn primary">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!roomData) {
    return <div className="video-call-error">No room data available</div>;
  }

  return (
    <div className={`video-call-room ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Header */}
      <div className="call-header">
        <div className="call-info">
          <h2>Video Consultation</h2>
          <div className="call-details">
            <span className="participant-info">
              {roomData.appointmentDetails.doctor.name} & {roomData.appointmentDetails.patient.name}
            </span>
            <span className="call-duration">{formatDuration(callDuration)}</span>
            <span className={`connection-status ${connectionQuality}`}>
              {connectionQuality === 'good' ? '🟢' : connectionQuality === 'poor' ? '🟡' : '🔴'} {connectionQuality}
            </span>
          </div>
        </div>
        
        <div className="call-actions">
          <button 
            onClick={toggleFullscreen}
            className="btn secondary icon-btn"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? '⛶' : '⛶'}
          </button>
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`btn secondary icon-btn ${isChatOpen ? 'active' : ''}`}
            title="Toggle Chat"
          >
            💬 {chatMessages.length > 0 && <span className="badge">{chatMessages.length}</span>}
          </button>
        </div>
      </div>

      {/* Video Area */}
      <div className="video-area">
        {/* Remote Videos */}
        <div className="remote-videos">
          {participants.filter(p => p.userId !== roomData.appointmentDetails.patient.id && 
                                   p.userId !== roomData.appointmentDetails.doctor.id).length === 0 ? (
            <div className="waiting-message">
              <h3>Waiting for other participant to join...</h3>
              <p>Share this room with: {roomData.appointmentDetails.doctor.name} and {roomData.appointmentDetails.patient.name}</p>
            </div>
          ) : (
            Array.from(peers.entries()).map(([userId, peer]) => (
              <div key={userId} className="remote-video-container">
                <video
                  ref={(el) => {
                    if (el) remoteVideoRefs.current.set(userId, el);
                  }}
                  autoPlay
                  playsInline
                  className="remote-video"
                />
                <div className="video-overlay">
                  <span className="participant-name">
                    {participants.find(p => p.userId === userId)?.userName || 'Participant'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Local Video */}
        <div className="local-video-container">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`local-video ${!isVideoEnabled ? 'video-off' : ''}`}
          />
          <div className="video-overlay">
            <span className="participant-name">You</span>
          </div>
          {!isVideoEnabled && (
            <div className="video-off-indicator">
              <span>📷</span>
              <p>Camera Off</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Panel */}
      {isChatOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <h3>Chat</h3>
            <button onClick={() => setIsChatOpen(false)} className="btn secondary small">✕</button>
          </div>
          
          <div className="chat-messages">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.userId === 'current-user' ? 'own' : ''}`}>
                <div className="message-header">
                  <span className="sender-name">{msg.userName}</span>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">{msg.message}</div>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              className="chat-input"
            />
            <button type="submit" className="btn primary small">Send</button>
          </form>
        </div>
      )}

      {/* Controls */}
      <div className="call-controls">
        <div className="control-group">
          <button
            onClick={toggleAudio}
            className={`btn control-btn ${!isAudioEnabled ? 'disabled' : ''}`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? '🎤' : '🎤'}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`btn control-btn ${!isVideoEnabled ? 'disabled' : ''}`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? '📹' : '📹'}
          </button>
          
          <button
            onClick={toggleScreenShare}
            className={`btn control-btn ${isScreenSharing ? 'active' : ''}`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            🖥️
          </button>
        </div>

        <button
          onClick={handleEndCall}
          className="btn danger end-call-btn"
          title="End call"
        >
          📞 End Call
        </button>
      </div>
    </div>
  );
};

export default VideoCallRoom;
