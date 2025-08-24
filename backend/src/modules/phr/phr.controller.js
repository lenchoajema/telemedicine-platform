import PHRAccessLog from './phrAccessLog.model.js';
import PHRShareLink from './phrShareLink.model.js';
import Prescription from '../patients/prescriptions.model.js';
import MedicalRecord from '../patients/medical-record.model.js';
import MedicalDocument from '../patients/medical-document.model.js';
import LabExamination from '../patients/lab-examination.model.js';
import ImagingReport from '../patients/imaging-report.model.js';
import crypto from 'crypto';
import PHRExportJob from './phrExportJob.model.js';
import PHRPreference from './phrPreference.model.js';
import { enqueueProcess } from './phr.exporter.js';

// Utility: hash token
function hashToken(token){
  return crypto.createHash('sha256').update(token).digest('hex');
}

function logAccess(req, { accessType, resourceScope, resourceIds }) {
  try {
    PHRAccessLog.create({
      patientId: req.user._id,
      actorUserId: req.user._id,
      accessType,
      resourceScope,
      resourceIds,
      channel: 'Web',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.headers['x-correlation-id']
    }).catch(()=>{});
  } catch { /* ignore */ }
}

// GET /api/phr/overview
export const getOverview = async (req, res) => {
  try {
    const patientId = req.user._id;
    const [latestRecord] = await MedicalRecord.find({ patient: patientId }).sort({ createdAt: -1 }).limit(1);
    const activePrescriptions = await Prescription.find({ patient: patientId }).sort({ date: -1 }).limit(5);
    const documents = await MedicalDocument.find({ patient: patientId }).sort({ createdAt: -1 }).limit(3);
    const recentLabs = await LabExamination.find({ patient: patientId }).sort({ createdAt:-1 }).limit(3).select('testType status createdAt');
    const recentImaging = await ImagingReport.find({ patient: patientId }).sort({ createdAt:-1 }).limit(3).select('modality status createdAt');
    logAccess(req, { accessType: 'SelfView', resourceScope: 'Overview' });
    return res.json({ success: true, data: { latestRecord, activePrescriptions, documents, recentLabs, recentImaging } });
  } catch (err) {
    console.log('Error fetching PHR overview:', err);
    return res.status(500).json({ success: false, message: 'Failed to load overview' });
  }
};

// POST /api/phr/share-links
export const createShareLink = async (req, res) => {
  try {
    const { scope, expiresInHours = 24, uses } = req.body;
    const token = PHRShareLink.generateToken();
    const tokenHash = hashToken(token);
    const share = await PHRShareLink.create({
      patientId: req.user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + expiresInHours * 3600 * 1000),
      createdBy: req.user._id,
      scope,
      usesRemaining: uses
    });
    logAccess(req, { accessType: 'ShareLinkCreate', resourceScope: 'Bundle' });
    return res.status(201).json({ success: true, data: { id: share._id, token, expiresAt: share.expiresAt } });
  } catch (err) {
    console.log('Error creating share link:', err);
    return res.status(500).json({ success: false, message: 'Failed to create share link' });
  }
};

// External read-only share access
// GET /api/phr/share/:token
export const externalShareAccess = async (req, res) => {
  try {
    const { token } = req.params;
    const tokenHash = hashToken(token);
    const link = await PHRShareLink.findOne({ tokenHash });
    if (!link) return res.status(404).json({ success:false, message:'Invalid token' });
    if (link.revokedAt) return res.status(404).json({ success:false, message:'Token revoked' });
    if (link.expiresAt < new Date()) return res.status(404).json({ success:false, message:'Token expired' });
    if (link.usesRemaining != null && link.usesRemaining <= 0) return res.status(404).json({ success:false, message:'Token exhausted' });
    // decrement uses if limited
    if (link.usesRemaining != null){ link.usesRemaining -= 1; await link.save(); }
    // Build minimal bundle (expand later)
    const patientId = link.patientId;
    const latestRecords = await MedicalRecord.find({ patient: patientId }).sort({ createdAt:-1 }).limit(5);
    const prescriptions = await Prescription.find({ patient: patientId }).sort({ date:-1 }).limit(10);
    const documents = await MedicalDocument.find({ patient: patientId }).sort({ createdAt:-1 }).limit(5).select('originalName fileName createdAt');
    const labs = await LabExamination.find({ patient: patientId }).sort({ createdAt:-1 }).limit(5).select('testType status createdAt');
    const imaging = await ImagingReport.find({ patient: patientId }).sort({ createdAt:-1 }).limit(5).select('modality status createdAt');
    return res.json({ success:true, data:{ records: latestRecords, prescriptions, documents, labs, imaging, scope: link.scope, expiresAt: link.expiresAt } });
  } catch(err){
    console.log('Error external share access:', err);
    return res.status(500).json({ success:false, message:'Failed to access share' });
  }
};

