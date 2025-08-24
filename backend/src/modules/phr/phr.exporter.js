import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import MedicalRecord from '../patients/medical-record.model.js';
import Prescription from '../patients/prescriptions.model.js';
import MedicalDocument from '../patients/medical-document.model.js';
import PHRExportJob from './phrExportJob.model.js';
import LabExamination from '../patients/lab-examination.model.js';
import ImagingReport from '../patients/imaging-report.model.js';

function ensureExportDir(){
  const dir = path.join(process.cwd(),'uploads','exports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir,{ recursive:true });
  return dir;
}

async function buildFHIRBundle(patientId){
  // Minimal illustrative bundle (non production ready)
  const [records, prescriptions, documents, labs, imaging] = await Promise.all([
    MedicalRecord.find({ patient: patientId }).lean(),
    Prescription.find({ patient: patientId }).lean(),
    MedicalDocument.find({ patient: patientId }).lean(),
    LabExamination.find({ patient: patientId }).lean(),
    ImagingReport.find({ patient: patientId }).lean()
  ]);

  const bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: new Date().toISOString(),
    entry: []
  };

  // Map records to simple Encounter resources
  records.forEach(r=>{
    bundle.entry.push({ resource:{ resourceType:'Encounter', id: String(r._id), status:'finished', period:{ start:r.createdAt, end:r.updatedAt||r.createdAt }, reasonCode: r.diagnosis ? [{ text: r.diagnosis }] : undefined, note: r.notes ? [{ text:r.notes }] : undefined }});
  });
  // Prescriptions -> MedicationRequest
  prescriptions.forEach(p=>{
    bundle.entry.push({ resource:{ resourceType:'MedicationRequest', id:String(p._id), status:'active', intent:'order', authoredOn:p.date, note: p.prescription ? [{ text:p.prescription }] : undefined }});
  });
  // Documents -> DocumentReference
  documents.forEach(d=>{
    bundle.entry.push({ resource:{ resourceType:'DocumentReference', id:String(d._id), date:d.createdAt, content:[{ attachment:{ url:d.fileUrl, title:d.filename, contentType:d.mimeType, size:d.size } }] }});
  });
  // Labs -> Observation (simplified)
  labs.forEach(l=>{
    (l.results||[]).forEach(res=>{
      bundle.entry.push({ resource:{ resourceType:'Observation', id:`lab-${l._id}-${res.name}`.replace(/[^A-Za-z0-9-]/g,'_'), status:l.status==='completed'?'final':'preliminary', code:{ text: res.name }, valueString: res.value, referenceRange: res.referenceRange ? [{ text: res.referenceRange }] : undefined, note: l.testType ? [{ text: l.testType }] : undefined }});
    });
  });
  // Imaging -> DiagnosticReport (simplified)
  imaging.forEach(r=>{
    bundle.entry.push({ resource:{ resourceType:'DiagnosticReport', id:String(r._id), status:r.status==='completed'?'final':'partial', code:{ text: r.modality }, conclusion: r.impression, presentedForm: (r.attachments||[]).map(a=>({ contentType:a.mimeType, url:a.fileUrl, title:a.originalName })) }});
  });

  return bundle;
}

async function generatePDF(patientId){
  const [records, prescriptions, documents, labs, imaging] = await Promise.all([
    MedicalRecord.find({ patient: patientId }).sort({ createdAt:-1 }).lean(),
    Prescription.find({ patient: patientId }).sort({ date:-1 }).lean(),
    MedicalDocument.find({ patient: patientId }).sort({ createdAt:-1 }).lean(),
    LabExamination.find({ patient: patientId }).sort({ createdAt:-1 }).lean(),
    ImagingReport.find({ patient: patientId }).sort({ createdAt:-1 }).lean()
  ]);
  const exportDir = ensureExportDir();
  const filename = `phr-export-${patientId}-${Date.now()}.pdf`;
  const filePath = path.join(exportDir, filename);
  const doc = new PDFDocument({ autoFirstPage:true });
  doc.pipe(fs.createWriteStream(filePath));
  doc.fontSize(20).text('Personal Health Record Export', { align:'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
  doc.moveDown();

  doc.fontSize(16).text('Consultations', { underline:true });
  if (!records.length) doc.text('No consultations');
  records.slice(0,50).forEach(r=>{
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Date: ${new Date(r.createdAt).toLocaleString()}`);
    if (r.diagnosis) doc.text(`Diagnosis: ${r.diagnosis}`);
    if (r.notes) doc.text(`Notes: ${r.notes.substring(0,500)}`);
  });

  doc.addPage();
  doc.fontSize(16).text('Prescriptions', { underline:true });
  if (!prescriptions.length) doc.text('No prescriptions');
  prescriptions.slice(0,100).forEach(p=>{
    doc.moveDown(0.5);
    doc.fontSize(12).text(`${new Date(p.date).toLocaleDateString()} - ${p.prescription}`);
  });

  doc.addPage();
  doc.fontSize(16).text('Documents', { underline:true });
  if (!documents.length) doc.text('No documents');
  documents.slice(0,100).forEach(d=>{
    doc.moveDown(0.5);
    doc.fontSize(12).text(`${d.filename} (${d.mimeType||'unknown'})`);
  });

  doc.addPage();
  doc.fontSize(16).text('Lab Results', { underline:true });
  if (!labs.length) doc.text('No lab examinations');
  labs.slice(0,50).forEach(l=>{
    doc.moveDown(0.5);
    doc.fontSize(12).text(`${l.testType} - ${l.status}`);
    (l.results||[]).slice(0,10).forEach(r=>{
      doc.text(`  ${r.name}: ${r.value} ${r.unit||''} (${r.referenceRange||'ref n/a'}) ${r.flag? '['+r.flag+']':''}`);
    });
  });

  doc.addPage();
  doc.fontSize(16).text('Imaging Reports', { underline:true });
  if (!imaging.length) doc.text('No imaging reports');
  imaging.slice(0,50).forEach(r=>{
    doc.moveDown(0.5);
    doc.fontSize(12).text(`${r.modality} ${r.bodyPart||''} - ${r.status}`);
    if (r.impression) doc.text(`Impression: ${r.impression.substring(0,400)}`);
  });

  doc.end();
  return `/uploads/exports/${filename}`;
}

export async function processExportJob(jobId){
  const job = await PHRExportJob.findById(jobId);
  if (!job || job.status !== 'Pending') return;
  try {
    job.status = 'Processing';
    job.progress = 5; await job.save();

    if (job.format === 'json_fhir') {
      job.progress = 15; await job.save();
      const bundle = await buildFHIRBundle(job.patientId);
      job.progress = 75; await job.save();
      const dir = ensureExportDir();
      const filename = `phr-export-${job.patientId}-${Date.now()}.fhir.json`;
      fs.writeFileSync(path.join(dir, filename), JSON.stringify(bundle,null,2));
      job.artifactUrl = `/uploads/exports/${filename}`;
      job.progress = 100;
    } else if (job.format === 'pdf') {
      job.progress = 15; await job.save();
      const url = await generatePDF(job.patientId);
      job.artifactUrl = url;
      job.progress = 100;
    }
    job.status = 'Completed';
    job.completedAt = new Date();
    await job.save();
  } catch(err){
    job.status = 'Failed';
    job.error = err.message;
    await job.save();
  }
}

export function enqueueProcess(jobId){
  // Simple in-process async execution; replace with queue/worker later
  globalThis.setTimeout(()=>{
    processExportJob(jobId).catch(()=>{});
  }, 10);
}
