import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const useWebRTC = (roomId, userToken, appointmentId) => {
  const [socket, setSocket] = useState(null);
  const [peers, setPeers] = useState(new Map());
  const [localStream, setLocalStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [connectionQuality, setConnectionQuality] = useState('unknown');
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const peersRef = useRef(new Map());
  const localStreamRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!roomId || !userToken) return;

    const socketInstance = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token: userToken },
      transports: ['websocket']
    });

    socketInstance.on('connect', () => {
      console.log('Connected to signaling server');
      setIsConnected(true);
      setError(null);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from signaling server');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.log('Socket connection error:', err);
      setError('Failed to connect to video call server');
    });

    // WebRTC signaling events
    socketInstance.on('room-joined', (data) => {
      console.log('Room joined successfully', data);
      setParticipants(data.participants);
      setChatMessages(data.chatHistory || []);
    });

    socketInstance.on('user-joined', (data) => {
      console.log('User joined room', data);
      setParticipants(data.participants);
      
      // If we have local stream, create peer connection for new user
      if (localStreamRef.current) {
        createPeerConnection(data.userId, false);
      }
    });

    socketInstance.on('user-left', (data) => {
      console.log('User left room', data);
      setParticipants(data.participants);
      
      // Clean up peer connection
      const peer = peersRef.current.get(data.userId);
      if (peer) {
        peer.destroy();
        peersRef.current.delete(data.userId);
        setPeers(new Map(peersRef.current));
      }
    });

    socketInstance.on('webrtc-offer', (data) => {
      console.log('Received WebRTC offer from', data.fromUserId);
      if (localStreamRef.current) {
        createPeerConnection(data.fromUserId, false, data.offer);
      }
    });

    socketInstance.on('webrtc-answer', (data) => {
      console.log('Received WebRTC answer from', data.fromUserId);
      const peer = peersRef.current.get(data.fromUserId);
      if (peer) {
        peer.signal(data.answer);
      }
    });

    socketInstance.on('webrtc-ice-candidate', (data) => {
      const peer = peersRef.current.get(data.fromUserId);
      if (peer) {
        peer.signal(data.candidate);
      }
    });

    socketInstance.on('user-video-toggled', (data) => {
      console.log('User toggled video', data);
      // Update UI to show/hide remote video
    });

    socketInstance.on('user-audio-toggled', (data) => {
      console.log('User toggled audio', data);
      // Update UI to show/hide audio indicator
    });

    socketInstance.on('user-screen-share', (data) => {
      console.log('User toggled screen share', data);
      // Handle screen sharing
    });

    socketInstance.on('chat-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    socketInstance.on('call-ended', (data) => {
      console.log('Call ended by', data.endedBy);
      cleanup();
    });

    socketInstance.on('error', (error) => {
      console.log('Socket error:', error);
      setError(error.message);
    });

    setSocket(socketInstance);

    return () => {
      cleanup();
      socketInstance.disconnect();
    };
  }, [roomId, userToken]);

  // Get user media
  const initializeLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setLocalStream(stream);
      localStreamRef.current = stream;
      
      // Monitor connection quality
      monitorConnectionQuality();
      
      return stream;
    } catch (error) {
      console.log('Failed to get user media:', error);
      setError('Failed to access camera/microphone. Please check permissions.');
      throw error;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((userId, initiator, offer = null) => {
    if (!localStreamRef.current) return;

    const peer = new Peer({
      initiator,
      trickle: false,
      stream: localStreamRef.current,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', (signal) => {
      if (signal.type === 'offer') {
        socket?.emit('webrtc-offer', {
          roomId,
          targetUserId: userId,
          offer: signal
        });
      } else if (signal.type === 'answer') {
        socket?.emit('webrtc-answer', {
          roomId,
          targetUserId: userId,
          answer: signal
        });
      } else {
        socket?.emit('webrtc-ice-candidate', {
          roomId,
          targetUserId: userId,
          candidate: signal
        });
      }
    });

    peer.on('stream', (remoteStream) => {
      console.log('Received remote stream from', userId);
      // Stream will be handled by video components
    });

    peer.on('error', (err) => {
      console.log('Peer connection error:', err);
      setError(`Connection error with participant`);
    });

    peer.on('close', () => {
      console.log('Peer connection closed for', userId);
    });

    if (offer) {
      peer.signal(offer);
    }

    peersRef.current.set(userId, peer);
    setPeers(new Map(peersRef.current));

    return peer;
  }, [socket, roomId]);

  // Join room
  const joinRoom = useCallback(async () => {
    if (!socket || !roomId) return;

    try {
      await initializeLocalStream();
      
      socket.emit('join-room', {
        roomId,
        appointmentId
      });
    } catch (error) {
      setError('Failed to join video call');
    }
  }, [socket, roomId, appointmentId, initializeLocalStream]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (socket && roomId) {
      socket.emit('leave-room', { roomId });
    }
    cleanup();
  }, [socket, roomId]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
      
      socket?.emit('toggle-video', {
        roomId,
        enabled: !isVideoEnabled
      });
    }
  }, [socket, roomId, isVideoEnabled]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
      
      socket?.emit('toggle-audio', {
        roomId,
        enabled: !isAudioEnabled
      });
    }
  }, [socket, roomId, isAudioEnabled]);

  // Screen sharing
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen sharing, return to camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        setLocalStream(stream);
        localStreamRef.current = stream;
        
        // Update all peer connections with new stream
        peersRef.current.forEach(peer => {
          peer.replaceTrack(
            peer.streams[0].getVideoTracks()[0],
            stream.getVideoTracks()[0],
            peer.streams[0]
          );
        });
        
        setIsScreenSharing(false);
      } catch (error) {
        setError('Failed to stop screen sharing');
      }
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        setLocalStream(screenStream);
        localStreamRef.current = screenStream;
        
        // Update all peer connections with screen stream
        peersRef.current.forEach(peer => {
          peer.replaceTrack(
            peer.streams[0].getVideoTracks()[0],
            screenStream.getVideoTracks()[0],
            peer.streams[0]
          );
        });
        
        setIsScreenSharing(true);
        
        // Listen for screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare(); // This will switch back to camera
        };
      } catch (error) {
        setError('Failed to start screen sharing');
      }
    }
    
    socket?.emit('screen-share', {
      roomId,
      enabled: !isScreenSharing
    });
  }, [socket, roomId, isScreenSharing, toggleScreenShare]);

  // Send chat message
  const sendChatMessage = useCallback((message) => {
    if (socket && message.trim()) {
      socket.emit('chat-message', {
        roomId,
        message: message.trim(),
        messageType: 'text'
      });
    }
  }, [socket, roomId]);

  // End call
  const endCall = useCallback(() => {
    if (socket) {
      socket.emit('call-ended', {
        roomId,
        reason: 'manual'
      });
    }
    cleanup();
  }, [socket, roomId]);

  // Monitor connection quality
  const monitorConnectionQuality = useCallback(() => {
    // This would typically analyze WebRTC stats
    // For now, we'll use a simple implementation
    const interval = setInterval(() => {
      if (peersRef.current.size > 0) {
        // In a real implementation, check RTCPeerConnection.getStats()
        setConnectionQuality('good');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Close all peer connections
    peersRef.current.forEach(peer => peer.destroy());
    peersRef.current.clear();
    setPeers(new Map());

    // Reset state
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
    setIsScreenSharing(false);
    setParticipants([]);
    setChatMessages([]);
    setConnectionQuality('unknown');
  }, []);

  return {
    // State
    localStream,
    peers,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    chatMessages,
    participants,
    connectionQuality,
    error,
    isConnected,

    // Actions
    joinRoom,
    leaveRoom,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    sendChatMessage,
    endCall,
    initializeLocalStream
  };
};

export default useWebRTC;
