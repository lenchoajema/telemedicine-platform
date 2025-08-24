import crypto from 'crypto';

export function expandRules(rulesJSON, from, to) {
  const slots = [];
  if (!rulesJSON?.weekdays) return slots;
  const slotLen = rulesJSON.slotLengthMinutes || 30;
  const buffer = rulesJSON.bufferMinutes || 0;
  const breaks = (rulesJSON.breaks || []).map(b => ({ ...b }));
  const startDate = new Date(from); const endDate = new Date(to);
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const weekdayMap = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const wd = weekdayMap[d.getDay()];
    const dayBlocks = rulesJSON.weekdays[wd] || [];
    for (const block of dayBlocks) {
      const [bh, bm] = block.start.split(':').map(Number);
      const [eh, em] = block.end.split(':').map(Number);
      let cursor = bh * 60 + bm;
      const endMinutes = eh * 60 + em;
      while (cursor + slotLen <= endMinutes) {
        const startMinutes = cursor;
        const endSlot = startMinutes + slotLen;
        const startTime = `${String(Math.floor(startMinutes/60)).padStart(2,'0')}:${String(startMinutes%60).padStart(2,'0')}`;
        const endTime = `${String(Math.floor(endSlot/60)).padStart(2,'0')}:${String(endSlot%60).padStart(2,'0')}`;
        const breakHit = breaks.some(br => br.weekday === wd && !(endTime <= br.start || startTime >= br.end));
        if (!breakHit) {
          slots.push({ date: new Date(d), startTime, endTime });
        }
        cursor = endSlot + buffer;
      }
    }
  }
  return slots;
}

export function applyExceptions(slots, exceptions) {
  if (!exceptions.length) return slots;
  let out = [...slots];
  for (const ex of exceptions) {
    const exDateStr = new Date(ex.date).toDateString();
    if (ex.type === 'Blackout') {
      out = out.filter(s => s.date.toDateString() !== exDateStr);
      continue;
    }
    if (ex.type === 'AddSlot') {
      (ex.payloadJSON?.slots || []).forEach(s => out.push({ date: new Date(ex.date), startTime: s.startTime, endTime: s.endTime, added: true }));
      continue;
    }
    if (ex.type === 'Modify') {
      const mods = ex.payloadJSON?.slots || [];
      for (const m of mods) {
        out = out.filter(s => !(s.date.toDateString() === exDateStr && s.startTime === m.originalStart));
        out.push({ date: new Date(ex.date), startTime: m.startTime, endTime: m.endTime, modified: true });
      }
    }
  }
  return out;
}

export function hmacSlot(doctorId, date, startTime, endTime) {
  const secret = process.env.SLOT_HMAC_SECRET || 'slot-dev-secret';
  const payload = `${doctorId}|${new Date(date).toISOString().slice(0,10)}|${startTime}|${endTime}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}
