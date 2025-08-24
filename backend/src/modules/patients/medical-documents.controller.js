import MedicalDocument from './medical-document.model.js';
import { getFileUrl } from '../../services/upload.service.js';

// Upload helper
export const createMedicalDocument = async (req, res) => {
  try {
    const { patientId } = req.body;
    if (!patientId) { return res.status(400).json({ success: false, message: 'patientId is required' }); }
    const file = req.file;
    if (!file) { return res.status(400).json({ success: false, message: 'No file uploaded' }); }
    // Build record
    const doc = new MedicalDocument({
      patient: patientId,
      uploadedBy: req.user._id,
      fileUrl: getFileUrl(file, req),
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });
    const saved = await doc.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.log('Error uploading medical document:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMedicalDocuments = async (req, res) => {
  try {
    const docs = await MedicalDocument.find({ patient: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: docs });
  } catch (err) {
    console.log('Error fetching medical documents:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMedicalDocument = async (req, res) => {
  // Optional: return single record
  res.status(200).json({ success: true, data: {} });
};
