import Doctor from './doctor.model.js';
import upload from '../../services/upload.service.js';
import { getFileUrl } from '../../services/upload.service.js';

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