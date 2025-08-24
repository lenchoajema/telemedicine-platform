import Appointment from "./appointment.model.js";
import AppointmentSlot from "../appointment-slots/appointment-slot.model.js";
import Doctor from "../doctors/doctor.model.js";
import AuditService from "../../services/AuditService.js";
import User from "../../models/User.js";
import DoctorAvailability from "../doctors/availability.model.js";
import AppointmentLifecycle from './appointment-lifecycle.model.js';
import AppointmentLifecycleEvent from './appointment-lifecycle-event.model.js';
import NotificationService from '../../services/NotificationService.js';

// Create a new appointment
export const createAppointment = async (req, res) => {
  const { reason, symptoms, caseDetails, slotId, slotHash, medicalDocumentId, medicalDocumentIds } = req.body;
  const patientId = req.user.id;

  if (!slotId) {
    return res.status(400).json({
      success: false,
      message: "Slot ID is required.",
    });
  }

  try {
  // Retrieve the appointment slot and corresponding doctor profile
  const slot = await AppointmentSlot.findById(slotId);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Appointment slot not found.",
      });
    }

    if (!slot.isAvailable) {
      return res.status(409).json({
        success: false,
        message: "Appointment slot is no longer available.",
      });
    }

    // Enforce slot integrity if slotHash present in DB
    if (slot.slotHash) {
      if (!slotHash) {
        return res.status(400).json({ success:false, message:'slotHash required for integrity verification'});
      }
      if (slot.slotHash !== slotHash) {
        return res.status(409).json({ success:false, message:'Slot integrity verification failed (hash mismatch)'});
      }
    }

  // Resolve doctor user ID from Doctor profile and enforce approval/activation
    const doctorProfile = await Doctor.findById(slot.doctor);
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: "Doctor profile not found for this slot." });
    }

    // Enforce doctor verification (must be approved)
    const isApproved = typeof doctorProfile.verificationStatus === "string" && /^approved$/i.test(doctorProfile.verificationStatus);
    if (!isApproved) {
      return res.status(403).json({
        success: false,
        message: "Doctor is not approved by admin and cannot be booked.",
      });
    }

    // Load linked user to verify account status is Active
    const doctorUserId = doctorProfile.user;
    if (!doctorUserId) {
      return res.status(500).json({ success: false, message: "Invalid doctor reference" });
    }
    const doctorUser = await User.findById(doctorUserId).select("status role");
    if (!doctorUser) {
      return res.status(404).json({ success: false, message: "Doctor user account not found." });
    }
    const isActive = typeof doctorUser.status === "string" && /^active$/i.test(doctorUser.status);
    if (!isActive) {
      return res.status(403).json({
        success: false,
        message: "Doctor account is not active and cannot be booked.",
      });
    }

    // Enforce that doctor has active availability covering this slot's day/time
    const dayMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = dayMap[new Date(slot.date).getDay()];
    const coveringAvailability = await DoctorAvailability.findOne({
      doctor: doctorUserId,
      day: dayName,
      isActive: true,
      startTime: { $lte: slot.startTime },
      endTime: { $gt: slot.startTime },
    });
    if (!coveringAvailability) {
      return res.status(409).json({
        success: false,
        message: "Doctor has no active availability for the selected time.",
      });
    }
    const appointment = new Appointment({
      doctor: doctorUserId,
      patient: patientId,
      date: slot.date,
      time: slot.startTime,
      reason: reason,
      symptoms: symptoms,
      caseDetails: caseDetails,
      timeSlot: slotId,
      status: "scheduled",
    });

    await appointment.save();
    // Initialize lifecycle and emit AppointmentBooked
    try {
      const lifecycle = await AppointmentLifecycle.create({
        appointmentId: appointment._id,
        patientId,
        doctorId: doctorUserId,
        currentStatus: 'Booked'
      });
      await AppointmentLifecycleEvent.create({
        lifecycleId: lifecycle.lifecycleId,
        eventType: 'AppointmentBooked',
        actorId: patientId,
        payload: { appointmentId: String(appointment._id), slotId: String(slotId) }
      });
      // Notifications
      try { await NotificationService.dispatchEvent('AppointmentBooked', 'New appointment booked.', doctorUserId); } catch { /* noop */ }
      try { await NotificationService.dispatchEvent('AppointmentBooked', 'Your appointment has been booked.', patientId); } catch { /* noop */ }
    } catch (e) {
      console.log('Lifecycle init failed (non-fatal):', e?.message || e);
    }
    // Attach uploaded documents to appointment
    if (Array.isArray(medicalDocumentIds) && medicalDocumentIds.length) {
      appointment.medicalDocuments = medicalDocumentIds;
      await appointment.save();
    } else if (medicalDocumentId) {
      appointment.medicalDocuments = [medicalDocumentId];
      await appointment.save();
    }

    slot.isAvailable = false;
    await slot.save();

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully.",
      data: appointment,
    });
  } catch (error) {
    console.log("Error creating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to book appointment. Please try again.",
    });
  }
};

