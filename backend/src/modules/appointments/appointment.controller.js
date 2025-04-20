import Appointment from './appointment.model.js';

export const createAppointment = async (req, res) => {
  try {
    const { doctorId, date, duration, reason, symptoms, meetingUrl } = req.body;
    
    const appointment = await Appointment.create({
      patient: req.user._id,  // From auth middleware
      doctor: doctorId,
      date,
      duration,
      reason,
      symptoms,
      meetingUrl
    });
    
    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ 
      error: 'Appointment creation failed',
      details: err.message 
    });
  }
};
