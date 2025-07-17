import TimeSlot from '../models/TimeSlot.js';
import Doctor from '../modules/doctors/doctor.model.js';
import mongoose from 'mongoose';

// Create time slots for a doctor
export const createTimeSlots = async (req, res) => {
  try {
    const { date, startTime, endTime, slotDuration = 30 } = req.body;
    const doctorId = req.user._id;

    // Validate required fields
    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'Date, start time, and end time are required'
      });
    }

    // Check if doctor document exists
    const doctorDoc = await Doctor.findOne({ user: doctorId });
    if (!doctorDoc) {
      return res.status(404).json({
        success: false,
        error: 'Doctor profile not found'
      });
    }

    // Parse times
    const slotDate = new Date(date);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // Create slots
    const slots = [];
    let currentTime = new Date(slotDate);
    currentTime.setHours(startHour, startMinute, 0, 0);
    
    const endDateTime = new Date(slotDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    while (currentTime < endDateTime) {
      const slotEndTime = new Date(currentTime.getTime() + slotDuration * 60000);
      
      // Check if slot already exists
      const existingSlot = await TimeSlot.findOne({
        doctorId: doctorDoc._id,
        date: {
          $gte: new Date(slotDate.setHours(0, 0, 0, 0)),
          $lt: new Date(slotDate.setHours(23, 59, 59, 999))
        },
        startTime: currentTime.toTimeString().slice(0, 5)
      });

      if (!existingSlot) {
        const slot = new TimeSlot({
          doctorId: doctorDoc._id,
          date: new Date(slotDate),
          startTime: currentTime.toTimeString().slice(0, 5),
          endTime: slotEndTime.toTimeString().slice(0, 5),
          isAvailable: true
        });

        slots.push(slot);
      }

      currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
    }

    if (slots.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'All slots already exist for this time period'
      });
    }

    await TimeSlot.insertMany(slots);

    res.status(201).json({
      success: true,
      message: `${slots.length} time slots created successfully`,
      data: slots
    });
  } catch (error) {
    console.error('Error creating time slots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create time slots'
    });
  }
};

// Get doctor's time slots for a date range
export const getDoctorTimeSlots = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const doctorId = req.user._id;

    // Check if doctor document exists
    const doctorDoc = await Doctor.findOne({ user: doctorId });
    if (!doctorDoc) {
      return res.status(404).json({
        success: false,
        error: 'Doctor profile not found'
      });
    }

    let query = { doctorId: doctorDoc._id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }

    const timeSlots = await TimeSlot.find(query)
      .populate('appointmentId', 'patient reason status')
      .populate('patientId', 'profile.firstName profile.lastName email')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      data: timeSlots
    });
  } catch (error) {
    console.error('Error fetching time slots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch time slots'
    });
  }
};

// Create a single time slot
export const createSingleTimeSlot = async (req, res) => {
  try {
    const { date, time, duration = 30 } = req.body;
    const doctorId = req.user._id;

    // Validate required fields
    if (!date || !time) {
      return res.status(400).json({
        success: false,
        error: 'Date and time are required'
      });
    }

    // Check if doctor document exists
    const doctorDoc = await Doctor.findOne({ user: doctorId });
    if (!doctorDoc) {
      return res.status(404).json({
        success: false,
        error: 'Doctor profile not found'
      });
    }

    const slotDate = new Date(date);
    const [hour, minute] = time.split(':').map(Number);
    
    const startTime = new Date(slotDate);
    startTime.setHours(hour, minute, 0, 0);
    
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // Check if slot already exists
    const existingSlot = await TimeSlot.findOne({
      doctorId: doctorDoc._id,
      date: {
        $gte: new Date(slotDate.setHours(0, 0, 0, 0)),
        $lt: new Date(slotDate.setHours(23, 59, 59, 999))
      },
      startTime: time
    });

    if (existingSlot) {
      return res.status(400).json({
        success: false,
        error: 'Time slot already exists'
      });
    }

    const timeSlot = new TimeSlot({
      doctorId: doctorDoc._id,
      date: new Date(date),
      startTime: time,
      endTime: endTime.toTimeString().slice(0, 5),
      isAvailable: true
    });

    await timeSlot.save();

    res.status(201).json({
      success: true,
      message: 'Time slot created successfully',
      data: timeSlot
    });
  } catch (error) {
    console.error('Error creating time slot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create time slot'
    });
  }
};

// Delete a time slot
export const deleteTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user._id;

    // Check if doctor document exists
    const doctorDoc = await Doctor.findOne({ user: doctorId });
    if (!doctorDoc) {
      return res.status(404).json({
        success: false,
        error: 'Doctor profile not found'
      });
    }

    const timeSlot = await TimeSlot.findOne({
      _id: id,
      doctorId: doctorDoc._id
    });

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        error: 'Time slot not found'
      });
    }

    // Check if slot is booked
    if (!timeSlot.isAvailable && timeSlot.appointmentId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete a booked time slot'
      });
    }

    await TimeSlot.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Time slot deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting time slot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete time slot'
    });
  }
};

// Update time slot availability
export const updateTimeSlotAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;
    const doctorId = req.user._id;

    // Check if doctor document exists
    const doctorDoc = await Doctor.findOne({ user: doctorId });
    if (!doctorDoc) {
      return res.status(404).json({
        success: false,
        error: 'Doctor profile not found'
      });
    }

    const timeSlot = await TimeSlot.findOne({
      _id: id,
      doctorId: doctorDoc._id
    });

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        error: 'Time slot not found'
      });
    }

    // Don't allow making booked slots available
    if (timeSlot.appointmentId && isAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Cannot make a booked slot available'
      });
    }

    timeSlot.isAvailable = isAvailable;
    await timeSlot.save();

    res.json({
      success: true,
      message: 'Time slot updated successfully',
      data: timeSlot
    });
  } catch (error) {
    console.error('Error updating time slot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update time slot'
    });
  }
};
