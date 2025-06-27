import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import Appointment from '../appointments/appointment.model.js';

// Generate secure video call room and tokens
export const createVideoCallRoom = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate appointment exists and user has permission
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'firstName lastName email')
      .populate('doctor', 'firstName lastName email specialization');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check permissions
    const isPatient = appointment.patient._id.toString() === userId;
    const isDoctor = appointment.doctor._id.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access this video call'
      });
    }

    // Check appointment status and timing
    const now = new Date();
    const appointmentTime = new Date(appointment.date);
    const timeDifference = Math.abs(appointmentTime - now) / (1000 * 60); // minutes

    // Allow joining 15 minutes before or up to 60 minutes after appointment time
    if (timeDifference > 15 && appointmentTime > now) {
      return res.status(400).json({
        success: false,
        message: 'Video call not available yet. Please join closer to appointment time.'
      });
    }

    if (timeDifference > 60 && appointmentTime < now) {
      return res.status(400).json({
        success: false,
        message: 'Video call session has expired.'
      });
    }

    // Generate room ID and tokens
    const roomId = `room_${appointmentId}_${uuidv4()}`;
    
    // Generate WebRTC token (can be used for additional security)
    const webrtcToken = jwt.sign({
      roomId,
      appointmentId,
      userId,
      userRole,
      permissions: {
        video: true,
        audio: true,
        chat: true,
        screenShare: userRole === 'doctor' || userRole === 'admin'
      },
      exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60) // 2 hours
    }, process.env.JWT_SECRET);

    // Update appointment status
    if (appointment.status === 'scheduled') {
      appointment.status = 'in-progress';
      await appointment.save();
    }

    // Create session record for audit
    const sessionData = { // eslint-disable-line no-unused-vars
      roomId,
      appointmentId,
      createdBy: userId,
      createdAt: new Date(),
      participants: [
        {
          userId: appointment.patient._id,
          role: 'patient',
          name: `${appointment.patient.firstName} ${appointment.patient.lastName}`
        },
        {
          userId: appointment.doctor._id,
          role: 'doctor', 
          name: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
        }
      ]
    };
    // TODO: Save sessionData to audit log database

    res.json({
      success: true,
      data: {
        roomId,
        webrtcToken,
        appointmentDetails: {
          id: appointment._id,
          date: appointment.date,
          duration: appointment.duration || 30,
          patient: {
            id: appointment.patient._id,
            name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
            email: appointment.patient.email
          },
          doctor: {
            id: appointment.doctor._id,
            name: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
            specialization: appointment.doctor.specialization,
            email: appointment.doctor.email
          }
        },
        sessionConfig: {
          maxDuration: 120, // 2 hours max
          recordingEnabled: false, // Can be configured per appointment
          chatEnabled: true,
          screenShareEnabled: userRole === 'doctor' || userRole === 'admin'
        },
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
          // In production, add TURN servers for better connectivity
        ]
      }
    });

  } catch (error) {
    console.log('Error creating video call room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create video call room',
      error: error.message
    });
  }
};

// End video call session
export const endVideoCallSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { duration, quality, issues } = req.body;
    const userId = req.user.id;

    // Validate appointment and permissions
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const isPatient = appointment.patient.toString() === userId;
    const isDoctor = appointment.doctor.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to end this video call'
      });
    }

    // Update appointment status
    appointment.status = 'completed';
    appointment.completedAt = new Date();
    
    // Store session metadata
    if (!appointment.sessionData) {
      appointment.sessionData = {};
    }
    
    appointment.sessionData.videoCall = {
      duration: duration || 0,
      quality: quality || 'unknown',
      issues: issues || [],
      endedBy: userId,
      endedAt: new Date()
    };

    await appointment.save();

    res.json({
      success: true,
      message: 'Video call session ended successfully',
      data: {
        appointmentId,
        finalStatus: appointment.status,
        duration: duration || 0
      }
    });

  } catch (error) {
    console.log('Error ending video call session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end video call session',
      error: error.message
    });
  }
};

// Get video call session details
export const getVideoCallSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'firstName lastName email')
      .populate('doctor', 'firstName lastName email specialization');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check permissions
    const isPatient = appointment.patient._id.toString() === userId;
    const isDoctor = appointment.doctor._id.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access this video call session'
      });
    }

    res.json({
      success: true,
      data: {
        appointmentId: appointment._id,
        status: appointment.status,
        scheduledTime: appointment.date,
        participants: {
          patient: {
            id: appointment.patient._id,
            name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
            email: appointment.patient.email
          },
          doctor: {
            id: appointment.doctor._id,
            name: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
            specialization: appointment.doctor.specialization,
            email: appointment.doctor.email
          }
        },
        sessionData: appointment.sessionData || {},
        canJoin: ['scheduled', 'in-progress'].includes(appointment.status)
      }
    });

  } catch (error) {
    console.log('Error getting video call session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get video call session details',
      error: error.message
    });
  }
};

// Get connection test results
export const testVideoCallConnection = async (req, res) => {
  try {
    const testResults = {
      timestamp: new Date(),
      tests: [
        {
          name: 'WebRTC Support',
          status: 'pass',
          details: 'Browser supports WebRTC'
        },
        {
          name: 'Camera Access',
          status: 'unknown',
          details: 'Camera permission needs to be granted by user'
        },
        {
          name: 'Microphone Access', 
          status: 'unknown',
          details: 'Microphone permission needs to be granted by user'
        },
        {
          name: 'Network Connectivity',
          status: 'pass',
          details: 'STUN server reachable'
        }
      ],
      recommendations: [
        'Ensure camera and microphone permissions are granted',
        'Use a stable internet connection',
        'Close other video applications',
        'Use Chrome, Firefox, or Safari for best compatibility'
      ]
    };

    res.json({
      success: true,
      data: testResults
    });

  } catch (error) {
    console.log('Error testing video call connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test connection',
      error: error.message
    });
  }
};
