import Appointment from "./appointment.model.js";
import mongoose from 'mongoose';

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

export const getAvailableSlots = async (req, res) => {
  try {
    const { date, doctorId } = req.query;

    if (!doctorId) {
      return res.status(400).json({ error: "Doctor ID is required" });
    }

    // Parse date or use current date
    const selectedDate = date ? new Date(date) : new Date();

    // Set start of day and end of day
    const startTime = new Date(selectedDate);
    startTime.setHours(0, 0, 0, 0);

    const endTime = new Date(selectedDate);
    endTime.setHours(23, 59, 59, 999);

    // Find all appointments for the doctor on selected day
    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      date: { $gte: startTime, $lte: endTime },
      status: 'scheduled'
    }).select('date duration');

    // Generate available slots (9AM-5PM with 30min slots)
    const availableSlots = [];
    const workStart = new Date(selectedDate);
    workStart.setHours(9, 0, 0, 0);

    const workEnd = new Date(selectedDate);
    workEnd.setHours(17, 0, 0, 0);

    // Create 30-minute slots
    let currentSlot = new Date(workStart);

    while (currentSlot < workEnd) {
      // Check if slot conflicts with any booked appointment
      const isSlotAvailable = !bookedAppointments.some(appointment => {
        const appointmentStart = new Date(appointment.date);
        const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration * 60000);

        const slotStart = new Date(currentSlot);
        const slotEnd = new Date(currentSlot.getTime() + 30 * 60000);

        return (
          (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
          (slotEnd > appointmentStart && slotEnd <= appointmentEnd)
        );
      });

      if (isSlotAvailable) {
        availableSlots.push(new Date(currentSlot));
      }

      // Move to next slot
      currentSlot = new Date(currentSlot.getTime() + 30 * 60000);
    }

    res.json(availableSlots);
  } catch (err) {
    res.status(500).json({
      error: "Failed to get available slots",
      details: err.message
    });
  }
};

export const getAppointmentsByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const selectedDate = new Date(date);

    // Set start of day and end of day
    const startTime = new Date(selectedDate);
    startTime.setHours(0, 0, 0, 0);

    const endTime = new Date(selectedDate);
    endTime.setHours(23, 59, 59, 999);

    // Find all appointments for user on selected day
    const appointments = await Appointment.find({
      $or: [
        { patient: req.user._id },
        { doctor: req.user._id }
      ],
      date: { $gte: startTime, $lte: endTime }
    })
      .populate("doctor", "profile.firstName profile.lastName profile.avatar specialization")
      .populate("patient", "profile.firstName profile.lastName profile.avatar")
      .sort({ date: 1 });

    res.json(appointments);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch appointments by date",
      details: err.message
    });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Check if user is authorized to cancel (patient or doctor)
    if (
      appointment.patient.toString() !== req.user._id.toString() &&
      appointment.doctor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "Not authorized to cancel this appointment" });
    }

    // Check if appointment can be cancelled (not already completed)
    if (appointment.status === 'completed') {
      return res.status(400).json({ error: "Cannot cancel a completed appointment" });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({ message: "Appointment cancelled successfully", appointment });
  } catch (err) {
    res.status(500).json({
      error: "Failed to cancel appointment",
      details: err.message
    });
  }
};