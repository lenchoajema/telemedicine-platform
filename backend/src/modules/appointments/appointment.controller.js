import Appointment from './appointment.model.js';

// Get all appointments (filtered by user role)
export const getAppointments = async (req, res) => {
  try {
    const { user } = req;
    let query = {};
    
    // Filter appointments based on user role
    if (user.role === 'patient') {
      query.patient = user._id;
    } else if (user.role === 'doctor') {
      query.doctor = user._id;
    }
    
    const appointments = await Appointment.find(query)
      .populate('patient', 'profile.firstName profile.lastName email')
      .populate('doctor', 'profile.firstName profile.lastName profile.specialization email')
      .sort({ date: 1 });
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Get a single appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id)
      .populate('patient', 'profile.firstName profile.lastName email')
      .populate('doctor', 'profile.firstName profile.lastName profile.specialization email');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.status(200).json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};

// Create a new appointment
export const createAppointment = async (req, res) => {
  try {
    const { doctorId, date, duration, reason, symptoms } = req.body;
    const patientId = req.user._id;
    
    // Create new appointment
    const appointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      date,
      duration,
      reason,
      symptoms
    });
    
    await appointment.save();
    
    // Populate patient and doctor info before sending response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'profile.firstName profile.lastName email')
      .populate('doctor', 'profile.firstName profile.lastName profile.specialization email');
    
    res.status(201).json(populatedAppointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    
    // Check for duplicate key error (doctor already booked at that time)
    if (error.code === 11000 && error.keyPattern && error.keyPattern.doctor && error.keyPattern.date) {
      return res.status(400).json({ error: 'Doctor is already booked for this time slot' });
    }
    
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

// Update an appointment
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, meetingUrl } = req.body;
    
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Check permissions - only doctors can add notes
    if (notes && req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can add notes' });
    }
    
    // Check if user is authorized to update this appointment
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this appointment' });
    }
    
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this appointment' });
    }
    
    // Update the appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      { status, notes, meetingUrl, updatedAt: Date.now() },
      { new: true }
    )
      .populate('patient', 'profile.firstName profile.lastName email')
      .populate('doctor', 'profile.firstName profile.lastName profile.specialization email');
    
    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

// Cancel/delete an appointment
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Check if user is authorized to cancel this appointment
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
    }
    
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
    }
    
    // Instead of deleting, just set status to cancelled
    appointment.status = 'cancelled';
    appointment.updatedAt = Date.now();
    await appointment.save();
    
    res.status(200).json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

// Get appointment statistics for dashboard
export const getAppointmentStats = async (req, res) => {
  try {
    const { user } = req;
    let query = {};
    
    // Filter appointments based on user role
    if (user.role === 'patient') {
      query.patient = user._id;
    } else if (user.role === 'doctor') {
      query.doctor = user._id;
    }

    // Count upcoming appointments (scheduled appointments in the future)
    const upcomingCount = await Appointment.countDocuments({
      ...query,
      status: 'scheduled',
      date: { $gte: new Date() }
    });

    // Count completed appointments
    const completedCount = await Appointment.countDocuments({
      ...query,
      status: 'completed'
    });

    // For doctors, count unique patients
    let patientCount = 0;
    if (user.role === 'doctor') {
      const uniquePatients = await Appointment.distinct('patient', {
        doctor: user._id
      });
      patientCount = uniquePatients.length;
    }

    // Today's appointments
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
      upcomingCount,
      completedCount,
      patientCount,
      todayCount
    });
  } catch (error) {
    console.error('Error getting appointment stats:', error);
    res.status(500).json({ error: 'Failed to get appointment statistics' });
  }
};
// Get upcoming appointments for dashboard
export const getUpcomingAppointments = async (req, res) => {
  try {
    const { user } = req;
    let query = {};
    
    // Filter appointments based on user role
    if (user.role === 'patient') {
      query.patient = user._id;
    } else if (user.role === 'doctor') {
      query.doctor = user._id;
    }

    // Find scheduled appointments in the future
    const upcomingAppointments = await Appointment.find({
      ...query,
      status: 'scheduled',
      date: { $gte: new Date() }
    })
      .populate('patient', 'profile.firstName profile.lastName email')
      .populate('doctor', 'profile.firstName profile.lastName profile.specialization email')
      .sort({ date: 1 })
      .limit(5); // Limit to most recent 5 appointments
    
    res.status(200).json(upcomingAppointments);
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming appointments' });
  }
};
// Get available slots for a doctor on a specific date
export const getAvailableSlots = async (req, res) => {
  try {
    const { date, doctorId } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    // Calculate start and end of the requested date
    const requestedDate = new Date(date);
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Query to find existing appointments on the requested date
    const query = {
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    };
    
    // If doctorId is provided, filter by that doctor
    if (doctorId) {
      query.doctor = doctorId;
    }
    
    // Get booked slots
    const bookedAppointments = await Appointment.find(query).select('date duration');
    
    // Generate all possible slots for the day (9 AM to 5 PM, 30 min intervals)
    const availableSlots = [];
    const slotDuration = 30; // minutes
    
    const workdayStart = new Date(startOfDay);
    workdayStart.setHours(9, 0, 0, 0); // 9 AM
    
    const workdayEnd = new Date(startOfDay);
    workdayEnd.setHours(17, 0, 0, 0); // 5 PM
    
    // Generate slots
    for (let slotTime = workdayStart; slotTime < workdayEnd; slotTime.setMinutes(slotTime.getMinutes() + slotDuration)) {
      const slotEndTime = new Date(slotTime.getTime() + slotDuration * 60000);
      let isAvailable = true;
      
      // Check if slot overlaps with any booked appointment
      for (const appointment of bookedAppointments) {
        const appointmentStart = new Date(appointment.date);
        const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration * 60000);
        
        if (
          (slotTime >= appointmentStart && slotTime < appointmentEnd) ||
          (slotEndTime > appointmentStart && slotEndTime <= appointmentEnd) ||
          (slotTime <= appointmentStart && slotEndTime >= appointmentEnd)
        ) {
          isAvailable = false;
          break;
        }
      }
      
      if (isAvailable) {
        availableSlots.push(new Date(slotTime));
      }
    }
    
    res.status(200).json(availableSlots);
  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({ error: 'Failed to get available slots' });
  }
};