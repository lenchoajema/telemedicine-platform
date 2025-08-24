import Prescription from './prescriptions.model.js';
import User from '../auth/user.model.js';

// Create a new prescription (doctors only)
export const createPrescription = async (req, res) => {
  try {
    const { prescription } = req.body;
    const { patientId } = req.params;
    const doctorId = req.user._id;

    // Validate patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const newPrescription = new Prescription({
      patient: patientId,
      doctor: doctorId,
      prescription
    });

    const saved = await newPrescription.save();

    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.log('Error creating prescription:', error);
    res.status(500).json({ success: false, message: 'Failed to create prescription', error: error.message });
  }
};
