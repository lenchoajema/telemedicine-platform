import Appointment from './appointment.model.js';
import AppointmentLifecycle from './appointment-lifecycle.model.js';
import AppointmentLifecycleEvent from './appointment-lifecycle-event.model.js';

// Initialize lifecycle for an appointment
export const initAppointmentLifecycle = async (req, res) => {
  const { appointmentId } = req.params;
  try {
    // Ensure appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    // Check if lifecycle already exists
    let lifecycle = await AppointmentLifecycle.findOne({ appointmentId });
    if (lifecycle) {
      return res.status(400).json({ success: false, message: 'Lifecycle already initialized' });
    }
    // Create lifecycle
    lifecycle = new AppointmentLifecycle({
      appointmentId,
      patientId: appointment.patient,
      doctorId: appointment.doctor,
      lastUpdatedBy: req.user._id
    });
    await lifecycle.save();
    res.status(201).json({ success: true, data: lifecycle });
  } catch (error) {
    console.log('Error initializing lifecycle:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get lifecycle and events for an appointment
export const getAppointmentLifecycle = async (req, res) => {
  const { appointmentId } = req.params;
  try {
    // Find or auto-init lifecycle
    let lifecycle = await AppointmentLifecycle.findOne({ appointmentId })
      .populate('patientId', 'profile.firstName profile.lastName')
      .populate('doctorId', 'profile.firstName profile.lastName');
    if (!lifecycle) {
      // Initialize if missing
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }
      lifecycle = new AppointmentLifecycle({
        appointmentId,
        patientId: appointment.patient,
        doctorId: appointment.doctor,
        lastUpdatedBy: req.user._id
      });
      await lifecycle.save();
    }
    const events = await AppointmentLifecycleEvent.find({ lifecycleId: lifecycle.lifecycleId }).sort('timestamp');
    res.json({ success: true, data: { lifecycle, events } });
  } catch (error) {
    console.log('Error fetching lifecycle:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Log a new event to lifecycle
export const addLifecycleEvent = async (req, res) => {
  const { appointmentId } = req.params;
  const { eventType, payload } = req.body;
  try {
    const lifecycle = await AppointmentLifecycle.findOne({ appointmentId });
    if (!lifecycle) {
      return res.status(404).json({ success: false, message: 'Lifecycle not found' });
    }
    const event = new AppointmentLifecycleEvent({
      lifecycleId: lifecycle.lifecycleId,
      eventType,
      actorId: req.user._id,
      payload
    });
    await event.save();
    // Update lastUpdated
    lifecycle.lastUpdatedAt = new Date();
    lifecycle.lastUpdatedBy = req.user._id;
    await lifecycle.save();
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.log('Error adding lifecycle event:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update lifecycle status or closure notes
export const updateLifecycleStatus = async (req, res) => {
  const { appointmentId } = req.params;
  const { currentStatus, closureNotes } = req.body;
  try {
    const lifecycle = await AppointmentLifecycle.findOne({ appointmentId });
    if (!lifecycle) {
      return res.status(404).json({ success: false, message: 'Lifecycle not found' });
    }
    // Prevent changes after Closed (idempotent if same status)
    if (String(lifecycle.currentStatus).toLowerCase() === 'closed' && currentStatus && currentStatus !== 'Closed') {
      return res.status(409).json({ success: false, message: 'Appointment already closed' });
    }
    if (currentStatus) lifecycle.currentStatus = currentStatus;
    if (closureNotes) lifecycle.closureNotes = closureNotes;
    if (currentStatus === 'Closed') lifecycle.endAt = new Date();
    lifecycle.lastUpdatedAt = new Date();
    lifecycle.lastUpdatedBy = req.user._id;
    await lifecycle.save();
    res.json({ success: true, data: lifecycle });
  } catch (error) {
    console.log('Error updating lifecycle status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
