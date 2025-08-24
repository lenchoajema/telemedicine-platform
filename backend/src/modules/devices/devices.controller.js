import DeviceIntegration from './device-integration.model.js';
import DeviceVital from './device-vital.model.js';
import mongoose from 'mongoose';

// Simple audit helper (extend later)
function audit(userId, action, meta){
  try { console.log('[DEVICE-AUDIT]', userId.toString(), action, meta||{}); } catch { /* no-op */ }
}

// POST /api/devices/connect
// This is a placeholder. A real OAuth flow is complex and provider-specific.
export const connectDevice = async (req, res) => {
  const { provider, scopes } = req.body;
  const userId = req.user._id; // Assuming user is authenticated

  // In a real scenario, you would redirect the user to the provider's OAuth screen.
  // After user consent, the provider would redirect back with a code.
  // You'd exchange the code for tokens and then create the integration.

  try {
    // Simulate successful connection for now
    const integration = await DeviceIntegration.create({
      user: userId,
      provider,
      scopes,
      accessToken: 'dummy-access-token', // These would be real, encrypted tokens
      refreshToken: 'dummy-refresh-token',
      status: 'Active',
    });
    res.status(201).json({ success: true, message: `Successfully connected to ${provider}.`, data: integration });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to connect device.', error: error.message });
  }
};

// GET /api/devices/status
export const getStatus = async (req, res) => {
  const userId = req.user._id;
  try {
    const integrations = await DeviceIntegration.find({ user: userId }).select('-accessToken -refreshToken');
    res.json({ success: true, data: integrations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get device statuses.', error: error.message });
  }
};

// POST /api/devices/sync
// Placeholder for a manual sync trigger. Real sync would be a background job.
export const syncData = async (req, res) => {
    const { integrationId } = req.body;
    const integration = await DeviceIntegration.findById(integrationId);
    
    if (!integration || integration.user.toString() !== req.user._id.toString()) {
        return res.status(404).json({ success: false, message: 'Integration not found.' });
    }

    // Simulate fetching data from a provider API and creating vitals
    try {
        const now = new Date();
        const samples = [
          { vitalType:'HeartRate', value: Math.floor(Math.random()*30)+60, unit:'bpm' },
          { vitalType:'Steps', value: Math.floor(Math.random()*5000)+2000, unit:'count' },
          { vitalType:'Sleep', value: { durationHours: +(Math.random()*3+5).toFixed(1) }, unit:'hours' }
        ];
        for (const s of samples){
          const recordedAt = new Date(now.getTime() - Math.floor(Math.random()*3600*1000));
          await DeviceVital.updateOne(
            { user: req.user._id, vitalType: s.vitalType, recordedAt },
            { $set:{ source: integration.provider, value: s.value, unit: s.unit, syncedAt: now } },
            { upsert:true }
          );
        }
 
         integration.lastSyncAt = new Date();
         await integration.save();
         audit(req.user._id,'DeviceSync',{ integrationId: integration._id, provider: integration.provider, samples: samples.length });
 
         res.json({ success: true, message: 'Sync completed.' });
     } catch (error) {
         res.status(500).json({ success: false, message: 'Sync failed.', error: error.message });
     }
};


// GET /api/devices/vitals
export const getVitals = async (req, res) => {
  const userId = req.user._id;
  const { type, from, to, page='1', limit='50' } = req.query;
  const filter = { user: userId };
  if (type) filter.vitalType = type;
  if (from || to){
    filter.recordedAt = {};
    if (from) filter.recordedAt.$gte = new Date(from);
    if (to) filter.recordedAt.$lte = new Date(to);
  }
  const pageNum = Math.max(parseInt(page,10)||1,1);
  const lim = Math.min(Math.max(parseInt(limit,10)||50,1),200);
  const skip = (pageNum-1)*lim;
  try {
    const [items,total] = await Promise.all([
      DeviceVital.find(filter).sort({ recordedAt:-1 }).skip(skip).limit(lim),
      DeviceVital.countDocuments(filter)
    ]);
    audit(userId,'VitalsQuery',{ type, from, to, count: items.length });
    res.json({ success:true, data:{ items, pagination:{ page: pageNum, pages: Math.ceil(total/lim), total } } });
  } catch (error) {
    res.status(500).json({ success:false, message:'Failed to get vitals.', error: error.message });
  }
};

// DELETE /api/devices/disconnect
export const disconnectDevice = async (req, res) => {
  try {
    // Accept id from body, query, or params for flexibility
    const integrationId = req.body?.integrationId || req.query?.integrationId || req.params?.integrationId;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    if (!integrationId || !mongoose.Types.ObjectId.isValid(integrationId)) {
      return res.status(400).json({ success: false, message: 'Invalid integrationId.' });
    }

    const integration = await DeviceIntegration.findOne({ _id: integrationId, user: req.user._id });
    if (!integration) {
      return res.status(404).json({ success: false, message: 'Integration not found.' });
    }

    integration.status = 'Revoked';
    integration.accessToken = null;
    integration.refreshToken = null;
    await integration.save();

    audit(req.user._id, 'DeviceDisconnect', { integrationId, provider: integration.provider });
    res.json({ success: true, message: 'Device disconnected successfully.' });
  } catch (error) {
  try { console.log('[DeviceDisconnect][Error]', { user: req.user?._id?.toString?.(), integrationId: req.body?.integrationId || req.query?.integrationId || req.params?.integrationId, err: error?.message }); } catch { /* no-op */ }
  res.status(500).json({ success: false, message: 'Failed to disconnect device.', error: error.message });
  }
};