// Get all appointments for the logged-in user (patient or doctor)
export const getAppointments = async (req, res) => {
  try {
    const { user } = req;
    let query = {};
    
    if (user.role === 'patient') {
      query.patient = user._id;
    } else if (user.role === 'doctor') {
      const doctorDoc = await Doctor.findOne({ user: user._id });
      const doctorQueries = [{ doctor: user._id }];
      if (doctorDoc) {
        doctorQueries.push({ doctor: doctorDoc._id });
      }
      query = { $or: doctorQueries };
    }
    
    const appointments = await Appointment.find(query)
      .populate('patient', 'profile.firstName profile.lastName email')
      .populate('doctor', 'profile.firstName profile.lastName email')
      .populate('medicalDocuments')
      .sort({ date: 1 });

    const enhancedAppointments = await Promise.all(appointments.map(async (appointment) => {
      const appointmentObj = appointment.toObject();
      if (appointmentObj.doctor) {
        const doctorDoc = await Doctor.findOne({ user: appointmentObj.doctor._id })
          .select('specialization licenseNumber experience bio rating');
        
        if (doctorDoc) {
          appointmentObj.doctor.specialization = doctorDoc.specialization;
          appointmentObj.doctor.licenseNumber = doctorDoc.licenseNumber;
          appointmentObj.doctor.experience = doctorDoc.experience;
          appointmentObj.doctor.bio = doctorDoc.bio;
          appointmentObj.doctor.rating = doctorDoc.rating;
        }
      }
  // Include early join metadata passthrough
  appointmentObj.earlyJoinEnabled = appointment.earlyJoinEnabled;
  appointmentObj.earlyJoinVisibleAt = appointment.earlyJoinVisibleAt;
  appointmentObj.earlyJoinNote = appointment.earlyJoinNote;
      return appointmentObj;
    }));
    
    res.status(200).json({ success: true, data: enhancedAppointments });
  } catch (error) {
    console.log('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Get a single appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id)
      .populate('patient', 'profile.firstName profile.lastName email')
      .populate('doctor', 'profile.firstName profile.lastName email')
      .populate('medicalDocuments');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointmentObj = appointment.toObject();
    if (appointmentObj.doctor) {
      const doctorDoc = await Doctor.findOne({ user: appointmentObj.doctor._id })
        .select('specialization licenseNumber experience bio rating');
      
      if (doctorDoc) {
        appointmentObj.doctor.specialization = doctorDoc.specialization;
        appointmentObj.doctor.licenseNumber = doctorDoc.licenseNumber;
        appointmentObj.doctor.experience = doctorDoc.experience;
        appointmentObj.doctor.bio = doctorDoc.bio;
        appointmentObj.doctor.rating = doctorDoc.rating;
      }
    }
    
    res.status(200).json({ success: true, data: appointmentObj });
  } catch (error) {
    console.log('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};

// Update an appointment
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
  const { status, notes, meetingUrl, reason, symptoms, medicalDocumentId, earlyJoinEnabled, earlyJoinVisibleAt, earlyJoinNote } = req.body;
    
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    if (notes && req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can add notes' });
    }
    
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this appointment' });
    }
    
    if (req.user.role === 'doctor') {
      let isDoctorAuthorized = appointment.doctor.toString() === req.user._id.toString();
      
      if (!isDoctorAuthorized) {
        const doctorDoc = await Doctor.findOne({ user: req.user._id });
        if (doctorDoc) {
          isDoctorAuthorized = appointment.doctor.toString() === doctorDoc._id.toString();
        }
      }
      
      if (!isDoctorAuthorized) {
        return res.status(403).json({ error: 'Not authorized to update this appointment' });
      }
    }
    
    // Capture previous state for audit
    const previous = appointment.toObject();
    // Perform update
    // Update appointment fields based on user role
    if (req.user.role === 'patient') {
      // Patients can update reason, symptoms, and attach documents
      if (reason !== undefined) appointment.reason = reason;
      if (symptoms !== undefined) appointment.symptoms = symptoms;
      if (medicalDocumentId) appointment.medicalDocuments = appointment.medicalDocuments.concat([medicalDocumentId]);
    } else {
      // Doctors and admins can update all fields
      if (status) appointment.status = status;
      if (notes !== undefined) appointment.notes = notes;
      if (meetingUrl !== undefined) appointment.meetingUrl = meetingUrl;
      if (reason !== undefined) appointment.reason = reason;
      if (symptoms !== undefined) appointment.symptoms = symptoms;
      if (medicalDocumentId) appointment.medicalDocuments = appointment.medicalDocuments.concat([medicalDocumentId]);
      // Early join controls
      if (earlyJoinEnabled !== undefined) {
        appointment.earlyJoinEnabled = !!earlyJoinEnabled;
      }
      if (earlyJoinVisibleAt !== undefined) {
        const dt = earlyJoinVisibleAt ? new Date(earlyJoinVisibleAt) : null;
        const normalized = dt && !isNaN(dt.getTime()) ? dt : null;
        appointment.earlyJoinVisibleAt = normalized;
      }
      if (earlyJoinNote !== undefined) appointment.earlyJoinNote = earlyJoinNote;
    }
    appointment.updatedAt = Date.now();
    await appointment.save();
    // After save, if early join just became active, notify patient
    try {
      const now = new Date();
      const isActiveEarly = appointment.earlyJoinEnabled && (!appointment.earlyJoinVisibleAt || now >= appointment.earlyJoinVisibleAt);
      const wasActiveEarly = previous.earlyJoinEnabled && (!previous.earlyJoinVisibleAt || now >= previous.earlyJoinVisibleAt);
      if (isActiveEarly && !wasActiveEarly) {
        await NotificationService.dispatchEvent(
          'EarlyJoinEnabled',
          appointment.earlyJoinNote || 'Your doctor opened early access to the waiting room.',
          appointment.patient
        );
      }
    } catch (e) {
      console.log('Early join notification dispatch failed (non-fatal):', e?.message || e);
    }

    // Reload with populated relations
    const updatedAppointment = await Appointment.findById(id)
      .populate('patient', 'profile.firstName profile.lastName email')
      .populate('doctor', 'profile.firstName profile.lastName profile.specialization email')
      .populate('medicalDocuments');

    // Audit the update
    await AuditService.log(
      req.user._id,
      req.user.role,
      'appointment_updated',
      'appointment',
      updatedAppointment._id,
      { status, notes, meetingUrl, reason, symptoms, medicalDocumentId, earlyJoinEnabled, earlyJoinVisibleAt, earlyJoinNote },
      {
        before: { status: previous.status, notes: previous.notes, meetingUrl: previous.meetingUrl, reason: previous.reason, symptoms: previous.symptoms, medicalDocuments: previous.medicalDocuments, earlyJoinEnabled: previous.earlyJoinEnabled, earlyJoinVisibleAt: previous.earlyJoinVisibleAt, earlyJoinNote: previous.earlyJoinNote },
        after: { status: updatedAppointment.status, notes: updatedAppointment.notes, meetingUrl: updatedAppointment.meetingUrl, reason: updatedAppointment.reason, symptoms: updatedAppointment.symptoms, medicalDocuments: updatedAppointment.medicalDocuments, earlyJoinEnabled: updatedAppointment.earlyJoinEnabled, earlyJoinVisibleAt: updatedAppointment.earlyJoinVisibleAt, earlyJoinNote: updatedAppointment.earlyJoinNote }
      },
      req
    );
    
    res.status(200).json({ success: true, data: updatedAppointment });
  } catch (error) {
    console.log('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

// Cancel an appointment
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
    }
    
    if (req.user.role === 'doctor') {
      let isDoctorAuthorized = appointment.doctor.toString() === req.user._id.toString();
      
      if (!isDoctorAuthorized) {
        const doctorDoc = await Doctor.findOne({ user: req.user._id });
        if (doctorDoc) {
          isDoctorAuthorized = appointment.doctor.toString() === doctorDoc._id.toString();
        }
      }
      
      if (!isDoctorAuthorized) {
        return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
      }
    }
    
    appointment.status = 'cancelled';
    appointment.updatedAt = Date.now();
    
  if (appointment.timeSlot) {
    await AppointmentSlot.findByIdAndUpdate(appointment.timeSlot, { 
            isAvailable: true,
        });
    }
    
    await appointment.save();
    
    res.status(200).json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.log('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

// Get all appointments for a specific doctor
export const getDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const appointments = await Appointment.find({ doctor: doctorId })
      .populate('patient', 'profile.firstName profile.lastName email')
      .sort({ date: 1 });
      
    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    console.log('Error fetching doctor appointments:', error);
    res.status(500).json({ error: 'Failed to fetch doctor appointments' });
  }
};

// Get all appointments for a specific patient
export const getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const appointments = await Appointment.find({ patient: patientId })
      .populate('doctor', 'profile.firstName profile.lastName email specialization')
      .sort({ date: 1 });
      
    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    console.log('Error fetching patient appointments:', error);
    res.status(500).json({ error: 'Failed to fetch patient appointments' });
  }
};

