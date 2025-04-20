import Appointment from "./appointment.model.js";

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
      error: "Appointment creation failed",
      details: err.message 
    });
  }
};

export const getUpcomingAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      $or: [
        { patient: req.user._id },
        { doctor: req.user._id }
      ],
      date: { $gte: new Date() },
      status: "scheduled"
    })
    .populate("doctor", "profile.firstName profile.lastName profile.avatar specialization")
    .populate("patient", "profile.firstName profile.lastName profile.avatar")
    .sort({ date: 1 });
    
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ 
      error: "Failed to fetch appointments",
      details: err.message 
    });
  }
};

export const getAppointmentStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    
    const now = new Date();
    
    // Get upcoming appointments count
    const upcomingQuery = userRole === "doctor" 
      ? { doctor: userId, date: { $gte: now }, status: "scheduled" }
      : { patient: userId, date: { $gte: now }, status: "scheduled" };
    
    const upcomingCount = await Appointment.countDocuments(upcomingQuery);
    
    // Get completed appointments count
    const completedQuery = userRole === "doctor"
      ? { doctor: userId, status: "completed" }
      : { patient: userId, status: "completed" };
    
    const completedCount = await Appointment.countDocuments(completedQuery);
    
    // For doctors, get unique patient count
    let patientCount = 0;
    if (userRole === "doctor") {
      patientCount = await Appointment.distinct("patient", { doctor: userId }).countDocuments();
    }
    
    res.json({
      upcomingCount,
      completedCount,
      patientCount: userRole === "doctor" ? patientCount : undefined
    });
  } catch (err) {
    res.status(500).json({ 
      error: "Failed to fetch appointment statistics",
      details: err.message 
    });
  }
};