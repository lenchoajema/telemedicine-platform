import Doctor from './doctor.model.js';

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
