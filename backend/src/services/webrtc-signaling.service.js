import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto-js';

class WebRTCSignalingServer {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.rooms = new Map(); // Store active rooms
    this.users = new Map(); // Store connected users
    this.sessionLogs = new Map(); // Store session metadata for audit

    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.use(this.authenticateSocket.bind(this));

    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.userId}`);
      
      // Store user info
      this.users.set(socket.id, {
        userId: socket.userId,
        userRole: socket.userRole,
        userName: socket.userName,
        connectedAt: new Date()
      });

      // Join user to their personal room for notifications
      socket.join(`user_${socket.userId}`);

      // Handle video call events
      socket.on('join-room', this.handleJoinRoom.bind(this, socket));
      socket.on('leave-room', this.handleLeaveRoom.bind(this, socket));
      socket.on('webrtc-offer', this.handleWebRTCOffer.bind(this, socket));
      socket.on('webrtc-answer', this.handleWebRTCAnswer.bind(this, socket));
      socket.on('webrtc-ice-candidate', this.handleICECandidate.bind(this, socket));
      socket.on('toggle-video', this.handleToggleVideo.bind(this, socket));
      socket.on('toggle-audio', this.handleToggleAudio.bind(this, socket));
      socket.on('screen-share', this.handleScreenShare.bind(this, socket));
      socket.on('chat-message', this.handleChatMessage.bind(this, socket));
      socket.on('call-ended', this.handleCallEnded.bind(this, socket));

      // Handle disconnection
      socket.on('disconnect', this.handleDisconnect.bind(this, socket));
    });
  }

  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.user.id;
      socket.userRole = decoded.user.role;
      socket.userName = decoded.user.name || decoded.user.email;
      
      next();
    } catch (error) {
      console.log('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  }

  handleJoinRoom(socket, data) {
    const { roomId, appointmentId } = data;
    
    if (!roomId || !appointmentId) {
      return socket.emit('error', { message: 'Room ID and Appointment ID are required' });
    }

    // Validate user has permission to join this room
    if (!this.validateRoomPermission(socket.userId, socket.userRole, appointmentId)) {
      return socket.emit('error', { message: 'Unauthorized to join this room' });
    }

    // Create or get room
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        appointmentId,
        participants: new Map(),
        createdAt: new Date(),
        chatHistory: [],
        isRecording: false
      });
    }

    const room = this.rooms.get(roomId);
    
    // Add participant to room
    room.participants.set(socket.id, {
      userId: socket.userId,
      userRole: socket.userRole,
      userName: socket.userName,
      videoEnabled: true,
      audioEnabled: true,
      joinedAt: new Date()
    });

    socket.join(roomId);
    socket.currentRoom = roomId;

    // Log session start
    this.logSessionEvent(roomId, socket.userId, 'joined', {
      timestamp: new Date(),
      userAgent: socket.handshake.headers['user-agent']
    });

    // Notify room participants
    const participantsList = Array.from(room.participants.values());
    socket.to(roomId).emit('user-joined', {
      userId: socket.userId,
      userName: socket.userName,
      userRole: socket.userRole,
      participants: participantsList
    });

    // Send room info to joining user
    socket.emit('room-joined', {
      roomId,
      participants: participantsList,
      chatHistory: room.chatHistory.slice(-50) // Last 50 messages
    });

    console.log(`User ${socket.userName} joined room ${roomId}`);
  }

  handleLeaveRoom(socket, data) {
    const { roomId } = data;
    this.leaveRoom(socket, roomId);
  }

  leaveRoom(socket, roomId = socket.currentRoom) {
    if (!roomId || !this.rooms.has(roomId)) return;

    const room = this.rooms.get(roomId);
    room.participants.delete(socket.id);

    socket.leave(roomId);
    socket.currentRoom = null;

    // Log session event
    this.logSessionEvent(roomId, socket.userId, 'left', {
      timestamp: new Date()
    });

    // Notify remaining participants
    socket.to(roomId).emit('user-left', {
      userId: socket.userId,
      participants: Array.from(room.participants.values())
    });

    // Clean up empty rooms
    if (room.participants.size === 0) {
      this.rooms.delete(roomId);
      console.log(`Room ${roomId} deleted - no participants`);
    }
  }

  handleWebRTCOffer(socket, data) {
    const { roomId, targetUserId, offer } = data;
    
    if (!this.validateRoomParticipant(socket, roomId)) return;

    // Forward offer to target user
    socket.to(roomId).emit('webrtc-offer', {
      fromUserId: socket.userId,
      fromUserName: socket.userName,
      targetUserId,
      offer
    });

    this.logSessionEvent(roomId, socket.userId, 'webrtc_offer_sent', {
      targetUserId,
      timestamp: new Date()
    });
  }

  handleWebRTCAnswer(socket, data) {
    const { roomId, targetUserId, answer } = data;
    
    if (!this.validateRoomParticipant(socket, roomId)) return;

    // Forward answer to target user
    socket.to(roomId).emit('webrtc-answer', {
      fromUserId: socket.userId,
      fromUserName: socket.userName,
      targetUserId,
      answer
    });

    this.logSessionEvent(roomId, socket.userId, 'webrtc_answer_sent', {
      targetUserId,
      timestamp: new Date()
    });
  }

  handleICECandidate(socket, data) {
    const { roomId, targetUserId, candidate } = data;
    
    if (!this.validateRoomParticipant(socket, roomId)) return;

    // Forward ICE candidate to target user
    socket.to(roomId).emit('webrtc-ice-candidate', {
      fromUserId: socket.userId,
      targetUserId,
      candidate
    });
  }

  handleToggleVideo(socket, data) {
    const { roomId, enabled } = data;
    
    if (!this.validateRoomParticipant(socket, roomId)) return;

    const room = this.rooms.get(roomId);
    const participant = room.participants.get(socket.id);
    
    if (participant) {
      participant.videoEnabled = enabled;
      
      socket.to(roomId).emit('user-video-toggled', {
        userId: socket.userId,
        videoEnabled: enabled
      });

      this.logSessionEvent(roomId, socket.userId, 'video_toggled', {
        enabled,
        timestamp: new Date()
      });
    }
  }

  handleToggleAudio(socket, data) {
    const { roomId, enabled } = data;
    
    if (!this.validateRoomParticipant(socket, roomId)) return;

    const room = this.rooms.get(roomId);
    const participant = room.participants.get(socket.id);
    
    if (participant) {
      participant.audioEnabled = enabled;
      
      socket.to(roomId).emit('user-audio-toggled', {
        userId: socket.userId,
        audioEnabled: enabled
      });

      this.logSessionEvent(roomId, socket.userId, 'audio_toggled', {
        enabled,
        timestamp: new Date()
      });
    }
  }

  handleScreenShare(socket, data) {
    const { roomId, enabled } = data;
    
    if (!this.validateRoomParticipant(socket, roomId)) return;

    socket.to(roomId).emit('user-screen-share', {
      userId: socket.userId,
      userName: socket.userName,
      enabled
    });

    this.logSessionEvent(roomId, socket.userId, 'screen_share_toggled', {
      enabled,
      timestamp: new Date()
    });
  }

  handleChatMessage(socket, data) {
    const { roomId, message, messageType = 'text' } = data;
    
    if (!this.validateRoomParticipant(socket, roomId)) return;

    const room = this.rooms.get(roomId);
    const chatMessage = {
      id: uuidv4(),
      userId: socket.userId,
      userName: socket.userName,
      userRole: socket.userRole,
      message: this.sanitizeMessage(message),
      messageType,
      timestamp: new Date(),
      encrypted: this.encryptMessage(message)
    };

    // Store in room chat history
    room.chatHistory.push(chatMessage);
    
    // Keep only last 100 messages
    if (room.chatHistory.length > 100) {
      room.chatHistory = room.chatHistory.slice(-100);
    }

    // Broadcast to room participants
    this.io.to(roomId).emit('chat-message', chatMessage);

    this.logSessionEvent(roomId, socket.userId, 'chat_message_sent', {
      messageType,
      timestamp: new Date()
    });
  }

  handleCallEnded(socket, data) {
    const { roomId, reason = 'manual' } = data;
    
    if (!this.validateRoomParticipant(socket, roomId)) return;

    // Notify all participants that call ended
    socket.to(roomId).emit('call-ended', {
      endedBy: socket.userId,
      reason,
      timestamp: new Date()
    });

    this.logSessionEvent(roomId, socket.userId, 'call_ended', {
      reason,
      timestamp: new Date()
    });

    // Clean up room
    this.leaveRoom(socket, roomId);
  }

  handleDisconnect(socket) {
    console.log(`User disconnected: ${socket.userId}`);
    
    // Leave current room if any
    if (socket.currentRoom) {
      this.leaveRoom(socket, socket.currentRoom);
    }

    // Remove from users map
    this.users.delete(socket.id);

    // Log disconnect
    if (socket.currentRoom) {
      this.logSessionEvent(socket.currentRoom, socket.userId, 'disconnected', {
        timestamp: new Date()
      });
    }
  }

  validateRoomPermission(userId, userRole, _appointmentId) {
    // In a real implementation, check database for appointment permissions
    // For now, allow doctors and patients to join any room
    return ['doctor', 'patient', 'admin'].includes(userRole);
  }

  validateRoomParticipant(socket, roomId) {
    if (!roomId || !this.rooms.has(roomId)) {
      socket.emit('error', { message: 'Invalid room' });
      return false;
    }

    const room = this.rooms.get(roomId);
    if (!room.participants.has(socket.id)) {
      socket.emit('error', { message: 'Not a participant in this room' });
      return false;
    }

    return true;
  }

  sanitizeMessage(message) {
    // Basic message sanitization
    return message.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                 .replace(/[<>]/g, '');
  }

  encryptMessage(message) {
    // Encrypt message for storage (basic implementation)
    const key = process.env.CHAT_ENCRYPTION_KEY || 'default-key';
    return crypto.AES.encrypt(message, key).toString();
  }

  logSessionEvent(roomId, userId, event, metadata = {}) {
    if (!this.sessionLogs.has(roomId)) {
      this.sessionLogs.set(roomId, []);
    }

    const log = {
      id: uuidv4(),
      roomId,
      userId,
      event,
      metadata,
      timestamp: new Date()
    };

    this.sessionLogs.get(roomId).push(log);
    
    // In production, save to database
    console.log(`Session Log [${roomId}]: ${userId} - ${event}`, metadata);
  }

  // Admin methods
  getRoomStatistics() {
    return {
      activeRooms: this.rooms.size,
      totalUsers: this.users.size,
      roomDetails: Array.from(this.rooms.values()).map(room => ({
        id: room.id,
        appointmentId: room.appointmentId,
        participantCount: room.participants.size,
        createdAt: room.createdAt,
        duration: Date.now() - room.createdAt.getTime()
      }))
    };
  }

  getSessionLogs(roomId) {
    return this.sessionLogs.get(roomId) || [];
  }
}

export default WebRTCSignalingServer;
