// backend/src/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import morgan from 'morgan';
import connectDB from './modules/shared/db.js';
import authRoutes from './routes/authRoutes.js';
import { authenticate } from './middleware/auth.middleware.js';
import { attachUserPrivileges } from './middleware/rbac.middleware.js';
// import authRoutes from './modules/auth/auth.routes.js';
import appointmentRoutes from './modules/appointments/appointment.routes.js';
import doctorRoutes from './modules/doctors/doctor.routes.js';
import appointmentLifecycleRoutes from './routes/appointmentLifecycleRoutes.js';
import chartingRoutes, { observationsRouter } from './routes/chartingRoutes.js';
import NoteTemplate from './modules/charting/note-template.model.js';
import erxRoutes from './routes/erxRoutes.js';
import ordersRoutes from './routes/ordersRoutes.js';
import apiRoutes from './api/index.js';
import verificationRoutes from './modules/admin/verification.routes.js';
import statsRoutes from './modules/admin/stats.routes.js';
import reportsRoutes from './modules/admin/reports.routes.js';
import usersRoutes from './modules/admin/users.routes.js';
import settingsRoutes from './modules/admin/settings.routes.js';
import dashboardRoutes from './modules/admin/dashboard.routes.js';
import videoCallRoutes from './modules/video-calls/video-call.routes.js';
import forumRoutes from './routes/forumRoutes.js';
import messagesRoutes from './routes/messages.routes.js';
import symptomCheckRoutes from './routes/symptomCheckRoutes.js';
import patientRoutes from './modules/patients/patient.routes.js';
import timeSlotRoutes from './routes/timeSlot.routes.js';
import testTimeSlotRoutes from './routes/test-timeslot.routes.js';
import { logRegisteredRoutes } from './modules/shared/api-monitor.js';
// Add this line with the other imports near the top
import medicalRecordRoutes from './routes/medicalRecordRoutes.js';
import medicalDocumentRoutes from './routes/medicalDocumentRoutes.js';
import labOrderRoutes from './routes/labOrderRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import reminderRoutes from './modules/reminders/reminder.routes.js';
import chatRoutes from './modules/chats/chat.routes.js';
import roleRoutes from './routes/roleRoutes.js';
import { seedDefaultRoles } from './modules/admin/role.seed.js';
import { seedForumCategories } from './modules/forums/category.seed.js';
import notificationRoutes from './routes/notificationRoutes.js';
import phrRoutes from './routes/phrRoutes.js';
import deviceRoutes from './modules/devices/devices.routes.js';
import userSettingsRoutes from './routes/settings.routes.js';
import familyRoutes, { addByEmail } from './routes/family.routes.js';
import insuranceRoutes from './routes/insurance.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import pricingRoutes from './routes/pricing.routes.js';
import checkoutRoutes from './routes/checkout.routes.js';
import invoicesRoutes from './routes/invoices.routes.js';
import subscriptionsRoutes from './routes/subscriptions.routes.js';
import insuranceBillingRoutes from './routes/insurance-billing.routes.js';
import banksRoutes from './routes/banks.routes.js';
import discoveryRoutes from './routes/discovery.routes.js';
import publicRoutes from './routes/public.routes.js';
import i18nPublicRoutes from './routes/i18n.public.routes.js';
import i18nAdminRoutes from './routes/i18n.admin.routes.js';
import pharmacyPortalRoutes from './routes/pharmacy.routes.js';
import laboratoryPortalRoutes from './routes/laboratory.routes.js';
import prescriptionsRoutes from './routes/prescriptions.routes.js';
import adminMetricsRoutes from './routes/metrics.routes.js';
import availabilityRoutes from './modules/availability/availability.routes.js';
import { ensureCoreUsers } from './modules/auth/ensureCoreUsers.js';


dotenv.config();

const app = express();
// Disable ETag to avoid client caching API responses
app.disable('etag');

// Connect to database
// Connect to database
connectDB().then(() => {
  if (process.env.AUTO_ENSURE_CORE_USERS !== 'false') {
    ensureCoreUsers().catch(e => console.log('ensureCoreUsers error:', e.message));
  }
});
// Seed roles if not present
seedDefaultRoles().catch(err => console.log('Role seeding error:', err));
seedForumCategories().catch(err => console.log('Forum category seeding error:', err));

// Seed default consultation note templates if missing
async function seedDefaultNoteTemplates() {
  try {
    const count = await NoteTemplate.estimatedDocumentCount();
    if (count > 0) return;
    const defaults = [
      {
        name: 'General SOAP',
        specialty: 'General Medicine',
        sectionsJSON: { subjective: '', objective: '', assessment: '', plan: '' },
        isActive: true,
      },
      {
        name: 'Pediatrics SOAP',
        specialty: 'Pediatrics',
        sectionsJSON: {
          subjective: 'Chief complaint, HPI, parents concerns',
          objective: 'Vitals, growth percentiles, exam findings',
          assessment: 'Differential diagnosis',
          plan: 'Treatment, anticipatory guidance, follow-up',
        },
        isActive: true,
      },
      {
        name: 'Telemedicine Visit',
        specialty: 'Telemedicine',
        sectionsJSON: {
          subjective: 'Chief complaint, HPI, ROS (self-reported)',
          objective: 'Observable findings, home vitals (if any)',
          assessment: '',
          plan: 'Care plan, eRx, orders, safety-net, follow-up',
        },
        isActive: true,
      },
    ];
    await NoteTemplate.insertMany(defaults);
    console.log('Seeded default note templates');
  } catch (e) {
    console.log('Note template seeding error:', e);
  }
}
seedDefaultNoteTemplates();

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:8081',
    // process.env.CLIENT_URL,
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  exposedHeaders: ['Set-Cookie'],
};