// Complete an appointment (Doctor only)
export const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { followUpRequired, followUpDate, followUpNotes, completionNotes } = req.body;

    const appointment = await Appointment.findById(id)
      .populate('patient', 'profile.firstName profile.lastName email')
      .populate('doctor', 'profile.firstName profile.lastName email');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    // Only doctors or admins may complete appointments
    if (user.role !== 'doctor' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to complete appointment' });
    }

    // Ensure only the assigned doctor or admin can complete
    // Doctors and admins are allowed to complete (role enforced earlier)

    const previousState = appointment.toObject();
    if (['cancelled','closed'].includes(String(appointment.status).toLowerCase())) {
      return res.status(409).json({ error: 'Cannot complete a cancelled/closed appointment' });
    }

    appointment.status = 'completed';
    appointment.followUpRequired = followUpRequired || false;
    appointment.followUpDate = followUpDate ? new Date(followUpDate) : null;
    appointment.followUpNotes = followUpNotes || '';
    appointment.completionNotes = completionNotes || '';
    appointment.updatedAt = new Date();

    await appointment.save();
    // Lifecycle: ConsultationCompleted
    try {
      const lifecycle = await AppointmentLifecycle.findOne({ appointmentId: appointment._id });
      if (lifecycle) {
        lifecycle.currentStatus = 'ConsultationCompleted';
        lifecycle.lastUpdatedAt = new Date();
        lifecycle.lastUpdatedBy = req.user._id;
        await lifecycle.save();
        await AppointmentLifecycleEvent.create({
          lifecycleId: lifecycle.lifecycleId,
          eventType: 'ConsultationCompleted',
          actorId: req.user._id,
          payload: { appointmentId: appointment._id }
        });
      }
    } catch (e) { console.log('Warn lifecycle ConsultationCompleted:', e?.message || e); }

    await AuditService.log(
      user._id,
      user.role,
      'appointment_completed',
      'appointment',
      appointment._id,
      {
        followUpRequired: followUpRequired || false,
        followUpDate,
        followUpNotes,
        completionNotes
      },
      {
        before: { status: previousState.status },
        after: { status: 'completed' }
      },
      req
    );

    const appointmentObj = appointment.toObject();
    
    if (appointmentObj.doctor) {
      const doctorDoc = await Doctor.findOne({ user: appointmentObj.doctor._id })
        .select('specialization licenseNumber experience bio rating');
      
      if (doctorDoc) {
        appointmentObj.doctor.specialization = doctorDoc.specialization;
        appointmentObj.doctor.licenseNumber = doctorDoc.licenseNumber;
        appointmentObj.doctor.experience = doctorDoc.experience;
        appointmentObj.doctor.bio = doctorDoc.bio;
        appointmentObj.doctor.rating = doctorDoc.rating;
      }
    }

    res.json({ success: true, data: appointmentObj });
  } catch (error) {
    console.log('Error completing appointment:', error);
    res.status(500).json({ error: 'Failed to complete appointment' });
  }
};

