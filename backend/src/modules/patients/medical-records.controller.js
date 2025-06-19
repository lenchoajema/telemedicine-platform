import mongoose from 'mongoose';
import MedicalRecord from './medical-record.model.js';
import User from '../auth/user.model.js';

// Get all medical records for the authenticated user
export const getMedicalRecords = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { patientId } = req.query;

    let query = {};

    if (userRole === 'patient') {
      // Patients can only see their own records
      query.patient = userId;
    } else if (userRole === 'doctor') {
      if (patientId) {
        // Doctor viewing specific patient's records
        query.patient = patientId;
        query.doctor = userId;
      } else {
        // Doctor viewing all their patients' records
        query.doctor = userId;
      }
    } else if (userRole === 'admin') {
      // Admins can view all records, optionally filtered by patient
      if (patientId) {
        query.patient = patientId;
      }
    }

    const records = await MedicalRecord.find(query)
      .populate('patient', 'profile.firstName profile.lastName email')
      .populate('doctor', 'profile.firstName profile.lastName profile.specialization')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      records
    });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medical records',
      error: error.message
    });
  }
};

// Get a specific medical record by ID
export const getMedicalRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const record = await MedicalRecord.findById(id)
      .populate('patient', 'profile.firstName profile.lastName email')
      .populate('doctor', 'profile.firstName profile.lastName profile.specialization');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Check permissions
    if (userRole === 'patient' && record.patient._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this record'
      });
    }

    if (userRole === 'doctor' && record.doctor._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this record'
      });
    }

    res.status(200).json({
      success: true,
      record
    });
  } catch (error) {
    console.error('Error fetching medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medical record',
      error: error.message
    });
  }
};

// Create a new medical record (doctors only)
export const createMedicalRecord = async (req, res) => {
  try {
    const { patientId, diagnosis, treatment, notes, prescription, medications, vitals } = req.body;
    const doctorId = req.user._id;

    // Validate patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const medicalRecord = new MedicalRecord({
      patient: patientId,
      doctor: doctorId,
      diagnosis,
      treatment,
      notes,
      prescription,
      medications,
      vitals
    });

    const savedRecord = await medicalRecord.save();
    
    // Populate the saved record
    const populatedRecord = await MedicalRecord.findById(savedRecord._id)
      .populate('patient', 'profile.firstName profile.lastName email')
      .populate('doctor', 'profile.firstName profile.lastName profile.specialization');

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      record: populatedRecord
    });
  } catch (error) {
    console.error('Error creating medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create medical record',
      error: error.message
    });
  }
};

// Update an existing medical record (doctors only)
export const updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updateData = req.body;

    // Find the record and check permissions
    const record = await MedicalRecord.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Only the doctor who created the record can update it
    if (record.doctor.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this record'
      });
    }

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('patient', 'profile.firstName profile.lastName email')
      .populate('doctor', 'profile.firstName profile.lastName profile.specialization');

    res.status(200).json({
      success: true,
      message: 'Medical record updated successfully',
      record: updatedRecord
    });
  } catch (error) {
    console.error('Error updating medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update medical record',
      error: error.message
    });
  }
};
