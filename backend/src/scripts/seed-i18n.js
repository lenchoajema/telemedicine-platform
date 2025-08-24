import mongoose from 'mongoose';
import connectDB from '../modules/shared/db.js';
import ContentTranslation from '../models/ContentTranslation.js';

async function run() {
  await connectDB();
  const docs = [
    // common.nav.home
    { namespace: 'common', key: 'nav.home', language: 'en', value: 'Home' },
    { namespace: 'common', key: 'nav.home', language: 'sw', value: 'Nyumbani' },
    { namespace: 'common', key: 'nav.home', language: 'fr', value: 'Accueil' },
    { namespace: 'common', key: 'nav.home', language: 'ar', value: 'الرئيسية' },
    { namespace: 'common', key: 'nav.home', language: 'am-ET', value: 'መነሻ' },
  // additional common nav items (base pre-login expansion)
  { namespace: 'common', key: 'nav.about', language: 'en', value: 'About' },
  { namespace: 'common', key: 'nav.about', language: 'fr', value: 'À propos' },
  { namespace: 'common', key: 'nav.about', language: 'sw', value: 'Kuhusu' },
  { namespace: 'common', key: 'nav.about', language: 'am-ET', value: 'ስለ እኛ' },
  { namespace: 'common', key: 'nav.services', language: 'en', value: 'Services' },
  { namespace: 'common', key: 'nav.services', language: 'fr', value: 'Services' },
  { namespace: 'common', key: 'nav.services', language: 'sw', value: 'Huduma' },
  { namespace: 'common', key: 'nav.services', language: 'am-ET', value: 'አገልግሎቶች' },
  { namespace: 'common', key: 'nav.contact', language: 'en', value: 'Contact' },
  { namespace: 'common', key: 'nav.contact', language: 'fr', value: 'Contact' },
  { namespace: 'common', key: 'nav.contact', language: 'sw', value: 'Mawasiliano' },
  { namespace: 'common', key: 'nav.contact', language: 'am-ET', value: 'አግኙን' },
    // actions
    { namespace: 'common', key: 'actions.signIn', language: 'en', value: 'Sign in' },
    { namespace: 'common', key: 'actions.signIn', language: 'sw', value: 'Ingia' },
    { namespace: 'common', key: 'actions.signIn', language: 'fr', value: 'Se connecter' },
    { namespace: 'common', key: 'actions.signIn', language: 'ar', value: 'تسجيل الدخول' },
    { namespace: 'common', key: 'actions.signIn', language: 'am-ET', value: 'ግባ' },
    { namespace: 'common', key: 'actions.getStarted', language: 'en', value: 'Get Started' },
    { namespace: 'common', key: 'actions.getStarted', language: 'sw', value: 'Anza' },
    { namespace: 'common', key: 'actions.getStarted', language: 'fr', value: 'Commencer' },
    { namespace: 'common', key: 'actions.getStarted', language: 'ar', value: 'ابدأ' },
    { namespace: 'common', key: 'actions.getStarted', language: 'am-ET', value: 'ጀምር' },
  // admin namespace (base implementation for full app coverage)
  { namespace: 'admin', key: 'actions.cancel', language: 'en', value: 'Cancel' },
  { namespace: 'admin', key: 'actions.complete', language: 'en', value: 'Complete' },
  { namespace: 'admin', key: 'appointments.title', language: 'en', value: 'Appointment Management' },
  { namespace: 'admin', key: 'appointments.subtitle', language: 'en', value: 'View, filter and manage all appointments' },
  { namespace: 'admin', key: 'filters.searchPlaceholder', language: 'en', value: 'Search by patient or doctor...' },
  { namespace: 'admin', key: 'filters.allAppointments', language: 'en', value: 'All Appointments' },
  { namespace: 'admin', key: 'filters.scheduled', language: 'en', value: 'Scheduled' },
  { namespace: 'admin', key: 'filters.completed', language: 'en', value: 'Completed' },
  { namespace: 'admin', key: 'filters.cancelled', language: 'en', value: 'Cancelled' },
  { namespace: 'admin', key: 'filters.noShow', language: 'en', value: 'No Show' },
  { namespace: 'admin', key: 'stats.scheduled', language: 'en', value: 'Scheduled' },
  { namespace: 'admin', key: 'stats.completed', language: 'en', value: 'Completed' },
  { namespace: 'admin', key: 'stats.cancelled', language: 'en', value: 'Cancelled' },
  { namespace: 'admin', key: 'stats.total', language: 'en', value: 'Total' },
  { namespace: 'admin', key: 'table.patient', language: 'en', value: 'Patient' },
  { namespace: 'admin', key: 'table.doctor', language: 'en', value: 'Doctor' },
  { namespace: 'admin', key: 'table.dateTime', language: 'en', value: 'Date & Time' },
  { namespace: 'admin', key: 'table.type', language: 'en', value: 'Type' },
  { namespace: 'admin', key: 'table.status', language: 'en', value: 'Status' },
  { namespace: 'admin', key: 'table.reason', language: 'en', value: 'Reason' },
  { namespace: 'admin', key: 'table.actions', language: 'en', value: 'Actions' },
  { namespace: 'admin', key: 'table.noReason', language: 'en', value: 'No reason' },
  { namespace: 'admin', key: 'table.details', language: 'en', value: 'Details' },
  { namespace: 'admin', key: 'table.lifecycle', language: 'en', value: 'Lifecycle' },
  { namespace: 'admin', key: 'empty.noAppointments', language: 'en', value: 'No appointments match the current filters.' },
  { namespace: 'admin', key: 'insights.title', language: 'en', value: 'Appointment Insights' },
  { namespace: 'admin', key: 'insights.mostPopularTime', language: 'en', value: 'Most Popular Time' },
  { namespace: 'admin', key: 'insights.averageDuration', language: 'en', value: 'Average Duration' },
  { namespace: 'admin', key: 'insights.completionRate', language: 'en', value: 'Completion Rate' },
  { namespace: 'admin', key: 'insights.noShowRate', language: 'en', value: 'No-Show Rate' },
    // a couple more examples
    { namespace: 'dashboard', key: 'welcome', language: 'en', value: 'Welcome' },
    { namespace: 'dashboard', key: 'welcome', language: 'sw', value: 'Karibu' },
  ];
  for (const d of docs) {
    await ContentTranslation.updateOne(
      { namespace: d.namespace, key: d.key, language: d.language },
      { $set: { value: d.value } },
      { upsert: true }
    );
  }
  console.log('Seeded basic i18n translations');
  await mongoose.connection.close();
}

run().catch((e) => { console.log(e); process.exit(1); });
