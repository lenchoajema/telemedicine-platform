import User from '../auth/user.model.js';
import mongoose from 'mongoose';
import Appointment from '../appointments/appointment.model.js';

export const getDoctorStats = async (req, res) => {
    try {
        const doctorId = req.user._id;
        
        // Get today's date at midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get tomorrow's date at midnight
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Get appointments for this doctor
        const [totalAppointments, todayAppointments, completedAppointments, pendingAppointments] = await Promise.all([
            // Total appointments count
            Appointment.countDocuments({ doctor: doctorId }),
            
            // Today's appointments count
            Appointment.countDocuments({
                doctor: doctorId,
                appointmentDate: {
                    $gte: today,
                    $lt: tomorrow
                }
            }),
            
            // Completed appointments
            Appointment.countDocuments({
                doctor: doctorId,
                status: 'completed'
            }),
            
            // Pending verifications (if doctor profile needs verification)
            User.countDocuments({
                _id: doctorId,
                'verificationStatus': 'pending'
            })
        ]);
        
        res.json({
            totalAppointments,
            todayAppointments,
            completedAppointments,
            pendingAppointments,
            verificationStatus: req.user.verificationStatus || 'pending'
        });
    } catch (err) {
        console.error('Error fetching doctor stats:', err);
        res.status(500).json({
            error: 'Failed to fetch doctor statistics',
            details: err.message
        });
    }
};

export const getAllDoctors = async (req, res) => {
    try {
        const doctors = await User.find({
            role: 'doctor',
            status: 'active'
        }).select('-password');

        res.json(doctors);
    } catch (err) {
        console.error('Error fetching doctors:', err);
        res.status(500).json({
            error: 'Failed to fetch doctors',
            details: err.message
        });
    }
};

export const getDoctorById = async (req, res) => {
    try {
        // Validate doctor ID format
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid doctor ID' });
        }
        const doctor = await User.findOne({
            _id: id,
            role: 'doctor'
        }).select('-password');

        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        res.json(doctor);
    } catch (err) {
        res.status(500).json({
            error: 'Failed to fetch doctor details',
            details: err.message
        });
    }
};

export const getDoctorAvailability = async (req, res) => {
    try {
        // Get doctor's booked slots to avoid conflicts
        const { doctorId, date } = req.query;

        // Parse date or use current date
        const selectedDate = date ? new Date(date) : new Date();

        // Set start of day and end of day
        const startTime = new Date(selectedDate);
        startTime.setHours(0, 0, 0, 0);

        const endTime = new Date(selectedDate);
        endTime.setHours(23, 59, 59, 999);

        // Find all appointments for the doctor on selected day
        const bookedAppointments = await mongoose.model('Appointment').find({
            doctor: doctorId,
            date: { $gte: startTime, $lte: endTime },
            status: 'scheduled'
        }).select('date duration');

        // Generate available slots (assuming doctors work 9AM-5PM with 30min slots)
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

                // If current slot starts during another appointment
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

            // Move to next slot (30 minutes later)
            currentSlot = new Date(currentSlot.getTime() + 30 * 60000);
        }

        res.json(availableSlots);
    } catch (err) {
        res.status(500).json({
            error: 'Failed to get doctor availability',
            details: err.message
        });
    }
};