// Get appointment statistics for dashboard
export const getAppointmentStats = async (req, res) => {
  try {
    const { user } = req;
    let query = {};
    
    if (user.role === 'patient') {
      query.patient = user._id;
    } else if (user.role === 'doctor') {
      const doctorDoc = await Doctor.findOne({ user: user._id });
      
      const doctorQueries = [{ doctor: user._id }];
      if (doctorDoc) {
        doctorQueries.push({ doctor: doctorDoc._id });
      }
      
      query = { $or: doctorQueries };
    }

    const upcomingCount = await Appointment.countDocuments({
      ...query,
      status: 'scheduled',
      date: { $gte: new Date() }
    });

    const completedCount = await Appointment.countDocuments({
      ...query,
      status: 'completed'
    });

    let patientCount = 0;
    if (user.role === 'doctor') {
      const uniquePatients = await Appointment.distinct('patient', {
        doctor: user._id
      });
      patientCount = uniquePatients.length;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    const todayCount = await Appointment.countDocuments({
      ...query,
      date: { 
        $gte: startOfToday, 
        $lte: endOfToday 
      }
    });

    res.status(200).json({
      success: true,
      data: {
        upcomingCount,
        completedCount,
        patientCount,
        todayCount
      }
    });
  } catch (error) {
    console.log('Error getting appointment stats:', error);
    res.status(500).json({ error: 'Failed to get appointment statistics' });
  }
};

// Get upcoming appointments for dashboard
export const getUpcomingAppointments = async (req, res) => {
  try {
    const { user } = req;
    let query = {};
    
    if (user.role === 'patient') {
      query.patient = user._id;
    } else if (user.role === 'doctor') {
      const doctorDoc = await Doctor.findOne({ user: user._id });
      
      const doctorQueries = [{ doctor: user._id }];
      if (doctorDoc) {
        doctorQueries.push({ doctor: doctorDoc._id });
      }
      
      query = { $or: doctorQueries };
    }

    const upcomingAppointments = await Appointment.find({
      ...query,
      status: 'scheduled',
      date: { $gte: new Date() }
    })
      .populate('patient', 'profile.firstName profile.lastName email')
      .populate('doctor', 'profile.firstName profile.lastName profile.specialization email')
      .sort({ date: 1 })
      .limit(5);
    
    res.status(200).json(upcomingAppointments);
  } catch (error) {
    console.log('Error fetching upcoming appointments:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming appointments' });
  }
};

