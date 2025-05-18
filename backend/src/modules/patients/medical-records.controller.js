import mongoose from 'mongoose';

// Simple in-memory storage for medical records until we create a proper model
let medicalRecords = [
  {
    _id: new mongoose.Types.ObjectId().toString(),
    patientId: '123456789012345678901234', // Example patient ID
    doctorId: '123456789012345678901235',  // Example doctor ID
    date: new Date('2025-04-15'),
    diagnosis: 'Common Cold',
    treatment: 'Rest and fluids',
    notes: 'Patient should recover in 7-10 days',
    medications: [
      { name: 'Paracetamol', dosage: '500mg', frequency: 'Every 6 hours as needed' }
    ],
    attachments: []
  }
];

// Get all medical records for the authenticated user
export const getMedicalRecords = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Filter records based on user role
    let records = [];
    
    if (req.user.role === 'patient') {
      // Patients can only see their own records
      records = medicalRecords.filter(record => record.patientId === userId.toString());
    } else if (req.user.role === 'doctor') {
      // Doctors can see records of patients they've treated
      records = medicalRecords.filter(record => record.doctorId === userId.toString());
    } else if (req.user.role === 'admin') {
      // Admins can see all records
      records = [...medicalRecords];
    }
    
    return res.status(200).json(records);
  } catch (error) {
    console.error('Error getting medical records:', error);
    return res.status(500).json({ error: 'Failed to retrieve medical records' });
  }
};

// Get a specific medical record by ID
export const getMedicalRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const record = medicalRecords.find(r => r._id === id);
    
    if (!record) {
      return res.status(404).json({ error: 'Medical record not found' });
    }
    
    // Check permissions based on role
    if (req.user.role === 'patient' && record.patientId !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to access this record' });
    }
    
    if (req.user.role === 'doctor' && record.doctorId !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to access this record' });
    }
    
    return res.status(200).json(record);
  } catch (error) {
    console.error('Error getting medical record:', error);
    return res.status(500).json({ error: 'Failed to retrieve medical record' });
  }
};

// Create a new medical record
export const createMedicalRecord = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { patientId, diagnosis, treatment, notes, medications } = req.body;
    
    if (!patientId || !diagnosis) {
      return res.status(400).json({ error: 'Patient ID and diagnosis are required' });
    }
    
    const newRecord = {
      _id: new mongoose.Types.ObjectId().toString(),
      patientId,
      doctorId: doctorId.toString(),
      date: new Date(),
      diagnosis,
      treatment,
      notes,
      medications: medications || [],
      attachments: []
    };
    
    medicalRecords.push(newRecord);
    
    return res.status(201).json(newRecord);
  } catch (error) {
    console.error('Error creating medical record:', error);
    return res.status(500).json({ error: 'Failed to create medical record' });
  }
};

// Update an existing medical record
export const updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user._id;
    const { diagnosis, treatment, notes, medications } = req.body;
    
    const recordIndex = medicalRecords.findIndex(r => r._id === id);
    
    if (recordIndex === -1) {
      return res.status(404).json({ error: 'Medical record not found' });
    }
    
    const record = medicalRecords[recordIndex];
    
    // Only the doctor who created the record can update it
    if (record.doctorId !== doctorId.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this record' });
    }
    
    // Update the record
    medicalRecords[recordIndex] = {
      ...record,
      diagnosis: diagnosis || record.diagnosis,
      treatment: treatment || record.treatment,
      notes: notes || record.notes,
      medications: medications || record.medications,
      updatedAt: new Date()
    };
    
    return res.status(200).json(medicalRecords[recordIndex]);
  } catch (error) {
    console.error('Error updating medical record:', error);
    return res.status(500).json({ error: 'Failed to update medical record' });
  }
};
