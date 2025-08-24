import Doctor from './doctor.model.js';
import User from '../auth/user.model.js';
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

// Multi-file upload (verification documents) - expects fields: type (per file) optional mapping via query/body
export const uploadVerificationDocuments = (req, res) => {
  const uploadMulti = upload.array('files', 10);
  uploadMulti(req, res, function(err) {
    if (err) return res.status(400).json({ success:false, message: err.message });
    if (!req.files || !req.files.length) return res.status(400).json({ success:false, message:'No files uploaded' });
    const mapType = Array.isArray(req.body.type) ? req.body.type : (req.body.type ? [req.body.type] : []);
    const results = req.files.map((f, idx) => ({
      originalName: f.originalname,
      fileUrl: getFileUrl(f, req),
      type: mapType[idx] || mapType[0] || 'certification'
    }));
    res.status(201).json({ success:true, files: results });
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
  console.log('Error submitting verification:', error);
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
  console.log('Error fetching verification status:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all doctors for the directory
export const getAllDoctors = async (req, res) => {
  try {
    const { specialization, name, sort = 'rating' } = req.query;
    
  // Only approved doctors (case-insensitive)
  let query = { verificationStatus: { $regex: /^approved$/i } };
    
    // Add specialization filter if provided
    if (specialization) {
      query.specialization = specialization;
    }
    
    // Find doctors and populate user information
    // Only include doctors whose linked user accounts are Active
    const doctors = await Doctor.find(query)
      .populate({
        path: 'user',
        select: 'email profile.firstName profile.lastName profile.fullName profile.photo status',
        // Accept legacy casing/variants for status
        match: { status: { $regex: /^active$/i } }
      })
      .sort({ [sort]: -1 });
    
    // If name filter is provided, filter results in memory
    let filteredDoctors = doctors;
    if (name && name.trim()) {
      const searchName = name.trim().toLowerCase();
      filteredDoctors = doctors.filter(doctor => {
        const first = doctor?.user?.profile?.firstName || '';
        const last = doctor?.user?.profile?.lastName || '';
        const fullName = `${first} ${last}`.trim().toLowerCase();
        return fullName.includes(searchName);
      });
    }
    
  // Filter out any entries where user population failed (i.e., not Active)
  let visibleDoctors = filteredDoctors.filter(d => d.user);

  // De-duplicate by user _id (safety in case of legacy duplicates)
  const seenUsers = new Set();
  visibleDoctors = visibleDoctors.filter(doc => {
    const uid = doc.user?._id?.toString();
    if (!uid) return false;
    if (seenUsers.has(uid)) return false;
    seenUsers.add(uid);
    return true;
  });

  // Only if absolutely none found, provide a lightweight fallback of active doctor users (unverified) WITHOUT duplicating approved docs
  if (visibleDoctors.length === 0) {
    try {
      const fallbackUsers = await User.find({ role: 'doctor', status: { $regex: /^active$/i } })
        .select('email profile.firstName profile.lastName profile.fullName profile.photo role status verificationStatus profile.specialization');
      visibleDoctors = fallbackUsers.map(u => ({
        _id: u._id,
        user: u,
        specialization: u.profile?.specialization || 'General Medicine',
        verificationStatus: u.verificationStatus || 'pending',
        placeholderOnly: true
      }));
    } catch (fallbackErr) {
      console.log('Fallback doctor user query failed:', fallbackErr.message);
    }
  }

  res.status(200).json({ success: true, data: visibleDoctors });
  } catch (error) {
  console.log('Error fetching doctors:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
// Get all available specializations
export const getSpecializations = async (req, res) => {
  try {
    console.log('Fetching specializations...');
    
    // Get unique specializations from all doctors
    // If no doctors are approved yet, we'll return a default list
  // Only consider approved doctors whose linked user is Active
  const approvedActiveDoctors = await Doctor.find({ verificationStatus: { $regex: /^approved$/i } })
    .populate({ path: 'user', select: '_id status', match: { status: { $regex: /^active$/i } } })
    .select('specialization user');
  let specializations = approvedActiveDoctors.filter(d => d.user).map(d => d.specialization);
    
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
  console.log('Error fetching specializations:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Get doctor statistics
export const getDoctorStats = async (req, res) => {
  try {
    console.log('Accessing doctor stats endpoint');
    const userId = req.user._id;

    // Get today's date boundaries
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    // Find the doctor document for this user
    const doctor = await Doctor.findOne({ user: userId });

    // If no doctor profile yet, return safe defaults instead of failing/auto-creating
    if (!doctor) {
      return res.status(200).json({
        totalAppointments: 0,
        todayAppointments: 0,
        totalPatients: 0,
        revenue: 0,
        verificationStatus: 'pending',
        profileComplete: false,
        message: 'Doctor profile not completed yet. Please submit verification to unlock full features.'
      });
    }

    // Collect stats for existing doctor
    let totalAppointments = 0;
    let todayAppointments = 0;
    let totalPatients = 0;

    try {
      const [totalCount, todayCount, distinctPatients] = await Promise.all([
        // Total appointments count
        Appointment.countDocuments({ doctor: doctor._id }),
        // Today's appointments count (uses correct "date" field)
        Appointment.countDocuments({
          doctor: doctor._id,
          date: { $gte: startOfToday, $lt: endOfToday }
        }),
        // Unique patients seen by this doctor
        Appointment.distinct('patient', { doctor: doctor._id })
      ]);

      totalAppointments = totalCount;
      todayAppointments = todayCount;
      totalPatients = Array.isArray(distinctPatients) ? distinctPatients.length : 0;
    } catch (appointmentError) {
  console.log('Error fetching appointments for stats:', appointmentError);
    }

    // Align response keys with frontend expectations
    return res.status(200).json({
      totalAppointments,
      todayAppointments,
      totalPatients,
      revenue: 0,
      verificationStatus: doctor.verificationStatus || 'pending',
      profileComplete: true
    });
  } catch (err) {
  console.log('Error fetching doctor stats:', err);
    return res.status(500).json({
      error: 'Failed to fetch doctor statistics',
      details: err.message
    });
  }
};

// Get doctor by ID for public profile view
export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    let doctor = await Doctor.findById(id)
      .populate({
        path: 'user',
        select: 'email profile.firstName profile.lastName profile.fullName profile.photo status',
        match: { status: { $regex: /^active$/i } }
      });

    // Fallback: Sometimes the frontend (or deep links) may pass the user._id instead of the doctor document _id.
    // If the first lookup failed AND the provided id looks like an ObjectId, attempt a lookup by user field.
    if (!doctor && mongoose.Types.ObjectId.isValid(id)) {
      doctor = await Doctor.findOne({ user: id })
        .populate({
          path: 'user',
          select: 'email profile.firstName profile.lastName profile.fullName profile.photo status',
          match: { status: { $regex: /^active$/i } }
        });
    }

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    // Only allow viewing approved & active doctors
    if (!/^approved$/i.test(doctor.verificationStatus || '') || !doctor.user) {
      return res.status(403).json({ error: 'Doctor profile not available' });
    }
    
    res.status(200).json(doctor);
  } catch (error) {
  console.log('Error fetching doctor:', error);
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
  console.log('Error submitting rating:', error);
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
          // Generate a stable placeholder license number if not provided
          const baseLicense = req.user.profile?.licenseNumber;
          let licenseNumber = baseLicense && baseLicense.trim() ? baseLicense.trim() : null;
          if (!licenseNumber) {
            const suffix = userId.toString().slice(-6).toUpperCase();
            licenseNumber = `PENDING-${suffix}`;
          }
          doctor = new Doctor({
            user: userId,
            specialization: req.user.profile?.specialization || 'General Medicine',
            licenseNumber,
            verificationStatus: 'pending'
          });
          await doctor.save();
          
          // Now populate the user info
          doctor = await Doctor.findById(doctor._id).populate('user', 'email profile.firstName profile.lastName profile.fullName profile.photo');
        } catch (createError) {
          console.log('Error creating doctor profile:', createError);
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
  console.log('Error fetching doctor profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update profile for current doctor (basic fields + professional info)
export const updateDoctorProfile = async (req, res) => {
  try {
    if (!req.user || !['doctor','admin'].includes(req.user.role)) {
      return res.status(403).json({ success:false, message:'Forbidden: doctor/admin only' });
    }
    const userId = req.user._id;
    // Accept both flattened fields or grouped under "profile" (frontend variants)
    const payload = req.body.profile ? req.body.profile : req.body;
    const {
      firstName, lastName, phone, photo, bio,
      specialization, licenseNumber,
  education, experience, certifications,
  consultationFee,
  verificationDocuments // optional array of { type, fileUrl }
    } = payload;

    // Upsert doctor document (should already exist due to auto-create logic)
    let doctor = await Doctor.findOne({ user: userId });
    if (!doctor) {
      // Minimal create if somehow missing
      doctor = new Doctor({
        user: userId,
        specialization: specialization || 'General Medicine',
        licenseNumber: licenseNumber || `PENDING-${userId.toString().slice(-6).toUpperCase()}`,
        verificationStatus: 'pending'
      });
    }

    if (specialization) doctor.specialization = specialization;
    if (licenseNumber) doctor.licenseNumber = licenseNumber;
    if (Array.isArray(education)) {
      doctor.education = education.filter(e => e && (e.institution || e.degree));
    }
    if (Array.isArray(experience)) {
      doctor.experience = experience.filter(e => e && (e.hospital || e.position));
    }
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee; // if schema later adds it
    if (Array.isArray(certifications)) doctor.certifications = certifications; // future-proof
    if (bio) doctor.bio = bio; // future-proof if schema has bio

    // Merge verification documents (append non-duplicate types) if provided
    if (Array.isArray(verificationDocuments) && verificationDocuments.length) {
      const allowedTypes = new Set(['license','degree','certification','identity']);
      const existingByType = new Map(doctor.verificationDocuments.map(d => [d.type, d]));
      verificationDocuments.forEach(doc => {
        if (!doc || !doc.type || !doc.fileUrl) return;
        if (!allowedTypes.has(doc.type)) return;
        existingByType.set(doc.type, { type: doc.type, fileUrl: doc.fileUrl, uploadedAt: new Date() });
      });
      doctor.verificationDocuments = Array.from(existingByType.values());
      // If any verification docs present and status was rejected, revert to pending for re-review
      if (doctor.verificationStatus === 'rejected') doctor.verificationStatus = 'pending';
    }

    await doctor.save();

    // Update user profile basics
    const userProfileUpdates = {};
    if (firstName) userProfileUpdates['profile.firstName'] = firstName;
    if (lastName) userProfileUpdates['profile.lastName'] = lastName;
    if (phone) userProfileUpdates['profile.phone'] = phone;
    if (photo) userProfileUpdates['profile.photo'] = photo;
  if (bio) userProfileUpdates['profile.bio'] = bio;
    if (specialization) userProfileUpdates['profile.specialization'] = specialization;
    if (licenseNumber) userProfileUpdates['profile.licenseNumber'] = licenseNumber;
    if (Object.keys(userProfileUpdates).length) {
      await User.findByIdAndUpdate(userId, { $set: userProfileUpdates });
    }

    const refreshed = await Doctor.findById(doctor._id).populate('user', 'email profile.firstName profile.lastName profile.phone profile.photo');
    return res.status(200).json({ success:true, message:'Profile updated', doctor: refreshed });
  } catch (error) {
    console.log('Error updating doctor profile:', error);
    return res.status(500).json({ success:false, message:'Server error', details: error.message });
  }
};

// Add or replace a single verification document
export const addVerificationDocument = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'doctor') return res.status(403).json({ success:false, message:'Forbidden: doctor only' });
    const { type, fileUrl } = req.body;
    if (!type || !fileUrl) return res.status(400).json({ success:false, message:'type & fileUrl required' });
    const allowed = ['license','degree','certification','identity'];
    if (!allowed.includes(type)) return res.status(400).json({ success:false, message:'Invalid document type' });
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ success:false, message:'Doctor profile not found' });
    const idx = doctor.verificationDocuments.findIndex(d => d.type === type);
    const entry = { type, fileUrl, uploadedAt: new Date() };
    if (idx >= 0) doctor.verificationDocuments[idx] = entry; else doctor.verificationDocuments.push(entry);
    if (doctor.verificationStatus === 'rejected') doctor.verificationStatus = 'pending';
    await doctor.save();
    return res.status(200).json({ success:true, message:'Document saved', documents: doctor.verificationDocuments });
  } catch (e) {
    console.log('Error adding verification document:', e);
    return res.status(500).json({ success:false, message:'Server error', details: e.message });
  }
};

// Remove a verification document by type
export const removeVerificationDocument = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'doctor') return res.status(403).json({ success:false, message:'Forbidden: doctor only' });
    const { type } = req.params;
    if (!type) return res.status(400).json({ success:false, message:'type param required' });
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ success:false, message:'Doctor profile not found' });
    const before = doctor.verificationDocuments.length;
    doctor.verificationDocuments = doctor.verificationDocuments.filter(d => d.type !== type);
    if (doctor.verificationDocuments.length === before) return res.status(404).json({ success:false, message:'Document type not found' });
    await doctor.save();
    return res.status(200).json({ success:true, message:'Document removed', documents: doctor.verificationDocuments });
  } catch (e) {
    console.log('Error removing verification document:', e);
    return res.status(500).json({ success:false, message:'Server error', details: e.message });
  }
};

// List verification documents separately (doctor/admin)
export const listVerificationDocuments = async (req, res) => {
  try {
    if (!req.user || !['doctor','admin'].includes(req.user.role)) return res.status(403).json({ success:false, message:'Forbidden' });
    const doctor = await Doctor.findOne({ user: req.user._id }).select('verificationDocuments verificationStatus');
    if (!doctor) return res.status(404).json({ success:false, message:'Doctor profile not found' });
    return res.status(200).json({ success:true, status: doctor.verificationStatus, documents: doctor.verificationDocuments });
  } catch (e) {
    console.log('Error listing verification documents:', e);
    return res.status(500).json({ success:false, message:'Server error', details: e.message });
  }
};

// Admin view any doctor's documents by doctorId or userId
export const adminGetDoctorFullProfile = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success:false, message:'Forbidden' });
    const { id } = req.params; // could be doctor doc id or user id
    let doctor = null;
    if (id && id.length === 24) {
      doctor = await Doctor.findById(id).populate('user', 'email profile firstName lastName role status isVerified');
      if (!doctor) {
        doctor = await Doctor.findOne({ user: id }).populate('user', 'email profile firstName lastName role status isVerified');
      }
    }
    if (!doctor) return res.status(404).json({ success:false, message:'Doctor not found' });
    return res.status(200).json({ success:true, doctor });
  } catch (e) {
    console.log('Error admin fetching doctor profile:', e);
    return res.status(500).json({ success:false, message:'Server error', details: e.message });
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
  updateDoctorProfile,
  getDoctorById,
  rateDoctorById
};