// GET /api/phr/share-links
export const listShareLinks = async (req, res) => {
  try {
    const links = await PHRShareLink.find({ patientId: req.user._id, revokedAt: { $exists: false } })
      .select('-tokenHash');
    return res.json({ success: true, data: links });
  } catch (err) {
    console.log('Error listing share links:', err);
    return res.status(500).json({ success: false, message: 'Failed to list share links' });
  }
};

// PATCH /api/phr/share-links/:id/revoke
export const revokeShareLink = async (req, res) => {
  try {
    const { id } = req.params;
    const link = await PHRShareLink.findOne({ _id: id, patientId: req.user._id });
    if (!link) return res.status(404).json({ success: false, message: 'Share link not found' });
    link.revokedAt = new Date();
    link.revokedBy = req.user._id;
    await link.save();
    logAccess(req, { accessType: 'Revoke', resourceScope: 'Bundle', resourceIds: [id] });
    return res.json({ success: true, data: { id: link._id, revokedAt: link.revokedAt } });
  } catch (err) {
    console.log('Error revoking share link:', err);
    return res.status(500).json({ success: false, message: 'Failed to revoke link' });
  }
};

// Paginated consultations
// GET /api/phr/consultations?page=&limit=
export const listConsultations = async (req,res)=>{
  try {
    const patientId = req.user._id;
    const page = parseInt(req.query.page,10)||1;
    const limit = parseInt(req.query.limit,10)||10;
    const skip = (page-1)*limit;
    const [items,total] = await Promise.all([
      MedicalRecord.find({ patient: patientId }).sort({ createdAt:-1 }).skip(skip).limit(limit).populate('doctor','profile.firstName profile.lastName'),
      MedicalRecord.countDocuments({ patient: patientId })
    ]);
    logAccess(req,{ accessType:'SelfView', resourceScope:'Consultation', resourceIds: items.map(i=>i._id.toString()) });
    return res.json({ success:true, data:{ items, pagination:{ page, pages: Math.ceil(total/limit), total } } });
  } catch(err){
    console.log('Error listing consultations:', err);
    return res.status(500).json({ success:false, message:'Failed to load consultations' });
  }
};

// GET /api/phr/prescriptions
export const listPrescriptions = async (req,res)=>{
  try {
    const patientId = req.user._id;
    const items = await Prescription.find({ patient: patientId }).sort({ date:-1 }).limit(100);
    logAccess(req,{ accessType:'SelfView', resourceScope:'Prescription', resourceIds: items.map(i=>i._id.toString()) });
    return res.json({ success:true, data: items });
  } catch(err){
    console.log('Error listing prescriptions:', err);
    return res.status(500).json({ success:false, message:'Failed to load prescriptions' });
  }
};

// GET /api/phr/documents
export const listDocuments = async (req,res)=>{
  try {
    const patientId = req.user._id;
    const docs = await MedicalDocument.find({ patient: patientId }).sort({ createdAt:-1 }).limit(200);
    logAccess(req,{ accessType:'SelfView', resourceScope:'Documents' });
    return res.json({ success:true, data: docs });
  } catch(err){
    console.log('Error listing documents:', err);
    return res.status(500).json({ success:false, message:'Failed to load documents' });
  }
};

// GET /api/phr/labs
export const listLabs = async (req,res)=>{
  try {
    const patientId = req.user._id;
    const status = req.query.status;
    const filter = { patient: patientId };
    if (status) filter.status = status;
    const page = parseInt(req.query.page,10)||1;
    const limit = parseInt(req.query.limit,10)||10;
    const skip = (page-1)*limit;
    const [items,total] = await Promise.all([
      LabExamination.find(filter).sort({ createdAt:-1 }).skip(skip).limit(limit),
      LabExamination.countDocuments(filter)
    ]);
    logAccess(req,{ accessType:'SelfView', resourceScope:'Lab', resourceIds: items.map(i=>i._id.toString()) });
    return res.json({ success:true, data:{ items, pagination:{ page, pages: Math.ceil(total/limit), total } } });
  } catch(err){
    console.log('Error listing labs:', err);
    return res.status(500).json({ success:false, message:'Failed to load labs' });
  }
};

