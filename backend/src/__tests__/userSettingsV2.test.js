/**
 * Integration tests for User Settings V2 aggregated + slice endpoints.
 * Covers: registration -> aggregated GET -> slice optimistic PUT (success + conflict) -> 2FA + password change.
 */
const request = require('supertest');
let app;
let UserProfile, MedicalProfile, NotificationPreferences, PrivacySettings, SecuritySettings, Insurance, FamilyGroup, UserSettings;

async function registerAndLogin(email='test@example.com') {
  const reg = await request(app).post('/api/auth/register').send({
    email,
    password: 'Password123!',
    profile: { firstName: 'Test', lastName: 'User', phone: '+15550001111', gender: 'Male' }
  });
  expect(reg.status).toBe(201);
  const token = reg.body?.data?.token || reg.body?.data?.user?.token || reg.body?.token;
  return { token, user: reg.body.data.user };
}

describe('User Settings V2', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    if (!app) {
      const appMod = await import('../app.js');
      app = appMod.default;
      const [up, mp, np, pr, ss, ins, fam, us] = await Promise.all([
        import('../models/UserProfile.js'),
        import('../models/MedicalProfile.js'),
        import('../models/NotificationPreferences.js'),
        import('../models/PrivacySettings.js'),
        import('../models/SecuritySettings.js'),
        import('../models/Insurance.js'),
        import('../models/FamilyGroup.js'),
        import('../models/UserSettings.js'),
      ]);
      UserProfile = up.default; MedicalProfile = mp.default; NotificationPreferences = np.default; PrivacySettings = pr.default; SecuritySettings = ss.default; Insurance = ins.default; FamilyGroup = fam.default; UserSettings = us.default;
    }
  });
  afterEach(async () => {
    await Promise.all([
      UserProfile.deleteMany({}),
      MedicalProfile.deleteMany({}),
      NotificationPreferences.deleteMany({}),
      PrivacySettings.deleteMany({}),
      SecuritySettings.deleteMany({}),
  Insurance.deleteMany({}),
  FamilyGroup.deleteMany({}),
  UserSettings.deleteMany({}),
    ]);
  });

  test('Aggregated settings auto-create singleton docs & expose versions', async () => {
    const { token, user } = await registerAndLogin();
    const res = await request(app)
      .get(`/api/users/${user._id}/settings`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const body = res.body;
    expect(body.profile).toBeDefined();
    expect(body.profile.firstName).toBe('Test');
    expect(body.medical).toBeDefined();
    expect(body.notifications).toBeDefined();
    expect(body.privacy).toBeDefined();
    expect(body.securityMeta).toBeDefined();
    expect(typeof body.compositeVersion).toBe('string');
  });

  test('Profile optimistic update increments version & conflict detection works', async () => {
    const { token, user } = await registerAndLogin('conflict@example.com');
    const first = await request(app).get(`/api/users/${user._id}/settings`).set('Authorization', `Bearer ${token}`);
    const v = first.body.profile.version;

    // Successful update with correct version
    const upd = await request(app)
      .put(`/api/users/${user._id}/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({ version: v, firstName: 'Changed' });
    expect(upd.status).toBe(200);
    expect(upd.body.profile.firstName).toBe('Changed');
    expect(upd.body.profile.version).toBe(v + 1);

    // Conflict when using stale version
    const conflict = await request(app)
      .put(`/api/users/${user._id}/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({ version: v, lastName: 'Late' });
    expect(conflict.status).toBe(409);
    expect(conflict.body.error).toMatch(/Version conflict/i);
    expect(conflict.body.latest).toBeDefined();
  });

  test('Medical + notifications + privacy updates apply & version bump', async () => {
    const { token, user } = await registerAndLogin('multi@example.com');
    const agg = await request(app).get(`/api/users/${user._id}/settings`).set('Authorization', `Bearer ${token}`);
    const { medical, notifications, privacy } = agg.body;

    const medUpd = await request(app)
      .put(`/api/users/${user._id}/medical`)
      .set('Authorization', `Bearer ${token}`)
      .send({ version: medical.version, bloodType: 'O+', allergies: ['Peanuts'], currentMedications: ['Med1'], medicalConditions: ['Cond1'] });
    expect(medUpd.status).toBe(200);
    expect(medUpd.body.medical.bloodType).toBe('O+');
    expect(medUpd.body.medical.version).toBe(medical.version + 1);

    const notifUpd = await request(app)
      .put(`/api/users/${user._id}/notifications`)
      .set('Authorization', `Bearer ${token}`)
      .send({ version: notifications.version, appointmentReminders: true, emailGeneral: true, smsGeneral: false, medicationReminders: true, healthContent: true, marketing: false });
    expect(notifUpd.status).toBe(200);
    expect(notifUpd.body.notifications.version).toBe(notifications.version + 1);

    const privUpd = await request(app)
      .put(`/api/users/${user._id}/privacy`)
      .set('Authorization', `Bearer ${token}`)
      .send({ version: privacy.version, shareWithProviders: true, shareAnonymizedResearch: false, shareWithInsurance: true, publicProfileVisible: false });
    expect(privUpd.status).toBe(200);
    expect(privUpd.body.privacy.version).toBe(privacy.version + 1);
  });

  test('Security password change + 2FA toggle', async () => {
    const { token, user } = await registerAndLogin('security@example.com');
    // Change password
    const passRes = await request(app)
      .put(`/api/users/${user._id}/security/password`)
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Password123!', newPassword: 'NewPass456!' });
    expect(passRes.status).toBe(200);

    // Enable 2FA
    const twofaEnable = await request(app)
      .put(`/api/users/${user._id}/security/2fa`)
      .set('Authorization', `Bearer ${token}`)
      .send({ enable: true, type: 'App' });
    expect(twofaEnable.status).toBe(200);
    expect(twofaEnable.body.security.twoFactorEnabled).toBe(true);

    // Disable 2FA
    const twofaDisable = await request(app)
      .put(`/api/users/${user._id}/security/2fa`)
      .set('Authorization', `Bearer ${token}`)
      .send({ enable: false });
    expect(twofaDisable.status).toBe(200);
    expect(twofaDisable.body.security.twoFactorEnabled).toBe(false);
  });

  test('Insurance CRUD + primary uniqueness + aggregated inclusion', async () => {
    const { token, user } = await registerAndLogin('ins1@example.com');
    // Create first (primary) policy
    const p1 = await request(app)
      .post('/api/insurance')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'ProviderA', planName: 'Gold', memberId: 'M1', isPrimary: true });
    expect(p1.status).toBe(201);
    expect(p1.body.item.isPrimary).toBe(true);
    // Create second also marked primary -> should demote first
    const p2 = await request(app)
      .post('/api/insurance')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'ProviderB', planName: 'Silver', memberId: 'M2', isPrimary: true });
    expect(p2.status).toBe(201);
    expect(p2.body.item.isPrimary).toBe(true);
    // Fetch list ensure only second is primary
    const list = await request(app).get('/api/insurance').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    const items = list.body.items;
    expect(items.length).toBe(2);
    const primaries = items.filter(i => i.isPrimary);
    expect(primaries.length).toBe(1);
    expect(String(primaries[0]._id)).toBe(String(p2.body.item._id));
    // Switch primary back to first via endpoint
    const setPrimary = await request(app)
      .post(`/api/insurance/${p1.body.item._id}/primary`)
      .set('Authorization', `Bearer ${token}`);
    expect(setPrimary.status).toBe(200);
    expect(setPrimary.body.insurance.isPrimary).toBe(true);
    const list2 = await request(app).get('/api/insurance').set('Authorization', `Bearer ${token}`);
    const primaries2 = list2.body.items.filter(i => i.isPrimary);
    expect(primaries2.length).toBe(1);
    expect(String(primaries2[0]._id)).toBe(String(p1.body.item._id));
    // Aggregated settings includes insurance array with primary first
    const agg = await request(app).get(`/api/users/${user._id}/settings`).set('Authorization', `Bearer ${token}`);
    expect(agg.status).toBe(200);
    expect(Array.isArray(agg.body.insurance)).toBe(true);
    expect(agg.body.insurance[0].isPrimary).toBe(true);
  });

  test('Composite version changes after slice updates', async () => {
    const { token, user } = await registerAndLogin('compver@example.com');
    const agg1 = await request(app).get(`/api/users/${user._id}/settings`).set('Authorization', `Bearer ${token}`);
    const cv1 = agg1.body.compositeVersion;
    const profV = agg1.body.profile.version;
    // Update profile
    const upd = await request(app)
      .put(`/api/users/${user._id}/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({ version: profV, firstName: 'Comp' });
    expect(upd.status).toBe(200);
    const agg2 = await request(app).get(`/api/users/${user._id}/settings`).set('Authorization', `Bearer ${token}`);
    const cv2 = agg2.body.compositeVersion;
    expect(cv2).not.toBe(cv1);
    // Update medical slice
    const medV = agg2.body.medical.version;
    const medUpd = await request(app)
      .put(`/api/users/${user._id}/medical`)
      .set('Authorization', `Bearer ${token}`)
      .send({ version: medV, bloodType: 'A+' });
    expect(medUpd.status).toBe(200);
    const agg3 = await request(app).get(`/api/users/${user._id}/settings`).set('Authorization', `Bearer ${token}`);
    const cv3 = agg3.body.compositeVersion;
    expect(cv3).not.toBe(cv2);
  });

  test('Family group creation, add member by email, acting-as set & clear reflected in aggregated settings', async () => {
    const { token, user } = await registerAndLogin('head@example.com');
    const member = await registerAndLogin('member@example.com');
    // Create family group (idempotent)
    const createGroup = await request(app).post('/api/family/groups').set('Authorization', `Bearer ${token}`);
    expect(createGroup.status).toBe(201);
    // Add member by email
    const add = await request(app)
      .post('/api/family/members/by-email')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'member@example.com', role: 'adult' });
    expect(add.status).toBe(201);
    expect(add.body.members.length).toBe(2);
    // Set acting-as to member
    const acting = await request(app)
      .patch('/api/family/acting-as')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: member.user._id });
    expect(acting.status).toBe(200);
    expect(String(acting.body.actingAsUserId)).toBe(String(member.user._id));
    // Aggregated settings should show actingAsUserId
    const agg = await request(app).get(`/api/users/${user._id}/settings`).set('Authorization', `Bearer ${token}`);
    expect(agg.status).toBe(200);
    expect(String(agg.body.family.actingAsUserId)).toBe(String(member.user._id));
    // Clear acting-as
    const clear = await request(app)
      .patch('/api/family/acting-as')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: null });
    expect(clear.status).toBe(200);
    expect(clear.body.actingAsUserId).toBe(null);
    const agg2 = await request(app).get(`/api/users/${user._id}/settings`).set('Authorization', `Bearer ${token}`);
    expect(agg2.body.family.actingAsUserId).toBe(null);
  });
});