// Get available slots for a doctor on a specific date
export const getAvailableSlots = async (req, res) => {
  try {
    const { date, doctorId } = req.query;

    if (!date || !doctorId) {
      return res
        .status(400)
        .json({ success: false, message: "Date and doctorId are required" });
    }

    // Validate doctor eligibility (approved + active)
    const doctorProfile = await Doctor.findById(doctorId);
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    const isApproved = typeof doctorProfile.verificationStatus === 'string' && /^approved$/i.test(doctorProfile.verificationStatus);
    if (!isApproved) {
      return res.status(403).json({ success: false, message: "Doctor is not approved for booking" });
    }
    const doctorUser = await User.findById(doctorProfile.user).select('status');
    const isActive = doctorUser && typeof doctorUser.status === 'string' && /^active$/i.test(doctorUser.status);
    if (!isActive) {
      return res.status(403).json({ success: false, message: "Doctor account is not active" });
    }

    // Parse date string YYYY-MM-DD as local date to avoid timezone shifts
    const [year, month, day] = date.split('-').map(Number);
    const requestedDate = new Date(year, month - 1, day);
    const startOfDay = new Date(requestedDate);
    // Use local midnight boundaries for the requested date
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    let slots = await AppointmentSlot.find({
      doctor: doctorId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      isAvailable: true,
    }).sort({ startTime: 1 });
    // Return only real, pre-created slots by doctors
    return res.status(200).json({ success: true, data: slots || [] });
  } catch (error) {
    console.log("Error getting available slots:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get available slots" });
  }
};