// GET /api/phr/imaging
export const listImaging = async (req,res)=>{
  try {
    const patientId = req.user._id;
    const status = req.query.status;
    const filter = { patient: patientId };
    if (status) filter.status = status;
    const page = parseInt(req.query.page,10)||1;
    const limit = parseInt(req.query.limit,10)||10;
    const skip = (page-1)*limit;
    const [items,total] = await Promise.all([
      ImagingReport.find(filter).sort({ createdAt:-1 }).skip(skip).limit(limit),
      ImagingReport.countDocuments(filter)
    ]);
    logAccess(req,{ accessType:'SelfView', resourceScope:'Imaging', resourceIds: items.map(i=>i._id.toString()) });
    return res.json({ success:true, data:{ items, pagination:{ page, pages: Math.ceil(total/limit), total } } });
  } catch(err){
    console.log('Error listing imaging:', err);
    return res.status(500).json({ success:false, message:'Failed to load imaging' });
  }
};

// Preferences
export const getPreferences = async (req,res)=>{
  try {
    const pref = await PHRPreference.findOne({ patientId: req.user._id }) || await PHRPreference.create({ patientId: req.user._id });
    return res.json({ success:true, data: pref });
  } catch(err){
    console.log('Error getting preferences:', err);
    return res.status(500).json({ success:false, message:'Failed to load preferences' });
  }
};
export const updatePreferences = async (req,res)=>{
  try {
    const allowed = ['share_phr_by_default','allow_ephemeral_links','allow_export_pdf','allow_export_fhir'];
    const update = {};
    allowed.forEach(k=>{ if (k in req.body) update[k]= !!req.body[k]; });
    const pref = await PHRPreference.findOneAndUpdate({ patientId: req.user._id }, update, { upsert:true, new:true });
    logAccess(req,{ accessType:'SelfView', resourceScope:'Settings' });
    return res.json({ success:true, data: pref });
  } catch(err){
    console.log('Error updating preferences:', err);
    return res.status(500).json({ success:false, message:'Failed to update preferences' });
  }
};

// Audit log list
export const listAccessLogs = async (req,res)=>{
  try {
    const patientId = req.user._id;
    const page = parseInt(req.query.page,10)||1;
    const limit = parseInt(req.query.limit,10)||20;
    const skip = (page-1)*limit;
    const [rows,total] = await Promise.all([
      PHRAccessLog.find({ patientId }).sort({ createdAt:-1 }).skip(skip).limit(limit),
      PHRAccessLog.countDocuments({ patientId })
    ]);
    return res.json({ success:true, data:{ rows, pagination:{ page, pages: Math.ceil(total/limit), total } } });
  } catch(err){
    console.log('Error loading audit logs:', err);
    return res.status(500).json({ success:false, message:'Failed to load audit logs' });
  }
 };

 // Export jobs
 export const createExportJob = async (req,res)=>{
   try {
     const { format } = req.body; // 'pdf' | 'json_fhir'
     if (!['pdf','json_fhir'].includes(format)) return res.status(400).json({ success:false, message:'Unsupported format' });
     const job = await PHRExportJob.create({ patientId: req.user._id, format, status:'Pending', progress:0, modelVersion:'v1' });
     enqueueProcess(job._id);
     logAccess(req,{ accessType:'Export', resourceScope:'Bundle', resourceIds:[job._id.toString()] });
     return res.status(201).json({ success:true, data: job });
   } catch(err){
    console.log('Error creating export job:', err);
    return res.status(500).json({ success:false, message:'Failed to create export job' });
   }
 };
export const getExportJob = async (req,res)=>{
  try {
    const { jobId } = req.params;
    const job = await PHRExportJob.findOne({ _id: jobId, patientId: req.user._id });
    if (!job) return res.status(404).json({ success:false, message:'Job not found' });
    return res.json({ success:true, data: job });
  } catch(err){
    console.log('Error getting export job:', err);
    return res.status(500).json({ success:false, message:'Failed to get export job' });
  }
};