app.use(cors(corsOptions));
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
// Alias to allow BASE_URLs that include /api to still access files without auth token
app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));

// --- API Routes ---
// Public health check (keep before authentication)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Public auth routes
app.use('/api/auth', authRoutes);
// Public discovery endpoints (must be before authenticate)
app.use('/api/discovery', discoveryRoutes);
// Public i18n endpoints
app.use('/api/i18n', i18nPublicRoutes);
app.use('/api', publicRoutes);
// Public favicon to avoid unnecessary auth 401 noise in logs
app.get('/favicon.ico', (req, res) => {
  // You can replace this with res.sendFile(...) if you add an actual favicon asset
  res.status(204).end();
});
// Protect and enrich user with privileges for all following routes
app.use(authenticate);
app.use(attachUserPrivileges);

if (process.env.USE_API_ROUTES === 'true') {
  app.use('/api', apiRoutes);
} else {
  app.use('/api/appointments', appointmentRoutes);
  // Appointment lifecycle tracking
  app.use(
    '/api/appointments/:appointmentId/lifecycle',
    appointmentLifecycleRoutes
  );
  app.use('/api/doctors', doctorRoutes);
  // Doctor availability authoring (template, preview, publish, exceptions)
  app.use('/api/doctors', availabilityRoutes);
  app.use('/api/admin/verifications', verificationRoutes);
  app.use('/api/admin/stats', statsRoutes);
  app.use('/api/admin/users', usersRoutes);
  app.use('/api/admin/reports', reportsRoutes);
  app.use('/api/admin/settings', settingsRoutes);
  app.use('/api/admin/metrics', adminMetricsRoutes);
  // Admin i18n endpoints
  app.use('/api/admin/i18n', i18nAdminRoutes);
  app.use('/api/admin/dashboard', dashboardRoutes);
  app.use('/api/video-calls', videoCallRoutes);
  app.use('/api/patients', patientRoutes);
  // Charting (notes, templates)
  app.use('/api/appointments/:appointmentId/chart', chartingRoutes);
  // Medical documents upload and retrieval
  app.use('/api/medical-documents', medicalDocumentRoutes);
  app.use('/api/timeslots', timeSlotRoutes);
  app.use('/api/test-timeslots', testTimeSlotRoutes);
  app.use('/api/medical-records', medicalRecordRoutes);
}
  
// Ensure audit-log routes are always available
  app.use('/api/admin/audit-logs', auditLogRoutes);
  // Role management
  app.use('/api/admin/roles', roleRoutes);
  app.use('/api/lab-orders', labOrderRoutes);
  // Reminder scheduling and dispatch
  app.use('/api/reminders', reminderRoutes);
  // Chat sessions and messages
  app.use('/api/chats', chatRoutes);
  app.use('/api', messagesRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/phr', phrRoutes);
  // Portals
  app.use('/api/pharmacy', pharmacyPortalRoutes);
  app.use('/api/laboratory', laboratoryPortalRoutes);
  // Aliases
  app.use('/api/pharmacies', pharmacyPortalRoutes);
  app.use('/api/labs-portal', laboratoryPortalRoutes);
  // Forums & Communities
  app.use('/api/forums', forumRoutes);
  // Symptom Checker endpoints
  app.use('/api/symptom-check', symptomCheckRoutes);
  // Device Integration routes
  app.use('/api/devices', deviceRoutes);
  app.use('/api/observations', observationsRouter);
  // eRx
  app.use('/api', erxRoutes);
  app.use('/api/prescriptions', prescriptionsRoutes);
  // Orders (Labs & Imaging)
  app.use('/api/orders', ordersRoutes);
  // User Settings & Family
  app.use('/api/settings', userSettingsRoutes);
  app.use('/api/family', familyRoutes);
  // Insurance & Billing
  app.use('/api/insurance', insuranceRoutes);
  app.use('/api/billing', paymentRoutes);
  app.use('/api/pricing', pricingRoutes);
  app.use('/api/checkout', checkoutRoutes);
  app.use('/api/invoices', invoicesRoutes);
  app.use('/api/subscriptions', subscriptionsRoutes);
  app.use('/api/insurance', insuranceBillingRoutes);
  app.use('/api/banks', banksRoutes);
  // Fallback direct bridge for add-by-email
  app.post('/api/family/members/by-email', authenticate, attachUserPrivileges, addByEmail);
  app.post('/api/family/member/by-email', authenticate, attachUserPrivileges, addByEmail);

// Ensure audit-log routes are always available
app.use('/api/admin/audit-logs', auditLogRoutes);

// Debug: Add a simple direct route to test
app.get('/api/debug-timeslots', (req, res) => {
  res.json({ message: 'Debug TimeSlot route working', timestamp: new Date() });
});
// Log all registered routes for debugging
logRegisteredRoutes(app);

// Reminder dispatcher: periodically send pending notifications
import { dispatchReminders } from './modules/reminders/dispatcher.js';
import { setInterval } from 'timers';

// Run dispatcher every minute
setInterval(() => {
  dispatchReminders().catch((err) => console.log('Error running dispatchReminders', err));
}, 60 * 1000);

// General 404 handler
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    res.status(404).json({ 
      error: 'Endpoint not found',
      message: `The requested endpoint ${req.originalUrl} does not exist`,
      statusCode: 404
    });
  } else {
    res.status(404).json({ 
      error: 'Not found',
      message: 'The requested resource was not found',
      statusCode: 404
    });
  }
});

app.use((err, req, res, _next) => {
  console.log('Server error:', err);
  res.status(500).json({ 
    error: 'Server error', 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

export default app;
