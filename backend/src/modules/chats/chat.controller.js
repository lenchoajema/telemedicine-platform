import { ChatSession, ChatMessage } from './chat.model.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getIO } from '../../services/socket.service.js';
import { encryptContent, decryptContent } from '../../services/crypto.service.js';
import AuditService from '../../services/AuditService.js';
import User from '../../models/User.js';
dotenv.config();

// GET /api/chats/sessions - list sessions for user
export const getSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ participants: req.user._id })
      .populate('participants', 'profile.firstName profile.lastName');
    res.json({ success: true, data: sessions });
  } catch (error) {
    console.log('Error fetching chat sessions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
  }
};

// Create or join a chat session with participants
export const createSession = async (req, res) => {
  try {
    const { participants, appointmentId } = req.body; // expect array of userIds and optional appointmentId
    if (!participants || participants.length < 2) {
      return res.status(400).json({ success: false, message: 'At least two participants required' });
    }

    // Check if a session with same participants and appointment already exists
    // Try existing session
    let session = await ChatSession.findOne({
      participants: { $all: participants.map(String) },
      appointmentId: appointmentId || null
    });
    if (session) {
      // Populate participant profiles
      await session.populate('participants', 'profile.firstName profile.lastName');
      return res.status(200).json({ success: true, data: session });
    }
    // Create new session
    session = new ChatSession({ participants, appointmentId: appointmentId || null });
    await session.save();
    // Audit log chat session creation
    AuditService.log(req.user._id, req.user.role, 'create_session', 'chat_session', session._id, { participants, appointmentId }, null, req);
    // Populate participant profiles
    await session.populate('participants', 'profile.firstName profile.lastName');
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    console.log('Error creating chat session:', error);
    res.status(500).json({ success: false, message: 'Failed to create session' });
  }
};

