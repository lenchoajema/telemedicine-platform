import express from 'express';
import Pharmacy from '../modules/erx/pharmacy.model.js';
import PharmacyInventory from '../modules/erx/pharmacy-inventory.model.js';
import Laboratory from '../modules/labs/laboratory.model.js';
import LabTestCatalog from '../modules/labs/lab-test-catalog.model.js';

const router = express.Router();

// GET /api/pharmacies?near=&query=&drugId=&page=
router.get('/pharmacies', async (req, res) => {
  try {
    const { near, query, page, drugId } = req.query;
    const filter = { isActive: true, verificationStatus: 'Verified' };
    if (query) filter.name = new RegExp(query, 'i');
    // If drugId filter requested, fetch pharmacies that have it
    if (drugId) {
      const invRows = await PharmacyInventory.find({ drugId, visibility: 'Public' }, 'pharmacyId');
      const ids = invRows.map(r => r.pharmacyId);
      filter._id = { $in: ids };
    }
  let cursor = Pharmacy.find(filter).sort({ name: 1 });
    if (near) {
      const [lat, lng] = near.split(',').map(Number);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        cursor = Pharmacy.find({ ...filter, geoJSON: { $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: 20000 } } });
      }
    }
    const pageNum = Math.max(parseInt(page || '1', 10), 1);
    const pageSize = 20;
    const [items, total] = await Promise.all([
      cursor.skip((pageNum - 1) * pageSize).limit(pageSize),
      Pharmacy.countDocuments(filter)
    ]);
    res.json({ success: true, data: items, page: pageNum, pageSize, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to list pharmacies', error: error.message });
  }
});

// GET /api/pharmacies/:id/inventory?drugId=
router.get('/pharmacies/:id/inventory', async (req, res) => {
  try {
    const { id } = req.params;
    const { drugId } = req.query;
    const filter = { pharmacyId: id, visibility: 'Public' };
    if (drugId) filter.drugId = drugId;
    const items = await PharmacyInventory.find(filter).limit(100);
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to list inventory', error: error.message });
  }
});

// GET /api/labs?near=&query=&testCode=&page=
router.get('/labs', async (req, res) => {
  try {
    const { near, query, page, testCode } = req.query;
    const filter = { isActive: true, verificationStatus: 'Verified' };
    if (query) filter.name = new RegExp(query, 'i');
    if (testCode) {
      const catRows = await LabTestCatalog.find({ testCode, isActive: true }, 'labId');
      const ids = catRows.map(r => r.labId);
      filter._id = { $in: ids };
    }
  let cursor = Laboratory.find(filter).sort({ name: 1 });
    if (near) {
      const [lat, lng] = near.split(',').map(Number);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        cursor = Laboratory.find({ ...filter, geoJSON: { $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: 20000 } } });
      }
    }
    const pageNum = Math.max(parseInt(page || '1', 10), 1);
    const pageSize = 20;
    const [items, total] = await Promise.all([
      cursor.skip((pageNum - 1) * pageSize).limit(pageSize),
      Laboratory.countDocuments(filter)
    ]);
    res.json({ success: true, data: items, page: pageNum, pageSize, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to list labs', error: error.message });
  }
});

// GET /api/labs/:id/tests?activeOnly=true
router.get('/labs/:id/tests', async (req, res) => {
  try {
    const { id } = req.params;
    const activeOnly = String(req.query.activeOnly || 'true') === 'true';
    const filter = { labId: id };
    if (activeOnly) filter.isActive = true;
    const items = await LabTestCatalog.find(filter).limit(200);
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to list lab tests', error: error.message });
  }
});

export default router;
