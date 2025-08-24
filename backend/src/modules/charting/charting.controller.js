import ConsultationNote from './consultation-note.model.js';
import NoteTemplate from './note-template.model.js';
import Observation from './observations.model.js';
import Appointment from '../appointments/appointment.model.js';
import AppointmentLifecycleEvent from '../appointments/appointment-lifecycle-event.model.js';

// GET /api/appointments/:id/chart
export const getChart = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appt = await Appointment.findById(appointmentId).populate('patient doctor');
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });

    const note = await ConsultationNote.findOne({ appointmentId }).sort({ version: -1 });

    res.json({ success: true, data: { appointment: appt, note } });
  } catch (error) {
    console.log('Error getChart:', error);
    res.status(500).json({ success: false, message: 'Failed to load chart', error: error.message });
  }
};

// POST /api/appointments/:id/notes
export const upsertNote = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { sectionsJSON, templateId } = req.body;
    const appt = await Appointment.findById(appointmentId);
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });

    const latest = await ConsultationNote.findOne({ appointmentId }).sort({ version: -1 });
    const nextVersion = (latest?.version || 0) + 1;

    // Resolve sections from template or provided body; fallback to baseline SOAP
    let initialSections = sectionsJSON || {};
    if (!initialSections || Object.keys(initialSections).length === 0) {
      if (req.body.templateId) {
        const tpl = await NoteTemplate.findById(req.body.templateId);
        if (tpl?.sectionsJSON) initialSections = tpl.sectionsJSON;
      }
    }
    if (!initialSections || Object.keys(initialSections).length === 0) {
      initialSections = { subjective: '', objective: '', assessment: '', plan: '' };
    }

    const note = new ConsultationNote({
      appointmentId,
      lifecycleId: req.body.lifecycleId || undefined,
      patientId: appt.patient,
      doctorId: appt.doctor,
      templateId,
      noteStatus: 'Draft',
      version: nextVersion,
      sectionsJSON: initialSections,
    });
    await note.save();

    // lifecycle event
    // Record lifecycle event if lifecycleId is provided
    if (req.body.lifecycleId) {
      await AppointmentLifecycleEvent.create({
        lifecycleId: req.body.lifecycleId,
        eventType: 'NoteDrafted',
        actorId: req.user._id,
        payload: { appointmentId, noteId: note._id, version: nextVersion }
      });
    }

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    console.log('Error upsertNote:', error);
    res.status(500).json({ success: false, message: 'Failed to save note', error: error.message });
  }
};

// PATCH /api/notes/:noteId
export const updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const updates = {};
    if (req.body.sectionsJSON) updates.sectionsJSON = req.body.sectionsJSON;
    if (req.body.templateId) updates.templateId = req.body.templateId;
    const note = await ConsultationNote.findByIdAndUpdate(noteId, updates, { new: true });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, data: note });
  } catch (error) {
    console.log('Error updateNote:', error);
    res.status(500).json({ success: false, message: 'Failed to update note', error: error.message });
  }
};

// POST /api/notes/:noteId/sign
export const signNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const note = await ConsultationNote.findById(noteId);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    // TODO: enforce MFA (placeholder)
    note.noteStatus = 'Signed';
    note.signedById = req.user._id;
    note.signedAt = new Date();
    await note.save();

    if (note.lifecycleId) {
      await AppointmentLifecycleEvent.create({
        lifecycleId: note.lifecycleId,
        eventType: 'NoteSigned',
        actorId: req.user._id,
        payload: { noteId }
      });
    }

    res.json({ success: true, data: note });
  } catch (error) {
    console.log('Error signNote:', error);
    res.status(500).json({ success: false, message: 'Failed to sign note', error: error.message });
  }
};

// Templates
export const listTemplates = async (_req, res) => {
  try {
    const list = await NoteTemplate.find({ isActive: true }).sort('name');
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch templates', error: error.message });
  }
};

export const upsertTemplate = async (req, res) => {
  try {
    const { name, specialty, sectionsJSON, isActive } = req.body;
    const tpl = await NoteTemplate.findOneAndUpdate(
      { name, specialty },
  { name, specialty, sectionsJSON, isActive, ...(req.user?._id ? { createdById: req.user._id } : {}) },
      { upsert: true, new: true }
    );
    res.status(201).json({ success: true, data: tpl });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to upsert template', error: error.message });
  }
};

// POST /api/observations (batch)
export const batchInsertObservations = async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : (req.body.items || []);
    if (!items.length) return res.status(400).json({ success: false, message: 'No observations provided' });
    const inserted = await Observation.insertMany(items.map(o => ({ ...o, recordedAt: o.recordedAt || new Date() })));
    res.status(201).json({ success: true, data: inserted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to insert observations', error: error.message });
  }
};
