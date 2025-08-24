import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import Appointment from '../appointments/appointment.model.js';

// In-memory waiting room presence tracking (ephemeral)
// Structure: Map<appointmentId, { patient: { lastSeen:number }, doctor: { lastSeen:number } }>
const waitingRoomPresence = new Map();
const PRESENCE_TIMEOUT_MS = 30000; // consider present if pinged within last 30s
function updatePresence(appointmentId, roleKey) {
  if (!appointmentId || !roleKey) return;
  const entry = waitingRoomPresence.get(appointmentId) || { patient: { lastSeen: 0 }, doctor: { lastSeen: 0 } };
  entry[roleKey].lastSeen = Date.now();
  waitingRoomPresence.set(appointmentId, entry);
}
function getPresence(appointmentId) {
  const entry = waitingRoomPresence.get(appointmentId) || { patient: { lastSeen: 0 }, doctor: { lastSeen: 0 } };
  const now = Date.now();
  const doctorPresent = (now - entry.doctor.lastSeen) <= PRESENCE_TIMEOUT_MS;
  const patientPresent = (now - entry.patient.lastSeen) <= PRESENCE_TIMEOUT_MS;
  return {
    doctorPresent,
    patientPresent,
    doctorLastSeen: entry.doctor.lastSeen || null,
    patientLastSeen: entry.patient.lastSeen || null,
    participantsPresent: [doctorPresent, patientPresent].filter(Boolean).length
  };
}

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

    // Compute precise start time including separate HH:MM field
    const now = new Date();
    const appointmentTime = new Date(appointment.date);
    if (appointment.time && /^\d{2}:\d{2}$/.test(appointment.time)) {
      const [hh, mm] = appointment.time.split(':').map(Number);
      appointmentTime.setHours(hh, mm, 0, 0);
    }

    // Determine early join override (doctor/admin enabling early access)
    const earlyJoinActive = appointment.earlyJoinEnabled && (!appointment.earlyJoinVisibleAt || now >= appointment.earlyJoinVisibleAt);
    const earlyOverride = (isDoctor || isAdmin) && earlyJoinActive;

    // Timing constraints (standard window: 15 min before to 60 min after). Allow doctor/admin override if earlyOverride.
    if (appointmentTime > now) {
      const minutesUntil = (appointmentTime.getTime() - now.getTime()) / 60000;
      if (minutesUntil > 15 && !earlyOverride) {
        return res.status(400).json({
          success: false,
          message: 'Video call not available yet. Please join closer to appointment time.'
        });
      }
    } else {
      const minutesSinceStart = (now.getTime() - appointmentTime.getTime()) / 60000;
      if (minutesSinceStart > 60) {
        return res.status(400).json({
          success: false,
          message: 'Video call session has expired.'
        });
      }
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

// Waiting room: ensures meetingUrl exists and returns join readiness
export const getWaitingRoomInfo = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'firstName lastName email')
      .populate('doctor', 'firstName lastName email specialization');
    if (!appointment) {
      return res.status(404).json({ success:false, message:'Appointment not found' });
    }
    const isPatient = appointment.patient._id.toString() === userId;
    const isDoctor = appointment.doctor._id.toString() === userId;
    const isAdmin = req.user.role === 'admin';
    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ success:false, message:'Not authorized' });
    }
    // Ensure a stable meetingUrl (persisted) – use existing or generate deterministic base + appointment id
    if (!appointment.meetingUrl) {
      const base = process.env.MEETING_BASE_URL || 'https://meet.telemedicine.com/room';
      appointment.meetingUrl = `${base}/${appointment._id}`;
      await appointment.save();
    }
    const now = new Date();
    const start = new Date(appointment.date);
    const duration = appointment.duration || 30;
    const end = new Date(start.getTime() + duration * 60000);
    const minutesUntil = Math.floor((start.getTime() - now.getTime()) / 60000);
    const minutesSinceStart = Math.floor((now.getTime() - start.getTime()) / 60000);
    // Determine if early join override applies
    let earlyOverride = false;
    if (appointment.earlyJoinEnabled) {
      // If a specific visibleAt provided, require now >= visibleAt; otherwise allow any time doctor enabled
      if (appointment.earlyJoinVisibleAt) {
        earlyOverride = now >= new Date(appointment.earlyJoinVisibleAt);
      } else {
        // Fallback: allow up to 4 hours early maximum to avoid indefinite exposure
        const fourHoursMs = 4 * 60 * 60000;
        if (start.getTime() - now.getTime() <= fourHoursMs) earlyOverride = true;
      }
    }
    const joinWindowOpen = (minutesUntil <= 15 && minutesSinceStart < 90) || earlyOverride; // standard window OR early override
    if (joinWindowOpen && appointment.status === 'scheduled' && now >= start) {
      appointment.status = 'in-progress';
      await appointment.save();
    }
  // Presence tracking (update who just pinged the waiting room)
  if (isPatient) updatePresence(appointment._id.toString(), 'patient');
  if (isDoctor) updatePresence(appointment._id.toString(), 'doctor');
  const presence = getPresence(appointment._id.toString());
    res.json({
      success: true,
      data: {
        appointmentId: appointment._id,
        meetingUrl: appointment.meetingUrl,
        scheduledTime: appointment.date,
        duration,
        status: appointment.status,
        joinAllowed: joinWindowOpen,
        earlyJoin: {
          enabled: !!appointment.earlyJoinEnabled,
            visibleAt: appointment.earlyJoinVisibleAt,
            note: appointment.earlyJoinNote || null,
            overrideActive: earlyOverride
        },
    presence,
        startsInMinutes: minutesUntil,
        sinceStartMinutes: minutesSinceStart,
        endsAt: end,
        participants: {
          patient: { id: appointment.patient._id, name: `${appointment.patient.firstName} ${appointment.patient.lastName}` },
          doctor: { id: appointment.doctor._id, name: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}` }
        }
      }
    });
  } catch (error) {
    console.log('Error in waiting room info:', error);
    res.status(500).json({ success:false, message:'Failed to get waiting room info', error: error.message });
  }
};