// Reschedule an appointment
export const rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.body;
    const userId = req.user._id;
    
    if (!date) {
      return res.status(400).json({ error: 'New date is required' });
    }
    
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    const isPatient = appointment.patient.toString() === userId.toString();
    
    let isDoctor = appointment.doctor.toString() === userId.toString();
    
    if (!isDoctor && req.user.role === 'doctor') {
      const doctorDoc = await Doctor.findOne({ user: userId });
      if (doctorDoc) {
        isDoctor = appointment.doctor.toString() === doctorDoc._id.toString();
      }
    }
    
    if (!isPatient && !isDoctor && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to reschedule this appointment' });
    }
    
    if (appointment.status !== 'scheduled') {
      return res.status(400).json({ 
        error: `Cannot reschedule a ${appointment.status} appointment` 
      });
    }
    
    const newDate = new Date(date);
    if (newDate <= new Date()) {
      return res.status(400).json({ error: 'New appointment date must be in the future' });
    }
    
    const conflictingAppointment = await Appointment.findOne({
      doctor: appointment.doctor,
      date: newDate,
      status: { $ne: 'cancelled' }
    });
    
    if (conflictingAppointment) {
      return res.status(400).json({ error: 'The selected time slot is not available' });
    }
    
    const previousState = appointment.toObject();
    
    appointment.date = newDate;
    appointment.updatedAt = new Date();
    
    await appointment.save();
    
    await AuditService.log(
      userId,
      req.user.role,
      'appointment_rescheduled',
      'appointment',
      appointment._id,
      { newDate },
      {
        before: { date: previousState.date },
        after: { date: newDate }
      },
      req
    );
    
    const appointmentObj = appointment.toObject();
    
    if (appointmentObj.doctor) {
      const doctorDoc = await Doctor.findOne({ user: appointmentObj.doctor._id })
        .select('specialization licenseNumber experience bio rating');
      
      if (doctorDoc) {
        appointmentObj.doctor.specialization = doctorDoc.specialization;
        appointmentObj.doctor.licenseNumber = doctorDoc.licenseNumber;
        appointmentObj.doctor.experience = doctorDoc.experience;
        appointmentObj.doctor.bio = doctorDoc.bio;
        appointmentObj.doctor.rating = doctorDoc.rating;
      }
    }
    
    res.json({ success: true, data: appointmentObj });
  } catch (error) {
    console.log('Error rescheduling appointment:', error);
    res.status(500).json({ error: 'Failed to reschedule appointment' });
  }
};
