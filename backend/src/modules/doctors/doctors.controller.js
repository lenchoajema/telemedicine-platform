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

// In-memory storage for doctor availability (in production, use database)
const doctorAvailability = new Map();

export const getDoctorAvailability = async (req, res) => {
    try {
        const doctorId = req.user._id.toString();
        
        // Get stored availability for this doctor
        const availability = doctorAvailability.get(doctorId) || [];
        
        res.json(availability);
    } catch (err) {
        res.status(500).json({
            error: 'Failed to get doctor availability',
            details: err.message
        });
    }
};

export const setDoctorAvailability = async (req, res) => {
    try {
        const doctorId = req.user._id.toString();
        const { day, startTime, endTime, slotDuration } = req.body;
        
        // Validate required fields
        if (!day || !startTime || !endTime || !slotDuration) {
            return res.status(400).json({ 
                error: 'Missing required fields: day, startTime, endTime, slotDuration' 
            });
        }
        
        // Validate day format (should be one of the weekdays)
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        if (!validDays.includes(day.toLowerCase())) {
            return res.status(400).json({ 
                error: 'Invalid day. Must be one of: ' + validDays.join(', ') 
            });
        }
        
        // Validate time format (HH:MM)
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            return res.status(400).json({ 
                error: 'Invalid time format. Use HH:MM format' 
            });
        }
        
        // Validate slot duration (should be a positive number)
        if (slotDuration <= 0 || slotDuration > 480) { // Max 8 hours
            return res.status(400).json({ 
                error: 'Invalid slot duration. Must be between 1 and 480 minutes' 
            });
        }
        
        // Get existing availability for this doctor
        const existingAvailability = doctorAvailability.get(doctorId) || [];
        
        // Remove any existing availability for this day
        const updatedAvailability = existingAvailability.filter(a => a.day !== day);
        
        // Create new availability object
        const newAvailabilityEntry = {
            day,
            startTime,
            endTime,
            slotDuration,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // Add the new availability
        updatedAvailability.push(newAvailabilityEntry);
        
        // Store updated availability
        doctorAvailability.set(doctorId, updatedAvailability);
        
        res.status(200).json({ 
            message: 'Availability updated successfully',
            availability: newAvailabilityEntry 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteDoctorAvailability = async (req, res) => {
    try {
        const doctorId = req.user._id.toString();
        const { day } = req.params;
        
        if (!day) {
            return res.status(400).json({ 
                error: 'Day parameter is required' 
            });
        }
        
        // Get existing availability for this doctor
        const existingAvailability = doctorAvailability.get(doctorId) || [];
        
        // Remove availability for the specified day
        const updatedAvailability = existingAvailability.filter(a => a.day !== day);
        
        // Check if anything was actually removed
        if (existingAvailability.length === updatedAvailability.length) {
            return res.status(404).json({ 
                error: 'No availability found for the specified day' 
            });
        }
        
        // Store updated availability
        doctorAvailability.set(doctorId, updatedAvailability);
        
        res.status(200).json({ 
            message: 'Availability deleted successfully' 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const submitVerification = async (req, res) => {
    try {
        const doctorId = req.user._id;
        const { 
            specialization, 
            licenseNumber, 
            education, 
            experience, 
            verificationDocuments 
        } = req.body;
        
        if (!specialization || !licenseNumber) {
            return res.status(400).json({ 
                error: 'Missing required fields', 
                details: 'Specialization and license number are required' 
            });
        }
        
        // Find the doctor user
        const doctorUser = await User.findById(doctorId);
        
        if (!doctorUser) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        
        // Update the doctor's verification status
        doctorUser.verificationStatus = 'pending';
        doctorUser.profile.specialization = specialization;
        doctorUser.profile.licenseNumber = licenseNumber;
        
        // Add education and experience if provided
        if (education) doctorUser.profile.education = education;
        if (experience) doctorUser.profile.experience = experience;
        
        // Add verification documents if provided
        if (verificationDocuments && verificationDocuments.length > 0) {
            doctorUser.profile.verificationDocuments = verificationDocuments;
        }
        
        await doctorUser.save();
        
        res.status(200).json({
            message: 'Verification submitted successfully',
            status: 'pending'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getMyPatients = async (req, res) => {
    try {
        const doctorId = req.user._id;
        
        // Get all appointments for this doctor
        const appointments = await Appointment.find({ doctor: doctorId })
            .populate('patient', '-password')
            .sort({ appointmentDate: -1 });
            
        // Extract unique patients from appointments
        const patients = appointments
            .map(appointment => appointment.patient)
            .filter((patient, index, self) => {
                // Remove duplicates
                return index === self.findIndex(p => p._id.toString() === patient._id.toString());
            });
            
        res.status(200).json(patients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};