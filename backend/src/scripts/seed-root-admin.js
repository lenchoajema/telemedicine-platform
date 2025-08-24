import dotenv from 'dotenv';
import mongoose from 'mongoose';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/telemedicine';
const ROOT_ADMIN_EMAIL = (process.env.ROOT_ADMIN_EMAIL || 'admin@telemedicine.com').toLowerCase();
const ROOT_ADMIN_PASSWORD = process.env.ROOT_ADMIN_PASSWORD || crypto.randomBytes(10).toString('hex');

function ensureUsername(email, firstName = 'System', lastName = 'Admin') {
  const base = (firstName.toLowerCase() + '.' + lastName.toLowerCase()).replace(/[^a-z0-9._-]/g, '');
  const local = email.split('@')[0];
  return (base || local).replace(/[^a-z0-9._-]/g, '');
}

(async () => {
  try {
    console.log(`[seed-root-admin] Connecting to ${MONGO_URI} ...`);
    await mongoose.connect(MONGO_URI);

    let user = await User.findOne({ email: ROOT_ADMIN_EMAIL });
    if (!user) {
      console.log(`[seed-root-admin] Creating root admin ${ROOT_ADMIN_EMAIL}`);
      user = new User({
        email: ROOT_ADMIN_EMAIL,
        username: ensureUsername(ROOT_ADMIN_EMAIL),
        password: ROOT_ADMIN_PASSWORD,
        role: 'admin',
        isVerified: true,
        timeZone: 'UTC',
        status: 'Active',
        profile: { firstName: 'System', lastName: 'Administrator' }
      });
      await user.save();
      console.log(`[seed-root-admin] Created root admin with temporary password: ${ROOT_ADMIN_PASSWORD}`);
    } else {
      console.log(`[seed-root-admin] Updating existing root admin ${ROOT_ADMIN_EMAIL}`);
      let changed = false;
      if (user.role !== 'admin') { user.role = 'admin'; changed = true; }
      if (user.status !== 'Active') { user.status = 'Active'; changed = true; }
      if (!user.isVerified) { user.isVerified = true; changed = true; }
      if (!user.username) { user.username = ensureUsername(user.email, user.profile?.firstName, user.profile?.lastName); changed = true; }
      if (!user.timeZone) { user.timeZone = 'UTC'; changed = true; }
      if (!user.profile) { user.profile = { firstName: 'System', lastName: 'Administrator' }; changed = true; }
      if (changed) {
        await user.save();
        console.log('[seed-root-admin] Root admin fields normalized.');
      } else {
        console.log('[seed-root-admin] Root admin already up to date.');
      }
      if (process.env.RESET_ROOT_ADMIN_PASSWORD === 'true') {
        user.password = ROOT_ADMIN_PASSWORD;
        await user.save();
        console.log(`[seed-root-admin] Root admin password reset to: ${ROOT_ADMIN_PASSWORD}`);
      }
    }
  } catch (err) {
  console.log('[seed-root-admin] Failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('[seed-root-admin] Done.');
  }
})();
