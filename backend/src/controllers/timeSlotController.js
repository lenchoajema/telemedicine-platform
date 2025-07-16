import TimeSlot from '../models/TimeSlot.js';
import Doctor from '../modules/doctors/doctor.model.js';
import mongoose from 'mongoose';

// Get available time slots for a doctor on a specific date
export const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    
    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        error: 'Doctor ID and date are required'
      });
    }

    // Clean expired reservations first
    await TimeSlot.cleanExpiredReservations();

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        error: 'Cannot book appointments for past dates'
      });
    }

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    // Generate slots if they don't exist for this date
    await TimeSlot.generateSlotsForDoctor(doctorId, date);

    // Get available slots
    const availableSlots = await TimeSlot.find({
      doctorId,
      date: selectedDate,
      isAvailable: true
    }).sort({ startTime: 1 });

    const slotsWithDetails = availableSlots.map(slot => ({
      _id: slot._id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable,
      date: slot.date
    }));

    res.json({
      success: true,
      data: slotsWithDetails
    });

  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available slots'
    });
  }
};

// Reserve a time slot temporarily (for 15 minutes)
export const reserveSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { patientId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid slot ID'
      });
    }

    // Clean expired reservations first
    await TimeSlot.cleanExpiredReservations();

    const slot = await TimeSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        error: 'Time slot not found'
      });
    }

    if (!slot.isAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Time slot is no longer available'
      });
    }

    // Reserve the slot for 15 minutes
    await slot.reserve(patientId, 15);

    res.json({
      success: true,
      data: {
        slotId: slot._id,
        reservedUntil: slot.reservationExpires,
        message: 'Slot reserved for 15 minutes'
      }
    });

  } catch (error) {
    console.error('Error reserving slot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reserve slot'
    });
  }
};

// Get slot history for analytics
export const getSlotHistory = async (req, res) => {
  try {
    const { doctorId, date, limit = 100 } = req.query;
    
    const filter = {};
    if (doctorId) filter.doctorId = doctorId;
    if (date) filter.date = new Date(date);

    const slots = await TimeSlot.find(filter)
      .populate('doctorId', 'user.profile.firstName user.profile.lastName specialization')
      .populate('patientId', 'profile.firstName profile.lastName')
      .populate('appointmentId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: slots
    });

  } catch (error) {
    console.error('Error fetching slot history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch slot history'
    });
  }
};

// Admin function to manually generate slots
export const generateSlots = async (req, res) => {
  try {
    const { doctorId, date, workingHours, slotDuration } = req.body;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        error: 'Doctor ID and date are required'
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    const slots = await TimeSlot.generateSlotsForDoctor(
      doctorId, 
      date, 
      workingHours || { start: '09:00', end: '17:00' },
      slotDuration || 30
    );

    res.json({
      success: true,
      data: {
        slotsGenerated: slots.length,
        date: date,
        doctorId: doctorId
      }
    });

  } catch (error) {
    console.error('Error generating slots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate slots'
    });
  }
};

// Clean expired reservations (can be called by cron job)
export const cleanExpiredReservations = async (req, res) => {
  try {
    const cleanedCount = await TimeSlot.cleanExpiredReservations();
    
    res.json({
      success: true,
      data: {
        cleanedReservations: cleanedCount,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Error cleaning expired reservations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean expired reservations'
    });
  }
};
