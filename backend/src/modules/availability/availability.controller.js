import AvailabilityTemplate from './availability-template.model.js';
import AvailabilityException from './availability-exception.model.js';
import AppointmentSlot from '../appointment-slots/appointment-slot.model.js';
import { expandRules, applyExceptions, hmacSlot } from './availability.utils.js';
import DoctorAvailability from '../doctors/availability.model.js';
import mongoose from 'mongoose';

export async function getTemplate(req, res) {
  try {
    const doctorId = req.params.doctorId;
    let tpl = await AvailabilityTemplate.findOne({ doctor: doctorId, isActive: true });
    if (!tpl) {
      tpl = await AvailabilityTemplate.create({ doctor: doctorId, rulesJSON: { weekdays: {}, slotLengthMinutes: 30, bufferMinutes: 0 }, timeZone: 'UTC' });
    }
    res.json({ success: true, data: { id: tpl._id, version: tpl.version, rulesJSON: tpl.rulesJSON, timeZone: tpl.timeZone } });
  } catch (e) {
    res.status(500).json({ success:false, message:'Failed to fetch template', error: e.message });
  }
}

export async function previewTemplate(req, res) {
  try {
    const { rulesJson, from, to } = req.body;
    if (!rulesJson || !from || !to) return res.status(400).json({ success:false, message:'rulesJson, from, to required'});
    const doctorId = req.params.doctorId;
    const baseSlots = expandRules(rulesJson, from, to);
    const exceptions = await AvailabilityException.find({ doctor: doctorId, date: { $gte: new Date(from), $lte: new Date(to) } });
    const merged = applyExceptions(baseSlots, exceptions);
    // existing booked slots (AppointmentSlot where isAvailable false)
    const existing = await AppointmentSlot.find({ doctor: doctorId, date: { $gte: new Date(from), $lte: new Date(to) } });
    const conflicts = [];
    const existingMap = new Map();
    existing.forEach(s => existingMap.set(`${s.date.toDateString()}|${s.startTime}`, s));
    const generated = merged.map(s => {
      const key = `${s.date.toDateString()}|${s.startTime}`;
      if (existingMap.has(key) && !existingMap.get(key).isAvailable) {
        conflicts.push({ date: s.date, startTime: s.startTime });
      }
      return s;
    });
    res.json({ success:true, data:{ generated, conflicts, summary:{ generated: generated.length, conflicts: conflicts.length } } });
  // TODO: AuditService.log('AvailabilityTemplatePreview', { doctorId, generated: generated.length, conflicts: conflicts.length });
  } catch (e) {
    res.status(500).json({ success:false, message:'Preview failed', error: e.message });
  }
}

