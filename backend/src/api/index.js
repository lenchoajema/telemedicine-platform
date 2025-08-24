import express from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import doctorRoutes from '../modules/doctors/doctor.routes.js';
import appointmentRoutes from '../modules/appointments/appointment.routes.js';
import verificationRoutes from '../modules/admin/verification.routes.js';
import statsRoutes from '../modules/admin/stats.routes.js';
import usersRoutes from '../modules/admin/users.routes.js';
import reportsRoutes from '../modules/admin/reports.routes.js';
import patientRoutes from '../modules/patients/patient.routes.js';
import medicalRecordsRoutes from '../modules/patients/medical-records.routes.js';
import chartingRoutes from '../routes/chartingRoutes.js';
import userSettingsRoutes from '../routes/settings.routes.js';
import familyRoutes, { addByEmail } from '../routes/family.routes.js';
import insuranceRoutes from '../routes/insurance.routes.js';
import paymentRoutes from '../routes/payment.routes.js';
import pricingRoutes from '../routes/pricing.routes.js';
import checkoutRoutes from '../routes/checkout.routes.js';
import invoicesRoutes from '../routes/invoices.routes.js';
import subscriptionsRoutes from '../routes/subscriptions.routes.js';
import insuranceBillingRoutes from '../routes/insurance-billing.routes.js';
import userSettingsV2Routes from '../routes/userSettingsV2.routes.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Register all routes
router.use('/auth', authRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
// Consultation charting (notes, templates)
router.use('/appointments/:appointmentId/chart', chartingRoutes);
router.use('/admin/verifications', verificationRoutes);
router.use('/admin/stats', statsRoutes);
router.use('/admin/users', usersRoutes);
router.use('/admin/reports', reportsRoutes);
router.use('/patients', patientRoutes);
router.use('/medical-records', medicalRecordsRoutes);
router.use('/settings', userSettingsRoutes);
// Family routes
router.use('/family', familyRoutes);
// Fallback for addByEmail under aggregated /api
router.post('/family/members/by-email', addByEmail);
router.post('/family/member/by-email', addByEmail);
// Insurance & Billing
router.use('/insurance', insuranceRoutes);
router.use('/billing', paymentRoutes);
router.use('/pricing', pricingRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/subscriptions', subscriptionsRoutes);
router.use('/insurance', insuranceBillingRoutes);
router.use('/users', userSettingsV2Routes);

export default router;
