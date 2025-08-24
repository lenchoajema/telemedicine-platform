#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AvailabilityTemplate from '../src/modules/availability/availability-template.model.js';
import AppointmentSlot from '../src/modules/appointment-slots/appointment-slot.model.js';
import connectDB from '../src/modules/shared/db.js';
import crypto from 'crypto';

dotenv.config();

function expandRules(rulesJSON, from, to) {
  const out = [];
  if (!rulesJSON?.weekdays) return out;
  const start = new Date(from); const end = new Date(to);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
    const map = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const wd = map[d.getDay()];
    (rulesJSON.weekdays[wd]||[]).forEach(block => {
      const [sh, sm] = block.start.split(':').map(Number);
      const [eh, em] = block.end.split(':').map(Number);
      const slotLen = rulesJSON.slotLengthMinutes || 30;
      for (let m = sh*60+sm; m+slotLen <= eh*60+em; m += slotLen + (rulesJSON.bufferMinutes||0)) {
        const startMinutes = m; const endMinutes = m+slotLen;
        const st = `${String(Math.floor(startMinutes/60)).padStart(2,'0')}:${String(startMinutes%60).padStart(2,'0')}`;
        const et = `${String(Math.floor(endMinutes/60)).padStart(2,'0')}:${String(endMinutes%60).padStart(2,'0')}`;
        out.push({ date: new Date(d), startTime: st, endTime: et });
      }
    });
  }
  return out;
}

function hmacSlot(doctorId, date, startTime, endTime) {
  const secret = process.env.SLOT_HMAC_SECRET || 'slot-dev-secret';
  const payload = `${doctorId}|${new Date(date).toISOString().slice(0,10)}|${startTime}|${endTime}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

(async () => {
  await connectDB();
  const horizonDays = parseInt(process.env.AVAILABILITY_REGEN_DAYS || '30', 10);
  const from = new Date().toISOString().slice(0,10);
  const to = new Date(Date.now()+horizonDays*86400000).toISOString().slice(0,10);
  const templates = await AvailabilityTemplate.find({ isActive: true });
  let totalAdded = 0;
  for (const tpl of templates) {
    const baseSlots = expandRules(tpl.rulesJSON, from, to);
  // (Exception application could be added here if needed)
    const existing = await AppointmentSlot.find({ doctor: tpl.doctor, date: { $gte: new Date(from), $lte: new Date(to) } });
    const existingKey = new Set(existing.map(s => `${s.date.toDateString()}|${s.startTime}`));
    for (const s of baseSlots) {
      const k = `${s.date.toDateString()}|${s.startTime}`;
      if (!existingKey.has(k)) {
        await AppointmentSlot.create({ doctor: tpl.doctor, date: s.date, startTime: s.startTime, endTime: s.endTime, sourceTemplateVersion: tpl.version, slotHash: hmacSlot(tpl.doctor, s.date, s.startTime, s.endTime) });
        totalAdded++;
      }
    }
  }
  console.log(JSON.stringify({ success:true, horizonDays, totalAdded }));
  await mongoose.connection.close();
  process.exit(0);
})().catch(e => { console.log('regenerate-availability failed', e?.message || e); process.exit(1); });
