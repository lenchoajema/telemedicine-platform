import LabOrder from './lab-order.model.js';
import MedicalRecord from '../patients/medical-record.model.js';

// Create a new lab order (doctors only)
export const createLabOrder = async (req, res) => {
  try {
    const { recordId, labTests } = req.body;
    const doctorId = req.user._id;

    // Validate medical record exists
    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    const labOrder = new LabOrder({
      record: recordId,
      labTests,
      orderedBy: doctorId
    });

    const saved = await labOrder.save();

    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.log('Error creating lab order:', error);
    res.status(500).json({ success: false, message: 'Failed to create lab order', error: error.message });
  }
};

// Get lab orders (doctors see their orders, labs see pending, patients see theirs)
export const getLabOrders = async (req, res) => {
  try {
    const { role, _id } = req.user;
    let query = {};

    if (role === 'doctor') {
      query.orderedBy = _id;
    } else if (role === 'patient') {
      // patient sees orders for their records
      const records = await MedicalRecord.find({ patient: _id }).select('_id');
      query.record = { $in: records.map(r => r._id) };
    }
    // admins and lab roles see all

    const orders = await LabOrder.find(query)
      .populate('record')
      .populate('orderedBy', 'profile.firstName profile.lastName');

    res.json({ success: true, data: orders });
  } catch (error) {
    console.log('Error fetching lab orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lab orders', error: error.message });
  }
};

// Get a single lab order by ID
export const getLabOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await LabOrder.findById(id)
      .populate('record')
      .populate('orderedBy', 'profile.firstName profile.lastName');
    if (!order) return res.status(404).json({ success: false, message: 'Lab order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    console.log('Error fetching lab order:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lab order', error: error.message });
  }
};

// Update lab order status (lab role only)
export const updateLabOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'completed', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const updated = await LabOrder.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.log('Error updating lab order:', error);
    res.status(500).json({ success: false, message: 'Failed to update lab order', error: error.message });
  }
};
