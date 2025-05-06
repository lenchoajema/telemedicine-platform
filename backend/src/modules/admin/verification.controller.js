import Doctor from '../doctors/doctor.model.js';
import User from '../auth/user.model.js';

// Get all doctors with pending verification
export const getPendingVerifications = async (req, res) => {
  try {
    const pendingDoctors = await Doctor.find({ verificationStatus: 'pending' })
      .populate('user', 'email profile.firstName profile.lastName profile.phone')
      .sort({ createdAt: 1 });
    
    res.status(200).json(pendingDoctors);
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get verification details for a specific doctor
export const getVerificationDetails = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const doctor = await Doctor.findById(doctorId)
      .populate('user', 'email profile.firstName profile.lastName profile.phone createdAt');
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    res.status(200).json(doctor);
  } catch (error) {
    console.error('Error fetching verification details:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Approve doctor verification
export const approveVerification = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const adminId = req.user._id;
    
    const doctor = await Doctor.findById(doctorId);
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    // Update the doctor's verification status
    doctor.verificationStatus = 'approved';
    doctor.verifiedAt = new Date();
    doctor.verifiedBy = adminId;
    doctor.verificationNotes = req.body.notes || '';
    
    await doctor.save();
    
    // Update the user's role if it's not already set to doctor
    await User.findOneAndUpdate(
      { _id: doctor.user },
      { 
        $set: { 
          'isVerified': true,
          'profile.isVerified': true
        } 
      }
    );
    
    res.status(200).json({ message: 'Doctor verification approved successfully', doctor });
  } catch (error) {
    console.error('Error approving verification:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Reject doctor verification
export const rejectVerification = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const adminId = req.user._id;
    
    const doctor = await Doctor.findById(doctorId);
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    // Update the doctor's verification status
    doctor.verificationStatus = 'rejected';
    doctor.verifiedAt = new Date();
    doctor.verifiedBy = adminId;
    doctor.verificationNotes = req.body.notes || 'Verification rejected';
    
    await doctor.save();
    
    res.status(200).json({ message: 'Doctor verification rejected', doctor });
  } catch (error) {
    console.error('Error rejecting verification:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
