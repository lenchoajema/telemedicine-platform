import LabExamination from '../patients/lab-examination.model.js';
import ImagingReport from '../patients/imaging-report.model.js';
import AppointmentLifecycleEvent from '../appointments/appointment-lifecycle-event.model.js';

export const createLabOrders = async (req, res) => {
  try {
  const { appointmentId, patientId, items, lifecycleId, indicationText } = req.body;
    const created = [];
    for (const item of items || []) {
      const row = await LabExamination.create({
        patient: patientId,
        testType: item.testType || item.label || 'LabTest',
        status: 'ordered',
        notes: indicationText,
      });
      created.push(row);
    }
    // Log lifecycle event only if a lifecycleId is provided; don't fail the request if logging fails
    if (lifecycleId) {
      try {
        await AppointmentLifecycleEvent.create({
          lifecycleId,
          eventType: 'LabOrdered',
          actorId: req.user._id,
          payload: { appointmentId, count: created.length }
        });
      } catch (e) {
        console.log('Warning: failed to record LabOrdered lifecycle event:', e?.message || e);
      }
    }
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.log('Error createLabOrders:', error);
    res.status(500).json({ success: false, message: 'Failed to create lab orders', error: error.message });
  }
};

export const createImagingOrder = async (req, res) => {
  try {
  const { appointmentId, patientId, modality, bodyPart, lifecycleId } = req.body;
    const acc = 'ACC-' + Date.now();
    const row = await ImagingReport.create({
      patient: patientId,
      modality,
      bodyPart,
      status: 'scheduled',
      findings: '',
      impression: '',
    });
    // Log lifecycle event only if a lifecycleId is provided; don't fail the request if logging fails
    if (lifecycleId) {
      try {
        await AppointmentLifecycleEvent.create({
          lifecycleId,
          eventType: 'ImagingOrdered',
          actorId: req.user._id,
          payload: { appointmentId, imagingId: row._id, accessionNumber: acc }
        });
      } catch (e) {
        console.log('Warning: failed to record ImagingOrdered lifecycle event:', e?.message || e);
      }
    }
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    console.log('Error createImagingOrder:', error);
    res.status(500).json({ success: false, message: 'Failed to create imaging order', error: error.message });
  }
};

export const updateLabStatus = async (req, res) => {
  try {
    const { labExamId } = req.params;
    const { status, resultValuesJSON } = req.body;
    const allowed = ['ordered','in-progress','completed','cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const row = await LabExamination.findByIdAndUpdate(labExamId, { status, results: resultValuesJSON }, { new: true });
    if (!row) return res.status(404).json({ success: false, message: 'Lab exam not found' });
    res.json({ success: true, data: row });
  } catch (error) {
    console.log('Error updateLabStatus:', error);
    res.status(500).json({ success: false, message: 'Failed to update lab status', error: error.message });
  }
};

export const updateImagingStatus = async (req, res) => {
  try {
    const { imagingId } = req.params;
    const { status, reportText } = req.body;
    const allowed = ['scheduled','in-progress','completed','cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const row = await ImagingReport.findByIdAndUpdate(imagingId, { status, findings: reportText }, { new: true });
    if (!row) return res.status(404).json({ success: false, message: 'Imaging report not found' });
    res.json({ success: true, data: row });
  } catch (error) {
    console.log('Error updateImagingStatus:', error);
    res.status(500).json({ success: false, message: 'Failed to update imaging status', error: error.message });
  }
};

export const postLabResults = async (req, res) => {
  try {
    const { labExamId } = req.params;
    const { resultValuesJSON, lifecycleId, appointmentId } = req.body;
    const row = await LabExamination.findByIdAndUpdate(
      labExamId,
      { status: 'completed', results: resultValuesJSON },
      { new: true }
    );
    if (!row) return res.status(404).json({ success: false, message: 'Lab exam not found' });
    // Lifecycle event
    if (lifecycleId) {
      try {
        await AppointmentLifecycleEvent.create({
          lifecycleId,
          eventType: 'ResultsPosted',
          actorId: req.user._id,
          payload: { appointmentId, labExamId }
        });
      } catch (e) {
        console.log('Warning: failed to record ResultsPosted lifecycle event:', e?.message || e);
      }
    }
    res.json({ success: true, data: row });
  } catch (error) {
    console.log('Error postLabResults:', error);
    res.status(500).json({ success: false, message: 'Failed to upload lab results', error: error.message });
  }
};

export const postImagingReport = async (req, res) => {
  try {
    const { imagingId } = req.params;
    const { reportText, lifecycleId, appointmentId } = req.body;
    const row = await ImagingReport.findByIdAndUpdate(
      imagingId,
      { status: 'completed', findings: reportText },
      { new: true }
    );
    if (!row) return res.status(404).json({ success: false, message: 'Imaging report not found' });
    if (lifecycleId) {
      try {
        await AppointmentLifecycleEvent.create({
          lifecycleId,
          eventType: 'ResultsPosted',
          actorId: req.user._id,
          payload: { appointmentId, imagingId }
        });
      } catch (e) {
        console.log('Warning: failed to record ResultsPosted lifecycle event (imaging):', e?.message || e);
      }
    }
    res.json({ success: true, data: row });
  } catch (error) {
    console.log('Error postImagingReport:', error);
    res.status(500).json({ success: false, message: 'Failed to upload imaging report', error: error.message });
  }
};

// List endpoints for labs and imaging
export const listLabOrders = async (req, res) => {
  try {
    const { patientId, status } = req.query;
    const query = {};
    if (patientId) query.patient = patientId;
    if (status) query.status = status;
    // Note: appointmentId is accepted by client but not persisted on LabExamination; filter by patient/status.
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
    const rows = await LabExamination.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.log('Error listLabOrders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lab orders', error: error.message });
  }
};

export const listImagingOrders = async (req, res) => {
  try {
    const { patientId, status } = req.query;
    const query = {};
    if (patientId) query.patient = patientId;
    if (status) query.status = status;
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
    const rows = await ImagingReport.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.log('Error listImagingOrders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch imaging orders', error: error.message });
  }
};