export async function publishTemplate(req, res) {
  let debugStage = 'init';
  try {
    let { rulesJson, baseVersion, from, to, regenerateMode } = req.body;
    debugStage = 'init';
    regenerateMode = regenerateMode || 'AppendMissing';
    if (!['AppendMissing','ReplaceUnbooked'].includes(regenerateMode)) {
      return res.status(400).json({ success:false, message:'Invalid regenerateMode' });
    }
    const doctorId = req.params.doctorId;
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success:false, message:'Invalid doctorId'});
    }
  if (!rulesJson) return res.status(400).json({ success:false, message:'rulesJson required'});
  if (!from || !to) return res.status(400).json({ success:false, message:'from & to required'});
  if (typeof baseVersion !== 'number') return res.status(400).json({ success:false, message:'baseVersion required'});
  if (!rulesJson.weekdays || typeof rulesJson.weekdays !== 'object') {
    // Auto-initialize if absent instead of hard failing; treats as empty availability.
    rulesJson.weekdays = {};
    // If client attempted to publish with no availability blocks, give a clearer message.
    if (Object.keys(rulesJson.weekdays).length === 0) {
      return res.status(400).json({ success:false, message:'No availability blocks defined. Add at least one day/time block before publishing.' });
    }
  }
  debugStage = 'findTemplate';
  const tpl = await AvailabilityTemplate.findOne({ doctor: doctorId, isActive: true });
    if (!tpl) return res.status(404).json({ success:false, message:'Template not found'});
    if (tpl.version !== baseVersion) {
      return res.status(409).json({ success:false, message:'Stale version', latest:{ version: tpl.version, rulesJSON: tpl.rulesJSON } });
    }
  debugStage = 'expandRules';
  const baseSlots = expandRules(rulesJson, from, to);
  debugStage = 'exceptionsQuery';
  const exceptions = await AvailabilityException.find({ doctor: doctorId, date: { $gte: new Date(from), $lte: new Date(to) } });
  debugStage = 'applyExceptions';
  const merged = applyExceptions(baseSlots, exceptions);
    const windowQuery = { doctor: doctorId, date: { $gte: new Date(from), $lte: new Date(to) } };
  debugStage = 'existingSlotsQuery';
  const existing = await AppointmentSlot.find(windowQuery);
    const existingMap = new Map();
    existing.forEach(s => existingMap.set(`${s.date.toDateString()}|${s.startTime}`, s));
    let added = 0, kept = 0, removed = 0;
    const newKeys = new Set(merged.map(s => `${s.date.toDateString()}|${s.startTime}`));
    // Delete unbooked not in new set if ReplaceUnbooked
  debugStage = 'removePhase';
    if (regenerateMode === 'ReplaceUnbooked') {
      for (const s of existing) {
        const key = `${s.date.toDateString()}|${s.startTime}`;
        if (!newKeys.has(key) && s.isAvailable) {
          await AppointmentSlot.deleteOne({ _id: s._id });
          removed++;
        }
      }
    }
    // Insert missing (AppendMissing or after removal phase for ReplaceUnbooked)
  debugStage = 'insertPhasePrep';
    const newDocs = [];
    for (const s of merged) {
      const key = `${s.date.toDateString()}|${s.startTime}`;
      if (!existingMap.has(key)) {
        const slotHash = hmacSlot(doctorId, s.date, s.startTime, s.endTime);
        newDocs.push({
          doctor: doctorId,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          slotType: 'Consult',
          sourceTemplateVersion: tpl.version + 1,
          slotHash,
          isAvailable: true
        });
      } else {
        kept++;
      }
    }
    debugStage = 'bulkInsert';
    if (newDocs.length) {
      try {
        await AppointmentSlot.insertMany(newDocs, { ordered: false });
        added = newDocs.length;
      } catch (bulkErr) {
        // Fallback: attempt per-slot to capture the exact failing document
        console.log('bulkInsert error, attempting per-slot fallback:', bulkErr.message);
        let successCount = 0, failCount = 0;
        for (const doc of newDocs) {
          try {
            await AppointmentSlot.create([doc]);
            successCount++;
          } catch (docErr) {
            failCount++;
            console.log('slotInsert fail', { date: doc.date, startTime: doc.startTime, msg: docErr.message });
          }
        }
        added = successCount;
        if (failCount > 0) {
          return res.status(500).json({ success:false, message:'Publish failed (slot insertion)', stage:'bulkInsertFallback', added: successCount, failed: failCount });
        }
      }
    }
  debugStage = 'saveTemplate';
    const updated = await AvailabilityTemplate.findOneAndUpdate(
      { _id: tpl._id, version: baseVersion },
      { $set: { rulesJSON: rulesJson, updatedAt: new Date() }, $inc: { version: 1 } },
      { new: true }
    );
    if (!updated) {
      return res.status(409).json({ success:false, message:'Stale version (post-insert)', stage:'saveTemplate' });
    }
  // --- Synchronize DoctorAvailability blocks with template weekdays ---
  try {
    const weekdayMap = { MON:'monday', TUE:'tuesday', WED:'wednesday', THU:'thursday', FRI:'friday', SAT:'saturday', SUN:'sunday' };
    const incoming = [];
    Object.entries(rulesJson.weekdays || {}).forEach(([code, blocks]) => {
      const day = weekdayMap[code] || code.toLowerCase();
      (blocks || []).forEach(b => {
        if (b.start && b.end) {
          incoming.push({ day, startTime: b.start, endTime: b.end });
        }
      });
    });
    // Fetch existing blocks for doctor
  const existing = await DoctorAvailability.find({ doctor: doctorId }).select('_id day startTime');
    // Upsert incoming blocks
    for (const block of incoming) {
      await DoctorAvailability.findOneAndUpdate(
        { doctor: doctorId, day: block.day, startTime: block.startTime },
        { doctor: doctorId, day: block.day, startTime: block.startTime, endTime: block.endTime, slotDuration: rulesJson.slotLengthMinutes || 30, isActive: true },
        { upsert: true, new: true }
      );
    }
    // Optionally remove obsolete blocks (those not in incoming) to keep table in sync
    const desiredKeys = new Set(incoming.map(b => `${b.day}|${b.startTime}`));
    for (const e of existing) {
      const key = `${e.day}|${e.startTime}`;
      if (!desiredKeys.has(key)) {
        await DoctorAvailability.deleteOne({ _id: e._id });
      }
    }
  } catch (syncErr) {
    console.log('[publishTemplate] availability sync warning:', syncErr.message);
  }
  // TODO: AuditService.log('AvailabilityTemplatePublish', { doctorId, added, kept, removed, mode: regenerateMode, version: tpl.version });
  // TODO: Metrics.increment('availability_slots_generated_total', added);
  // TODO: Metrics.increment('availability_slots_removed_total', removed);
  console.log('[publishTemplate] doctor', doctorId, 'window', from, '->', to, 'mode', regenerateMode, 'added', added, 'kept', kept, 'removed', removed, 'version', updated.version);
  res.json({ success:true, data:{ added, kept, removed, newVersion: updated.version, mode: regenerateMode } });
  } catch (e) {
    const errResp = { success:false, message:'Publish failed', error: e.message, stage: debugStage, errorType: e.name };
    if (process.env.NODE_ENV !== 'production') {
      errResp.stack = (e.stack || '').split('\n').slice(0,4).join('\n');
    }
    console.log('publishTemplate error stage=', debugStage, 'type=', e.name, 'msg=', e.message);
    res.status(500).json(errResp);
  }
}

export async function listExceptions(req, res) {
  try {
    const { from, to } = req.query;
    const doctorId = req.params.doctorId;
    const q = { doctor: doctorId };
    if (from && to) q.date = { $gte: new Date(from), $lte: new Date(to) };
    const items = await AvailabilityException.find(q).sort({ date: 1 });
    res.json({ success:true, data: items });
  } catch (e) { res.status(500).json({ success:false, message:'List exceptions failed', error: e.message }); }
}

export async function createException(req, res) {
  try {
    const doctorId = req.params.doctorId;
    const { date, type, payloadJson } = req.body;
    if (!date || !type || !payloadJson) return res.status(400).json({ success:false, message:'date, type, payloadJson required'});
    const item = await AvailabilityException.create({ doctor: doctorId, date, type, payloadJSON: payloadJson });
    res.status(201).json({ success:true, data: item });
  } catch (e) { res.status(500).json({ success:false, message:'Create exception failed', error: e.message }); }
}

export async function deleteException(req, res) {
  try {
    const doctorId = req.params.doctorId;
    const { exceptionId } = req.params;
    await AvailabilityException.deleteOne({ _id: exceptionId, doctor: doctorId });
    res.json({ success:true, message:'Deleted' });
  } catch (e) { res.status(500).json({ success:false, message:'Delete exception failed', error: e.message }); }
}
