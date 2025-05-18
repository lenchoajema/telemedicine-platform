import Doctor from './doctor.model.js';
import upload from '../../services/upload.service.js';
import { getFileUrl } from '../../services/upload.service.js';
import mongoose from 'mongoose'; 
import Appointment from '../appointments/appointment.model.js';

// Middleware for document upload
export const uploadDocument = (req, res) => {
  const uploadMiddleware = upload.single('file');
  
  uploadMiddleware(req, res, function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Return file URL
    const fileUrl = getFileUrl(req.file, req);
    res.status(201).json({ fileUrl });
  });
};

// Create or update doctor verification
export const submitVerification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { specialization, licenseNumber, education, experience, verificationDocuments } = req.body;
    
    // Validate required fields
    if (!specialization || !licenseNumber || !verificationDocuments || verificationDocuments.length === 0) {
      return res.status(400).json({ error: 'Missing required verification information' });
    }
    
    // Check if doctor profile already exists for this user
    let doctor = await Doctor.findOne({ user: userId });
    
    if (doctor) {
      // Update existing doctor profile
      doctor.specialization = specialization;
      doctor.licenseNumber = licenseNumber;
      doctor.education = education || doctor.education;
      doctor.experience = experience || doctor.experience;
      
      // Add new documents to existing ones
      if (verificationDocuments && verificationDocuments.length > 0) {
        // Filter out duplicate document types
        const existingTypes = doctor.verificationDocuments.map(doc => doc.type);
        const newDocs = verificationDocuments.filter(doc => !existingTypes.includes(doc.type));
        
        doctor.verificationDocuments = [
          ...doctor.verificationDocuments,
          ...newDocs
        ];
      }
      
      // If previously rejected, set back to pending
      if (doctor.verificationStatus === 'rejected') {
        doctor.verificationStatus = 'pending';
        doctor.verificationNotes = '';
      }
    } else {
      // Create new doctor profile
      doctor = new Doctor({
        user: userId,
        specialization,
        licenseNumber,
        education: education || [],
        experience: experience || [],
        verificationDocuments: verificationDocuments || [],
        verificationStatus: 'pending'
      });
    }
    
    await doctor.save();
    res.status(201).json({ message: 'Verification submitted successfully', doctor });
  } catch (error) {
    console.error('Error submitting verification:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get verification status for current doctor
export const getVerificationStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const doctor = await Doctor.findOne({ user: userId });
    
    if (!doctor) {
      return res.status(404).json({ error: 'No doctor profile found' });
    }
    
    res.status(200).json({
      status: doctor.verificationStatus,
      submittedAt: doctor.createdAt,
      notes: doctor.verificationNotes,
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber
    });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all doctors for the directory
export const getAllDoctors = async (req, res) => {
  try {
    const { specialization, name, sort = 'rating' } = req.query;
    
    let query = { verificationStatus: 'approved' };
    
    // Add specialization filter if provided
    if (specialization) {
      query.specialization = specialization;
    }
    
    // Find doctors and populate user information
    const doctors = await Doctor.find(query)
      .populate('user', 'email profile.firstName profile.lastName profile.fullName profile.photo')
      .sort({ [sort]: -1 });
    
    // If name filter is provided, filter results in memory
    let filteredDoctors = doctors;
    if (name && name.trim()) {
      const searchName = name.trim().toLowerCase();
      filteredDoctors = doctors.filter(doctor => {
        const fullName = `${doctor.user.profile.firstName} ${doctor.user.profile.lastName}`.toLowerCase();
        return fullName.includes(searchName);
      });
    }
    
    res.status(200).json(filteredDoctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
// Get all available specializations
export const getSpecializations = async (req, res) => {
  try {
    console.log('Fetching specializations...');
    
    // Get unique specializations from all doctors
    // If no doctors are approved yet, we'll return a default list
    let specializations = await Doctor.distinct('specialization', { verificationStatus: 'approved' });
    
    // If no specializations found, return a default list of common specializations
    if (!specializations || specializations.length === 0) {
      specializations = [
        'General Medicine',
        'Cardiology',
        'Dermatology',
        'Neurology',
        'Orthopedics',
        'Pediatrics',
        'Psychiatry',
        'Ophthalmology',
        'Family Medicine'
      ];
    }
    
    // Sort alphabetically
    specializations.sort();
    
    console.log('Specializations found:', specializations);
    return res.status(200).json(specializations);
  } catch (error) {
    console.error('Error fetching specializations:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Get doctor statistics
export const getDoctorStats = async (req, res) => {
  try {
    console.log('Accessing doctor stats endpoint');
    console.log('User from token:', req.user);
    const userId = req.user._id;
    console.log('User ID:', userId);
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get tomorrow's date at midnight
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log('Looking for doctor with user ID:', userId);
    // Find the doctor document for this user
    let doctor = await Doctor.findOne({ user: userId });
    console.log('Found doctor profile:', doctor);
    
    if (!doctor) {
      console.log('No doctor profile found, user has doctor role but no doctor record in Doctor collection');
      console.log('Creating a basic doctor profile based on user data');
      
      // Create a basic doctor record for this user
      try {
        doctor = new Doctor({
          user: userId,
          specialization: req.user.profile?.specialization || 'General',
          licenseNumber: req.user.profile?.licenseNumber || 'PENDING',
          verificationStatus: 'pending'
        });
        await doctor.save();
        console.log('Created doctor profile:', doctor);
      } catch (createError) {
        console.error('Error creating doctor profile:', createError);
        return res.status(404).json({ 
          error: 'Doctor profile incomplete. Please submit verification documents.',
          details: 'Your doctor account requires additional information.' 
        });
      }
    }
    
    // Get appointments for this doctor
    let totalAppointments = 0;
    let todayAppointments = 0; 
    let completedAppointments = 0;
    
    try {
      // Only try to fetch appointments if the doctor has a valid record
      [totalAppointments, todayAppointments, completedAppointments] = await Promise.all([
        // Total appointments count
        Appointment.countDocuments({ doctor: doctor._id }),
        
        // Today's appointments count
        Appointment.countDocuments({
          doctor: doctor._id,
          appointmentDate: {
            $gte: today,
            $lt: tomorrow
          }
        }),
        
        // Completed appointments
        Appointment.countDocuments({
          doctor: doctor._id,
          status: 'completed'
        })
      ]);
    } catch (appointmentError) {
      console.error('Error fetching appointments:', appointmentError);
      // Continue with zero values
    }
    
    res.json({
      totalAppointments,
      todayAppointments,
      completedAppointments,
      verificationStatus: doctor.verificationStatus || 'pending',
      profileComplete: doctor ? true : false
    });
  } catch (err) {
    console.error('Error fetching doctor stats:', err);
    res.status(500).json({
      error: 'Failed to fetch doctor statistics',
      details: err.message
    });
  }
};

// Get doctor by ID for public profile view
export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const doctor = await Doctor.findById(id)
      .populate('user', 'email profile.firstName profile.lastName profile.fullName profile.photo');
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    // Only allow viewing approved doctors
    if (doctor.verificationStatus !== 'approved') {
      return res.status(403).json({ error: 'Doctor profile not available' });
    }
    
    res.status(200).json(doctor);
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Submit rating for a doctor
export const rateDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    const userId = req.user._id;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Check if doctor exists
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    // Check if doctor is approved
    if (doctor.verificationStatus !== 'approved') {
      return res.status(403).json({ error: 'Cannot rate unverified doctors' });
    }
    
    // Create or update rating schema
    const Rating = mongoose.model('Rating', new mongoose.Schema({
      doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
      },
      patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      feedback: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }));
    
    // Check if user has already rated this doctor
    let existingRating = await Rating.findOne({
      doctor: id,
      patient: userId
    });
    
    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.feedback = feedback;
      await existingRating.save();
    } else {
      // Create new rating
      await Rating.create({
        doctor: id,
        patient: userId,
        rating,
        feedback
      });
    }
    
    // Update doctor's average rating
    const allRatings = await Rating.find({ doctor: id });
    const totalRating = allRatings.reduce((sum, item) => sum + item.rating, 0);
    const averageRating = totalRating / allRatings.length;
    
    doctor.rating = averageRating;
    doctor.reviewCount = allRatings.length;
    await doctor.save();
    
    res.status(200).json({
      message: 'Rating submitted successfully',
      averageRating: doctor.rating,
      reviewCount: doctor.reviewCount
    });
    
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get the profile for the currently authenticated doctor
export const getDoctorProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find the doctor document for this user
    let doctor = await Doctor.findOne({ user: userId }).populate('user', 'email profile.firstName profile.lastName profile.fullName profile.photo');
    
    if (!doctor) {
      // Check if we have a user with doctor role but no doctor record
      if (req.user.role === 'doctor') {
        // Create a basic doctor record for this user
        try {
          doctor = new Doctor({
            user: userId,
            specialization: req.user.profile?.specialization || 'General',
            licenseNumber: req.user.profile?.licenseNumber || 'PENDING',
            verificationStatus: 'pending'
          });
          await doctor.save();
          
          // Now populate the user info
          doctor = await Doctor.findById(doctor._id).populate('user', 'email profile.firstName profile.lastName profile.fullName profile.photo');
        } catch (createError) {
          console.error('Error creating doctor profile:', createError);
          return res.status(404).json({ 
            error: 'Doctor profile incomplete. Please submit verification documents.',
            details: 'Your doctor account requires additional information.' 
          });
        }
      } else {
        return res.status(403).json({ error: 'Access denied. Not a doctor account.' });
      }
    }
    
    // Prepare response data
    const profile = {
      _id: doctor._id,
      user: doctor.user,
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber,
      education: doctor.education || [],
      experience: doctor.experience || [],
      verificationStatus: doctor.verificationStatus,
      status: doctor.verificationStatus, // Adding this for frontend compatibility
      rating: doctor.rating || 0,
      reviewCount: doctor.reviewCount || 0,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt
    };
    
    res.status(200).json(profile);
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export default {
  uploadDocument,
  submitVerification,
  getVerificationStatus,
  getAllDoctors,
  getSpecializations,
  getDoctorStats,
  getDoctorProfile,
  getDoctorById,
  rateDoctorById
};
