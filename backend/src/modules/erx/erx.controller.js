import Prescription from '../patients/prescriptions.model.js';
import ErxTransaction from './erx-transaction.model.js';
import Pharmacy from './pharmacy.model.js';
import FormularyDrug from './formulary.model.js';
import AppointmentLifecycleEvent from '../appointments/appointment-lifecycle-event.model.js';

export const createPrescription = async (req, res) => {
  try {
    const body = req.body;
    const docId = req.user._id;
    const rx = await Prescription.create({
      patient: body.patientId,
      doctor: docId,
      drugId: body.drugId,
      route: body.route,
      frequency: body.frequency,
      quantity: body.quantity,
      daysSupply: body.daysSupply,
      refills: body.refills,
      startDate: body.startDate,
      endDate: body.endDate,
      substitutionAllowed: body.substitutionAllowed !== false,
      pharmacyId: body.pharmacyId,
      lifecycleId: body.lifecycleId,
      transmissionStatus: 'Draft'
    });
    // Lifecycle: MedicationPrescribed
    try {
      if (body.lifecycleId) {
        await AppointmentLifecycleEvent.create({
          lifecycleId: body.lifecycleId,
          eventType: 'MedicationPrescribed',
          actorId: docId,
          payload: { prescriptionId: rx._id }
        });
      }
    } catch (e) { console.log('Warn lifecycle MedicationPrescribed:', e?.message || e); }
    res.status(201).json({ success: true, data: rx });
  } catch (error) {
    console.log('Error createPrescription:', error);
    res.status(500).json({ success: false, message: 'Failed to create Rx', error: error.message });
  }
};

export const sendPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const rx = await Prescription.findById(id);
    if (!rx) return res.status(404).json({ success: false, message: 'Rx not found' });

    // Queue transaction (stub dispatcher)
    const txn = await ErxTransaction.create({
      prescriptionId: rx._id,
      type: 'New',
      status: 'Queued',
      requestPayload: { rxId: rx._id },
    });

    rx.transmissionStatus = 'Queued';
    await rx.save();

    await AppointmentLifecycleEvent.create({
      lifecycleId: rx.lifecycleId || '',
      eventType: 'RxQueued',
      actorId: req.user._id,
      payload: { rxId: rx._id, txnId: txn._id }
    });

    res.json({ success: true, data: { rx, txn } });
  } catch (error) {
    console.log('Error sendPrescription:', error);
    res.status(500).json({ success: false, message: 'Failed to send Rx', error: error.message });
  }
};

export const cancelPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const rx = await Prescription.findById(id);
    if (!rx) return res.status(404).json({ success: false, message: 'Rx not found' });

    rx.transmissionStatus = 'Cancelled';
    rx.cancelReason = reason || 'unspecified';
    await rx.save();

    await ErxTransaction.create({
      prescriptionId: rx._id,
      type: 'Cancel',
      status: 'Queued',
      requestPayload: { reason },
    });

    await AppointmentLifecycleEvent.create({
      lifecycleId: rx.lifecycleId || '',
      eventType: 'RxCancelled',
      actorId: req.user._id,
      payload: { rxId: rx._id, reason }
    });

    res.json({ success: true, data: rx });
  } catch (error) {
    console.log('Error cancelPrescription:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel Rx', error: error.message });
  }
};

export const refillPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const rx = await Prescription.findById(id);
    if (!rx) return res.status(404).json({ success: false, message: 'Rx not found' });

    const txn = await ErxTransaction.create({
      prescriptionId: rx._id,
      type: 'Refill',
      status: 'Queued',
    });

    await AppointmentLifecycleEvent.create({
      lifecycleId: rx.lifecycleId || '',
      eventType: 'RxRefillQueued',
      actorId: req.user._id,
      payload: { rxId: rx._id, txnId: txn._id }
    });

    res.json({ success: true, data: txn });
  } catch (error) {
    console.log('Error refillPrescription:', error);
    res.status(500).json({ success: false, message: 'Failed to queue refill', error: error.message });
  }
};

export const listPharmacies = async (req, res) => {
  try {
    const { query } = req.query;
    const q = query ? { name: new RegExp(query, 'i') } : {};
    const list = await Pharmacy.find(q).limit(20);
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch pharmacies', error: error.message });
  }
};

export const listPrescriptions = async (req, res) => {
  try {
    const { appointmentId } = req.query;
    const q = appointmentId ? { appointmentId } : { patient: req.user._id };
    const list = await Prescription.find(q).sort('-createdAt');
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch prescriptions', error: error.message });
  }
};

export const searchFormulary = async (req, res) => {
  try {
    const { query } = req.query;
    const list = await FormularyDrug.find({ $text: { $search: query || '' } }).limit(20);
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to search formulary', error: error.message });
  }
};
