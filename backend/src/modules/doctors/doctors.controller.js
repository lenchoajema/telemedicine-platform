import User from '../auth/user.model.js';
import mongoose from 'mongoose';
import Appointment from '../appointments/appointment.model.js';
import DoctorAvailability from './availability.model.js';
import Doctor from './doctor.model.js';

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
            
            // Pending verifications placeholder retained
            User.countDocuments({ _id: doctorId, 'verificationStatus': 'pending' })
        ]);
        
        res.json({
            totalAppointments,
            todayAppointments,
            completedAppointments,
            pendingAppointments,
            verificationStatus: req.user.verificationStatus || 'pending'
        });
    } catch (err) {
        console.log('Error fetching doctor stats:', err);
        res.status(500).json({
            error: 'Failed to fetch doctor statistics',
            details: err.message
        });
    }
};

export const getAllDoctors = async (req, res) => {
    try {
        // Only list doctors that are Active (User model uses capitalized enum)
        const doctors = await User.find({
            role: 'doctor',
            status: { $in: ['Active', 'active'] }
        }).select('-password');

        res.json(doctors);
    } catch (err) {
        console.log('Error fetching doctors:', err);
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
            role: 'doctor',
            status: { $in: ['Active', 'active'] }
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
        const availability = await DoctorAvailability.find({ doctor: doctorId, isActive: true }).sort({ day: 1, startTime: 1 });
        const blocks = availability.map(a => ({
            id: a._id,
            day: a.day,
            startTime: a.startTime,
            endTime: a.endTime,
            slotDuration: a.slotDuration,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt
        }));
        res.json({ success: true, blocks });
    } catch (err) {
        console.log('Error fetching doctor availability:', err);
        res.status(500).json({ error: 'Failed to get doctor availability', details: err.message });
    }
};

export const setDoctorAvailability = async (req, res) => {
    try {
        const doctorId = req.user._id;
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        // Support two payload styles:
        // 1) Single block: { day, startTime, endTime, slotDuration }
        // 2) Batch blocks: { blocks: [{ day, startTime, endTime, slotDuration }, ...] }
        let blocks = [];
        if (Array.isArray(req.body.blocks)) {
            blocks = req.body.blocks;
        } else if (req.body.day) {
            const { day, startTime, endTime, slotDuration } = req.body;
            blocks = [{ day, startTime, endTime, slotDuration }];
        } else {
            return res.status(400).json({ error: 'Provide either day/startTime/endTime/slotDuration or blocks[]' });
        }

        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        const normalized = [];
        for (const b of blocks) {
            if (!b.day || !b.startTime || !b.endTime || !b.slotDuration) {
                return res.status(400).json({ error: 'Each block requires day, startTime, endTime, slotDuration' });
            }
            const dayLower = b.day.toLowerCase();
            if (!validDays.includes(dayLower)) {
                return res.status(400).json({ error: 'Invalid day in block: ' + b.day });
            }
            if (!timeRegex.test(b.startTime) || !timeRegex.test(b.endTime)) {
                return res.status(400).json({ error: 'Invalid time format in block ' + b.day + '. Use HH:MM' });
            }
            if (b.slotDuration <= 0 || b.slotDuration > 480) {
                return res.status(400).json({ error: 'Invalid slotDuration in block ' + b.day });
            }
            const start = parseTime(b.startTime); const end = parseTime(b.endTime);
            if (start >= end) {
                return res.status(400).json({ error: 'startTime must be before endTime in block ' + b.day });
            }
            normalized.push({
                doctor: doctorId,
                day: dayLower,
                startTime: b.startTime,
                endTime: b.endTime,
                slotDuration: b.slotDuration,
                isActive: true
            });
        }

        // Insert or update each block independently (unique index on doctor+day+startTime prevents exact duplicates)
        const results = [];
        for (const block of normalized) {
            const updated = await DoctorAvailability.findOneAndUpdate(
                { doctor: doctorId, day: block.day, startTime: block.startTime },
                block,
                { upsert: true, new: true, runValidators: true }
            );
            results.push(updated);
        }

        res.status(200).json({
            message: 'Availability blocks upserted',
            count: results.length,
            availability: results.map(r => ({
                id: r._id,
                day: r.day,
                startTime: r.startTime,
                endTime: r.endTime,
                slotDuration: r.slotDuration,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt
            }))
        });
    } catch (err) {
        console.log('Error setting doctor availability:', err);
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Duplicate availability block detected' });
        }
        res.status(500).json({ error: 'Failed to set availability', details: err.message });
    }
};

export const deleteDoctorAvailability = async (req, res) => {
    try {
        const doctorId = req.user._id;
        const { day } = req.params;
        const { startTime } = req.query; // optional: delete just one block

        if (!day) {
            return res.status(400).json({ error: 'Day parameter is required' });
        }

        const query = { doctor: doctorId, day: day.toLowerCase() };
        if (startTime) query.startTime = startTime;

        const result = await DoctorAvailability.deleteMany(query);
        if (!result.deletedCount) {
            return res.status(404).json({ error: 'No availability found matching request' });
        }
        res.status(200).json({ message: 'Availability deleted', deleted: result.deletedCount });
    } catch (err) {
        console.log('Error deleting doctor availability:', err);
        res.status(500).json({ error: 'Failed to delete availability', details: err.message });
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
        // Retrieve doctor profile and build IDs array to cover both storage formats
        const userId = req.user._id;
        const doctorProfile = await Doctor.findOne({ user: userId });
        const doctorIds = [userId];
        if (doctorProfile) doctorIds.push(doctorProfile._id);
        // Get all appointments where doctor field matches either user ID or profile ID
        const appointments = await Appointment.find({ doctor: { $in: doctorIds } })
            .populate('patient', '-password')
            .sort({ date: -1 });
            
        // Extract unique patients from appointments
        const patientMap = new Map();
        appointments.forEach(apt => {
            const p = apt.patient;
            if (p && !patientMap.has(p._id.toString())) {
                patientMap.set(p._id.toString(), p);
            }
        });
    // Only include active patients
    const patients = Array.from(patientMap.values()).filter(p => p?.status === 'Active');
            
        res.status(200).json({ success: true, data: patients });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
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
        
        // Ensure doctor is active before returning availability
    const activeDoctor = await User.findOne({ _id: doctorId, role: 'doctor', status: { $in: ['Active', 'active'] } }).select('_id');
        if (!activeDoctor) {
            return res.status(404).json({ error: 'Doctor not available' });
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
                // No availability set for this day — do not generate defaults; return empty list
                return res.json([]);
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
        console.log('Error getting doctor availability:', err);
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
        console.log('Error filtering booked slots:', error);
        // Return all slots if there's an error
        return slots;
    }
};