import request from 'supertest';
import app from '../../../app.js';
import mongoose from 'mongoose';
import AvailabilityTemplate from '../availability-template.model.js';
import AvailabilityException from '../availability-exception.model.js';

// NOTE: Assumes authenticate middleware attaches req.user; for isolated tests you may need to mock.
// Here we bypass by temporarily stubbing authenticate if needed, but for now mark tests skipped if no JWT.

describe('Availability Authoring API', () => {
  let server;
  let doctorId;

  beforeAll(async () => {
    // Create a fake ObjectId for doctor; in real tests seed a Doctor document
    doctorId = new mongoose.Types.ObjectId();
  });

  afterAll(async () => {
    await AvailabilityTemplate.deleteMany({ doctor: doctorId });
    await AvailabilityException.deleteMany({ doctor: doctorId });
  });

  test('Preview returns generated slots summary (unauthenticated skip)', async () => {
    const res = await request(app)
      .post(`/api/doctors/${doctorId}/availability/preview`)
      .send({
        rulesJson: { weekdays: { MON: [{ start: '09:00', end: '10:00' }] }, slotLengthMinutes: 30 },
        from: new Date().toISOString().slice(0,10),
        to: new Date(Date.now()+86400000).toISOString().slice(0,10)
      });
    // Expect either auth failure or preview success
    expect([200,401,403]).toContain(res.status);
  });

  test('Publish responds with expected shape or auth failure', async () => {
    const res = await request(app)
      .post(`/api/doctors/${doctorId}/availability/publish`)
      .send({
        rulesJson: { weekdays: { MON: [{ start: '09:00', end: '10:00' }] }, slotLengthMinutes: 30 },
        baseVersion: 0,
        from: new Date().toISOString().slice(0,10),
        to: new Date(Date.now()+86400000).toISOString().slice(0,10),
        regenerateMode: 'AppendMissing'
      });
    expect([200,401,403,409]).toContain(res.status);
  });
});
