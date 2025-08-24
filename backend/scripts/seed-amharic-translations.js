// backend/scripts/seed-amharic-translations.js
// Usage: node backend/scripts/seed-amharic-translations.js

import 'dotenv/config';
import mongoose from 'mongoose';
import ContentTranslation from '../src/models/ContentTranslation.js';

// Prefer MONGO_URI (used by app) then MONGODB_URI then local fallback; trim to remove accidental leading spaces
const MONGODB_URI = (process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27018/telemedicine').trim();

// We seed both base 'am' and region 'am-ET' (region can override base if needed)
const baseTranslations = [
  // Common namespace (subset for demo)
  { namespace: 'common', key: 'nav.home', language: 'am', value: 'መነሻ' },
  { namespace: 'common', key: 'nav.about', language: 'am', value: 'ስለ እኛ' },
  { namespace: 'common', key: 'nav.services', language: 'am', value: 'አገልግሎቶች' },
  { namespace: 'common', key: 'nav.contact', language: 'am', value: 'አግኙን' },
  { namespace: 'common', key: 'actions.signIn', language: 'am', value: 'ግባ' },
  { namespace: 'common', key: 'actions.getStarted', language: 'am', value: 'ጀምር' },
  { namespace: 'admin', key: 'actions.complete', language: 'am', value: 'ጨርስ' },
  { namespace: 'admin', key: 'actions.cancel', language: 'am', value: 'ሰርዝ' },

  // Admin namespace keys mirroring English fallbacks
  { namespace: 'admin', key: 'appointments.title', language: 'am', value: 'የቀጠሮ አስተዳደር' },
  { namespace: 'admin', key: 'appointments.subtitle', language: 'am', value: 'ሁሉንም ቀጠሮዎች አስተዳድር እና እቀና' },
  { namespace: 'admin', key: 'filters.searchPlaceholder', language: 'am', value: 'በታካሚ ወይም በዶክተር ስም ፈልግ...' },
  { namespace: 'admin', key: 'filters.allAppointments', language: 'am', value: 'ሁሉም ቀጠሮዎች' },
  { namespace: 'admin', key: 'filters.scheduled', language: 'am', value: 'ታቅዷል' },
  { namespace: 'admin', key: 'filters.completed', language: 'am', value: 'ተጠናቋል' },
  { namespace: 'admin', key: 'filters.cancelled', language: 'am', value: 'ተሰርዟል' },
  { namespace: 'admin', key: 'filters.noShow', language: 'am', value: 'አልተገኘም' },
  { namespace: 'admin', key: 'stats.scheduled', language: 'am', value: 'ታቅዷል' },
  { namespace: 'admin', key: 'stats.completed', language: 'am', value: 'ተጠናቋል' },
  { namespace: 'admin', key: 'stats.cancelled', language: 'am', value: 'ተሰርዟል' },
  { namespace: 'admin', key: 'stats.total', language: 'am', value: 'ጠቅላላ' },
  { namespace: 'admin', key: 'table.patient', language: 'am', value: 'ታካሚ' },
  { namespace: 'admin', key: 'table.doctor', language: 'am', value: 'ዶክተር' },
  { namespace: 'admin', key: 'table.dateTime', language: 'am', value: 'ቀን & ጊዜ' },
  { namespace: 'admin', key: 'table.type', language: 'am', value: 'አይነት' },
  { namespace: 'admin', key: 'table.status', language: 'am', value: 'ሁኔታ' },
  { namespace: 'admin', key: 'table.reason', language: 'am', value: 'ምክንያት' },
  { namespace: 'admin', key: 'table.actions', language: 'am', value: 'ተግባራት' },
  { namespace: 'admin', key: 'table.noReason', language: 'am', value: 'ምክንያት የለም' },
  { namespace: 'admin', key: 'table.details', language: 'am', value: 'ዝርዝር' },
  { namespace: 'admin', key: 'table.lifecycle', language: 'am', value: 'የሂደት ሁኔታ' },
  { namespace: 'admin', key: 'empty.noAppointments', language: 'am', value: 'ከሚመስሉት መስፈርቶች ጋር የሚጣጣሙ ቀጠሮዎች አልተገኙም።' },
  { namespace: 'admin', key: 'insights.title', language: 'am', value: 'የቀጠሮ ግኝቶች' },
  { namespace: 'admin', key: 'insights.mostPopularTime', language: 'am', value: 'በጣም የሚወደድ ጊዜ' },
  { namespace: 'admin', key: 'insights.averageDuration', language: 'am', value: 'አማካይ ቆይታ' },
  { namespace: 'admin', key: 'insights.completionRate', language: 'am', value: 'የመጨረሻ ደረጃ መጠን' },
  { namespace: 'admin', key: 'insights.noShowRate', language: 'am', value: 'ያልተገኘ መጠን' },
];

// Duplicate into region-specific am-ET if not overriding
const regionTranslations = baseTranslations.map(t => ({ ...t, language: 'am-ET' }));
const translations = [...baseTranslations, ...regionTranslations];

async function seed() {
  console.log('Connecting to MongoDB for seeding (Amharic)...');
  console.log('Mongo target (sanitized):', MONGODB_URI.replace(/:[^:@/]+@/, ':****@'));
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  for (const t of translations) {
    await ContentTranslation.findOneAndUpdate(
      { namespace: t.namespace, key: t.key, language: t.language },
      t,
      { upsert: true, new: true }
    );
  }
  console.log('Amharic translations seeded for languages: am & am-ET.');
  await mongoose.disconnect();
}

seed().catch((e) => { console.log(e); process.exit(1); });
