import Appointment from '../appointments/appointment.model.js';
import User from '../auth/user.model.js';

// Get recent doctors that a patient has had appointments with
export const getRecentDoctors = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Check if the user exists and has patient role
    const user = await User.findById(userId);
    if (!user || user.role !== 'patient') {
      return res.status(403).json({ 
        error: 'Unauthorized. Only patients can access their recent doctors.'
      });
    }
    
    // Find appointments for this patient, sort by most recent
    const appointments = await Appointment.find({ 
      patient: userId, 
      status: { $in: ['scheduled', 'completed'] }
    })
    .sort({ date: -1 }) // Most recent first
    .limit(10)
    .populate({
      path: 'doctor',
      select: 'profile.firstName profile.lastName profile.avatar profile.specialization email',
      model: 'User'
    });
    
    // Extract unique doctors from these appointments
    const doctors = [];
    const doctorIds = new Set();
    
    for (const appointment of appointments) {
      if (appointment.doctor && !doctorIds.has(appointment.doctor._id.toString())) {
        doctorIds.add(appointment.doctor._id.toString());
        doctors.push({
          _id: appointment.doctor._id,
          firstName: appointment.doctor.profile?.firstName || '',
          lastName: appointment.doctor.profile?.lastName || '',
          avatar: appointment.doctor.profile?.avatar || '',
          specialization: appointment.doctor.profile?.specialization || '',
          email: appointment.doctor.email,
          lastAppointment: appointment.date
        });
      }
    }
    
    // Limit to 5 most recent doctors
    const recentDoctors = doctors.slice(0, 5);
    
    return res.status(200).json(recentDoctors);
  } catch (error) {
    console.error('Error fetching recent doctors:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