// Get messages for a session
export const getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    // Ensure user is participant
    const session = await ChatSession.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!session.participants.includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized to view messages' });
    }
    const messages = await ChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .populate('sender', 'profile.email profile.firstName profile.lastName');
    // Decrypt message content
    const output = messages.map(m => ({ ...m.toObject(), content: decryptContent(m.content) }));
    // Audit log message fetch
    AuditService.log(req.user._id, req.user.role, 'fetch_messages', 'chat_session', sessionId, {}, null, req);
    res.json({ success: true, data: output });
  } catch (error) {
    console.log('Error fetching chat messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

// Send a message in a session
export const postMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }
    const session = await ChatSession.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!session.participants.includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized to send message' });
    }
    const encrypted = encryptContent(content);
    // Determine recipient as the other participant in session
    const otherParticipant = session.participants.find(p => p.toString() !== req.user._id.toString());
    const message = new ChatMessage({ sessionId, sender: req.user._id, receiver: otherParticipant, content: encrypted });
    await message.save();
    // Populate sender for UI
    await message.populate('sender', 'profile.firstName profile.lastName');
    // Decrypt content for real-time delivery
    const decryptedContent = decryptContent(message.content);
    const emitData = { ...message.toObject(), content: decryptedContent };
    // Audit log message post
    AuditService.log(req.user._id, req.user.role, 'post_message', 'chat_message', message._id, { sessionId }, null, req);
    // Broadcast new message to session room
    getIO().to(`session_${sessionId}`).emit('new_message', emitData);
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.log('Error posting chat message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// GET /api/messages?appointmentId={id}&since={ts}
export const fetchMessages = async (req, res) => {
  try {
    const { appointmentId, since } = req.query;
    const filter = {};
    if (appointmentId) filter.appointmentId = appointmentId;
    if (since) filter.createdAt = { $gt: new Date(since) };
    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: 1 })
      .populate('sender', 'profile.firstName profile.lastName')
      .populate('receiver', 'profile.firstName profile.lastName');
    // Decrypt message content
    const output = messages.map(m => ({ ...m.toObject(), content: decryptContent(m.content) }));
    // Audit log general message fetch
    AuditService.log(req.user._id, req.user.role, 'fetch_general_messages', 'chat_message', null, { appointmentId, since }, null, req);
    res.json({ success: true, data: output });
  } catch (error) {
    console.log('Error fetching messages by query:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

// POST /api/messages
export const sendGeneralMessage = async (req, res) => {
  try {
  const { senderId, receiverId, appointmentId, content, attachmentUrl, targetType, targetId } = req.body;
    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const encrypted = encryptContent(content);
  const message = new ChatMessage({ sender: senderId, receiver: receiverId, appointmentId: appointmentId || null, content: encrypted, attachmentUrl, targetType: targetType || null, targetId: targetId || null });
    await message.save();
    // Populate sender and receiver for UI
    await message.populate('sender', 'profile.firstName profile.lastName');
    await message.populate('receiver', 'profile.firstName profile.lastName');
    // Decrypt content for real-time delivery
    const decryptedContent = decryptContent(message.content);
    const emitData = { ...message.toObject(), content: decryptedContent };
    // Audit log general message send
  AuditService.log(senderId, null, 'send_general_message', 'chat_message', message._id, { receiverId, appointmentId, targetType, targetId }, null, req);
    // Broadcast general message to receiver's user room
    getIO().to(`user_${receiverId}`).emit('new_general_message', emitData);
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.log('Error sending general message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// PATCH /api/messages/:messageId/read
export const markMessageRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await ChatMessage.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    message.isRead = true;
    await message.save();
    // Audit log read receipt
    AuditService.log(req.user._id, req.user.role, 'mark_read', 'chat_message', message._id, {}, null, req);
    res.json({ success: true, data: message });
  } catch (error) {
    console.log('Error marking message read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark message as read' });
  }
};

// GET /api/chats/support-session - fetch or create support chat session
export const getSupportSession = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    let supportId = process.env.SUPPORT_USER_ID || null;

    // Validate configured SUPPORT_USER_ID
    let supportUser = null;
    if (supportId) {
      if (!mongoose.Types.ObjectId.isValid(supportId)) {
  console.log('[chat] Invalid SUPPORT_USER_ID format:', supportId);
        supportId = null;
      } else {
        supportUser = await User.findById(supportId, 'profile.firstName profile.lastName status role');
        if (!supportUser || !['Active','active'].includes(supportUser.status)) {
          console.log('[chat] SUPPORT_USER_ID not found or inactive, falling back to admin.');
          supportId = null;
        }
      }
    }

    // Fallback: pick an active admin
    if (!supportId) {
      supportUser = await User.findOne({ role: 'admin', status: { $in: ['Active','active'] } }, 'profile.firstName profile.lastName status role');
      if (supportUser) supportId = supportUser._id.toString();
    }

    if (!supportId) {
      return res.status(404).json({ success: false, message: 'Support user unavailable' });
    }

    // Ensure we have supportUser populated
    if (!supportUser) {
      supportUser = await User.findById(supportId, 'profile.firstName profile.lastName status role');
    }

    // find existing session between user and support (exclude self-support case)
    if (supportId === userId) {
      return res.status(400).json({ success: false, message: 'User cannot create support session with self' });
    }

    let session = await ChatSession.findOne({
      participants: { $all: [userId, supportId] },
      appointmentId: null
    });
    if (!session) {
      session = new ChatSession({ participants: [userId, supportId], appointmentId: null });
      await session.save();
    }
    await session.populate('participants', 'profile.firstName profile.lastName');
    AuditService.log(req.user._id, req.user.role, 'support_session', 'chat_session', session._id, { fallbackUsed: process.env.SUPPORT_USER_ID ? false : true }, null, req);
    res.json({ success: true, data: session });
  } catch (error) {
    console.log('Error getting support session:', error);
    res.status(500).json({ success: false, message: 'Failed to get support session' });
  }
};

// GET /api/chats/contacts - list healthcare providers, support, and others
export const getContacts = async (req, res) => {
  try {
    // Healthcare providers (doctors)
    const providers = await User.find(
      { role: 'doctor', status: { $in: ['Active', 'active'] } },
      'profile.firstName profile.lastName email'
    );
    // Support user
    const supportId = process.env.SUPPORT_USER_ID;
    let support = null;
    if (supportId) {
      support = await User.findById(
        supportId,
        'profile.firstName profile.lastName email status'
      );
      if (support && !['Active','active'].includes(support.status)) {
        support = null;
      }
    }
    // Other users (patients, admins, etc.)
    const others = await User.find(
      { role: { $nin: ['doctor'] }, status: { $in: ['Active', 'active'] } },
      'profile.firstName profile.lastName email role'
    );
    res.json({ success: true, data: { providers, support, others } });
  } catch (error) {
    console.log('Error fetching contacts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
  }
};
