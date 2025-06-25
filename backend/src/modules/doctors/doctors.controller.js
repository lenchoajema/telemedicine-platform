import User from '../auth/user.model.js';
import mongoose from 'mongoose';
import Appointment from '../appointments/appointment.model.js';
import DoctorAvailability from './availability.model.js';

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
                date: {
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
export const getDoctorAvailability = async (req, res) => {
    try {
        const doctorId = req.user._id;
        
        // Get stored availability for this doctor from database
        const availability = await DoctorAvailability.findByDoctor(doctorId);
        
        // Transform to match frontend expectations
        const transformedAvailability = availability.map(avail => ({
            day: avail.day,
            startTime: avail.startTime,
            endTime: avail.endTime,
            slotDuration: avail.slotDuration,
            createdAt: avail.createdAt,
            updatedAt: avail.updatedAt
        }));
        
        res.json(transformedAvailability);
    } catch (err) {
        console.error('Error fetching doctor availability:', err);
        res.status(500).json({
            error: 'Failed to get doctor availability',
            details: err.message
        });
    }
};

export const setDoctorAvailability = async (req, res) => {
    try {
        const doctorId = req.user._id;
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
        
        // Validate start time is before end time
        const start = parseTime(startTime);
        const end = parseTime(endTime);
        if (start >= end) {
            return res.status(400).json({ 
                error: 'Start time must be before end time' 
            });
        }
        
        // Use upsert to either create new or update existing availability for this day
        const availabilityData = {
            doctor: doctorId,
            day: day.toLowerCase(),
            startTime,
            endTime,
            slotDuration,
            isActive: true
        };
        
        const updatedAvailability = await DoctorAvailability.findOneAndUpdate(
            { doctor: doctorId, day: day.toLowerCase() },
            availabilityData,
            { upsert: true, new: true, runValidators: true }
        );
        
        res.status(200).json({ 
            message: 'Availability updated successfully',
            availability: {
                day: updatedAvailability.day,
                startTime: updatedAvailability.startTime,
                endTime: updatedAvailability.endTime,
                slotDuration: updatedAvailability.slotDuration,
                createdAt: updatedAvailability.createdAt,
                updatedAt: updatedAvailability.updatedAt
            }
        });
    } catch (err) {
        console.error('Error setting doctor availability:', err);
        if (err.code === 11000) {
            return res.status(409).json({ 
                error: 'Availability for this day already exists' 
            });
        }
        res.status(500).json({ 
            error: 'Failed to set availability',
            details: err.message 
        });
    }
};

export const deleteDoctorAvailability = async (req, res) => {
    try {
        const doctorId = req.user._id;
        const { day } = req.params;
        
        if (!day) {
            return res.status(400).json({ 
                error: 'Day parameter is required' 
            });
        }
        
        // Find and delete availability for the specified day
        const deletedAvailability = await DoctorAvailability.findOneAndDelete({
            doctor: doctorId,
            day: day.toLowerCase()
        });
        
        // Check if anything was actually deleted
        if (!deletedAvailability) {
            return res.status(404).json({ 
                error: 'No availability found for the specified day' 
            });
        }
        
        res.status(200).json({ 
            message: 'Availability deleted successfully' 
        });
    } catch (err) {
        console.error('Error deleting doctor availability:', err);
        res.status(500).json({ 
            error: 'Failed to delete availability',
            details: err.message 
        });
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

// Get doctor availability by doctorId (for patients to query)
export const getDoctorAvailabilityById = async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        
        if (!doctorId) {
            return res.status(400).json({ error: 'Doctor ID is required' });
        }
        
        // Validate doctor ID format
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ error: 'Invalid doctor ID format' });
        }
        
        // Get stored availability for the requested doctor from database
        const availability = await DoctorAvailability.findByDoctor(doctorId);
        
        if (date) {
            // If date is provided, generate available slots for that specific date
            const requestedDate = new Date(date);
            const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            
            // Find availability for the requested day
            const dayAvailability = availability.find(a => a.day === dayOfWeek);
            
            if (!dayAvailability) {
                // No availability set for this day, return default slots
                return res.json(generateDefaultSlots());
            }
            
            // Generate time slots based on doctor's availability
            const slots = generateTimeSlots(dayAvailability.startTime, dayAvailability.endTime, dayAvailability.slotDuration);
            
            // Filter out already booked slots
            const availableSlots = await filterBookedSlots(doctorId, date, slots);
            
            return res.json(availableSlots);
        }
        
        // Transform to match frontend expectations
        const transformedAvailability = availability.map(avail => ({
            day: avail.day,
            startTime: avail.startTime,
            endTime: avail.endTime,
            slotDuration: avail.slotDuration,
            createdAt: avail.createdAt,
            updatedAt: avail.updatedAt
        }));
        
        // Return general availability if no specific date requested
        res.json(transformedAvailability);
    } catch (err) {
        console.error('Error getting doctor availability:', err);
        res.status(500).json({
            error: 'Failed to get doctor availability',
            details: err.message
        });
    }
};

// Helper function to generate time slots
const generateTimeSlots = (startTime, endTime, slotDuration) => {
    const slots = [];
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    
    let currentTime = start;
    while (currentTime < end) {
        const timeString = formatTime(currentTime);
        slots.push(timeString);
        currentTime += slotDuration;
    }
    
    return slots;
};

// Helper function to parse time string to minutes
const parseTime = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};

// Helper function to format minutes to time string
const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Helper function to generate default slots when no availability is set
const generateDefaultSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
};

// Helper function to filter out booked slots
const filterBookedSlots = async (doctorId, date, slots) => {
    try {
        // Get appointments for this doctor on the requested date
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        const appointments = await Appointment.find({
            doctor: doctorId,
            date: {
                $gte: startDate,
                $lte: endDate
            },
            status: { $in: ['scheduled', 'confirmed'] }
        });
        
        // Extract booked time slots
        const bookedSlots = appointments.map(apt => {
            const time = new Date(apt.date);
            return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
        });
        
        // Filter out booked slots
        return slots.filter(slot => !bookedSlots.includes(slot));
    } catch (error) {
        console.error('Error filtering booked slots:', error);
        // Return all slots if there's an error
        return slots;
    }
};