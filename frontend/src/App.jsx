// Added imporimport MedicalRecordsPage from './pages/MedicalRecords/PatientMedicalRecordsPage'; to resolve ReferenceError
import VerificationReviewPage from "./pages/Admin/VerificationReviewPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { RemindersProvider } from "./contexts/RemindersContext";
import { ChatProvider } from "./contexts/ChatContext";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import Layout from "./components/layout/Layout";
import HomePage from "./pages/Home/Home";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import DoctorsPage from "./pages/Doctors/DoctorsPage";
import AppointmentsPage from "./pages/Appointments/AppointmentsPage";
import NewAppointmentPage from "./pages/Appointments/NewAppointmentPage";
import PatientMedicalRecordsPage from "./pages/MedicalRecords/PatientMedicalRecordsPage";
import DoctorMedicalRecordsPage from "./pages/MedicalRecords/DoctorMedicalRecordsPage";
import NewMedicalRecordPage from "./pages/MedicalRecords/NewMedicalRecordPage";
import NewPrescriptionPage from "./pages/Prescriptions/NewPrescriptionPage";
import NewLabOrderPage from "./pages/LabOrders/NewLabOrderPage";
import AppointmentDetailPage from "./pages/Appointments/AppointmentDetailPage";
import DoctorProfileViewPage from "./pages/Doctors/DoctorProfileViewPage";
import ProtectedRoute from "./ProtectedRoute";
import SymptomCheckPage from "./pages/SymptomCheck/SymptomCheckPage";
import SymptomCheckDetailPage from "./pages/SymptomCheck/SymptomCheckDetailPage";
import CategoryListPage from "./pages/Forums/CategoryListPage";
import ThreadListPage from "./pages/Forums/ThreadListPage";
import PublicRoute from "./components/auth/PublicRoute";
import ThreadDetailPage from "./pages/Forums/ThreadDetailPage";
import NotFoundPage from "./pages/Error/NotFoundPage";
import UsersManagementPage from "./pages/Admin/UsersManagementPage";
import AdminUsersManagement from "./pages/Admin/AdminUsersManagement";
import ReportsPage from "./pages/Admin/ReportsPage";
import ForumModerationPage from "./pages/Admin/ForumModerationPage";
import DoctorProfilePage from "./pages/Doctors/DoctorProfilePage";
import DoctorAvailabilityPage from "./pages/Doctors/DoctorAvailabilityPage";
import DoctorAppointmentsPage from "./pages/Doctors/DoctorAppointmentsPage";
import DoctorCalendarPage from "./pages/Doctors/DoctorCalendarPage";
import DoctorPatientsPage from "./pages/Doctors/DoctorPatientsPage";
import AboutPage from "./pages/Public/AboutPage";
import ReminderSettingsPage from "./pages/Reminders/ReminderSettingsPage";
import ServicesPage from "./pages/Public/ServicesPage";
import ContactPage from "./pages/Public/ContactPage";
import VideoCallsPage from "./pages/Doctors/VideoCallsPage";
import AnalyticsPage from "./pages/Doctors/AnalyticsPage";
import VideoCallRoom from "./components/VideoCall/VideoCallRoom";
import WaitingRoomPage from "./pages/Video/WaitingRoomPage";
import SettingsPage from "./pages/Doctors/SettingsPage";
import AdminDoctorsPage from "./pages/Admin/AdminDoctorsPage";
import AdminAppointmentsPage from "./pages/Admin/AdminAppointmentsPage";
import AdminAnalyticsPage from "./pages/Admin/AdminAnalyticsPage";
import AdminMetricsPage from "./pages/Admin/AdminMetricsPage";
import AdminPricingPage from "./pages/Admin/AdminPricingPage";
import AdminBanksPage from "./pages/Admin/AdminBanksPage";
import AdminSettingsPage from "./pages/Admin/AdminSettingsPage";
import PharmacyPortalPage from "./pages/Pharmacy/PharmacyPortalPage";
import PharmacyInventoryPage from "./pages/Pharmacy/PharmacyInventoryPage";
import PharmacyOrdersPage from "./pages/Pharmacy/PharmacyOrdersPage";
import PharmacyProfileEditPage from "./pages/Pharmacy/PharmacyProfileEditPage";
import LaboratoryPortalPage from "./pages/Laboratory/LaboratoryPortalPage";
import LaboratoryCatalogPage from "./pages/Laboratory/LaboratoryCatalogPage";
import LaboratoryOrdersPage from "./pages/Laboratory/LaboratoryOrdersPage";
import LaboratoryProfileEditPage from "./pages/Laboratory/LaboratoryProfileEditPage";
import PortalsPage from "./pages/Portals/PortalsPage";
import PatientVideoCallsPage from "./pages/Patients/PatientVideoCallsPage";
import PatientSettingsPage from "./pages/Patients/PatientSettingsPage";
import RoleManagementPage from "./pages/Admin/RoleManagementPage";
import AdminAuditLogsPage from "./pages/Admin/AdminAuditLogsPage";
import ChatPage from "./pages/Chat/ChatPage";
import AppointmentLifecyclePage from "./pages/Admin/AppointmentLifecyclePage";
import PHROverviewPage from "./pages/PHR/PHROverviewPage";
import DevicesPage from "./pages/Devices/DevicesPage";
import ConsultationWorkspacePage from "./pages/Consultations/ConsultationWorkspacePage";
import "./App.css";

function App() {
  return (
    // Added future flag to opt-in to upcoming v7 relative splat path behavior (removes console warning)
    <Router future={{ v7_relativeSplatPath: true }}>
      <AuthProvider>
        <NotificationProvider>
          <RemindersProvider>
            <ChatProvider>
              <ErrorBoundary>
                <Layout>
                  <Routes>
                    {/* Community Forums */}
                    <Route
                      path="/forums/categories"
                      element={
                        <ProtectedRoute>
                          <CategoryListPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/forums/categories/:categoryId/threads"
                      element={
                        <ProtectedRoute>
                          <ThreadListPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/forums/threads/:threadId"
                      element={
                        <ProtectedRoute>
                          <ThreadDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/devices"
                      element={
                        <ProtectedRoute>
                          <DevicesPage />
                        </ProtectedRoute>
                      }
                    />
                    {/* Public Routes */}
                    <Route
                      path="/"
                      element={
                        <PublicRoute>
                          <HomePage />
                        </PublicRoute>
                      }
                    />

                    <Route
                      path="/about"
                      element={
                        <PublicRoute>
                          <AboutPage />
                        </PublicRoute>
                      }
                    />

                    <Route
                      path="/services"
                      element={
                        <PublicRoute>
                          <ServicesPage />
                        </PublicRoute>
                      }
                    />

                    <Route
                      path="/contact"
                      element={
                        <PublicRoute>
                          <ContactPage />
                        </PublicRoute>
                      }
                    />

                    <Route
                      path="/login"
                      element={
                        <PublicRoute restricted>
                          <LoginPage />
                        </PublicRoute>
                      }
                    />

                    <Route
                      path="/register"
                      element={
                        <PublicRoute restricted>
                          <RegisterPage />
                        </PublicRoute>
                      }
                    />

                    {/* Protected Routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/doctors"
                      element={
                        <ProtectedRoute>
                          <DoctorsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/doctors/:id"
                      element={
                        <ProtectedRoute>
                          <DoctorProfileViewPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/appointments"
                      element={
                        <ProtectedRoute>
                          <AppointmentsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/appointments/new"
                      element={
                        <ProtectedRoute>
                          <NewAppointmentPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/reminders/settings"
                      element={<ReminderSettingsPage />}
                    />
                    <Route
                      path="/chat"
                      element={
                        <ProtectedRoute>
                          <ChatPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/medical-records"
                      element={
                        <ProtectedRoute roles={["patient"]}>
                          <PatientMedicalRecordsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Video Call Route */}
                    <Route
                      path="/video-call/waiting/:appointmentId"
                      element={
                        <ProtectedRoute>
                          <WaitingRoomPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/video-call/:appointmentId"
                      element={
                        <ProtectedRoute>
                          <VideoCallRoom />
                        </ProtectedRoute>
                      }
                    />
                    {/* Symptom Checker */}
                    <Route
                      path="/symptom-check"
                      element={
                        <ProtectedRoute>
                          <SymptomCheckPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/symptom-check/:checkId"
                      element={
                        <ProtectedRoute>
                          <SymptomCheckDetailPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Routes */}
                    <Route
                      path="/admin/verifications"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <VerificationReviewPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/verifications/:doctorId"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <VerificationReviewPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/users"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <AdminUsersManagement />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/reports"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <ReportsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/audit-logs"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <AdminAuditLogsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/doctors"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <AdminDoctorsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/appointments"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <AdminAppointmentsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/analytics"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <AdminAnalyticsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/metrics"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <AdminMetricsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/pricing"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <AdminPricingPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/banks"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <AdminBanksPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/appointments/:appointmentId/lifecycle"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <AppointmentLifecyclePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/settings"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <AdminSettingsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/roles"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <RoleManagementPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/forums/moderation"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <ForumModerationPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Doctor Routes */}
                    <Route
                      path="/doctor/profile"
                      element={
                        <ProtectedRoute roles={["doctor"]}>
                          <DoctorProfilePage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/doctor/availability"
                      element={
                        <ProtectedRoute roles={["doctor"]}>
                          <DoctorAvailabilityPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/doctor/appointments"
                      element={
                        <ProtectedRoute roles={["doctor"]}>
                          <DoctorAppointmentsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/doctor/patients"
                      element={
                        <ProtectedRoute roles={["doctor"]}>
                          <DoctorPatientsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/doctor/medical-records"
                      element={
                        <ProtectedRoute roles={["doctor"]}>
                          <DoctorMedicalRecordsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/doctor/medical-records/new"
                      element={
                        <ProtectedRoute roles={["doctor"]}>
                          <NewMedicalRecordPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/doctor/prescriptions/new"
                      element={
                        <ProtectedRoute roles={["doctor"]}>
                          <NewPrescriptionPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/doctor/lab-orders/new"
                      element={
                        <ProtectedRoute roles={["doctor"]}>
                          <NewLabOrderPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/doctor/calendar"
                      element={
                        <ProtectedRoute roles={["doctor"]}>
                          <DoctorCalendarPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/video-calls"
                      element={
                        <ProtectedRoute roles={["doctor"]}>
                          <VideoCallsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/analytics"
                      element={
                        <ProtectedRoute roles={["doctor"]}>
                          <AnalyticsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute roles={["doctor", "patient"]}>
                          <SettingsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Patient Routes */}
                    <Route
                      path="/patient/video-calls"
                      element={
                        <ProtectedRoute roles={["patient"]}>
                          <PatientVideoCallsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/patient/settings"
                      element={
                        <ProtectedRoute roles={["patient"]}>
                          <PatientSettingsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/appointments/:id"
                      element={
                        <ProtectedRoute>
                          <AppointmentDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/phr"
                      element={
                        <ProtectedRoute>
                          <PHROverviewPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/doctor/appointments/:appointmentId/consult"
                      element={
                        <ProtectedRoute roles={["doctor"]}>
                          <ConsultationWorkspacePage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Pharmacy Portal Routes */}
                    <Route
                      path="/portals"
                      element={
                        <ProtectedRoute
                          roles={["pharmacist", "laboratory", "admin"]}
                        >
                          <PortalsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/pharmacy/portal"
                      element={
                        <ProtectedRoute roles={["pharmacist"]}>
                          <PharmacyPortalPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/pharmacy/profile/edit"
                      element={
                        <ProtectedRoute roles={["pharmacist"]}>
                          <PharmacyProfileEditPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/pharmacy/inventory"
                      element={
                        <ProtectedRoute roles={["pharmacist"]}>
                          <PharmacyInventoryPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/pharmacy/orders"
                      element={
                        <ProtectedRoute roles={["pharmacist"]}>
                          <PharmacyOrdersPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Laboratory Portal Routes */}
                    <Route
                      path="/laboratory/portal"
                      element={
                        <ProtectedRoute roles={["laboratory"]}>
                          <LaboratoryPortalPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/laboratory/profile/edit"
                      element={
                        <ProtectedRoute roles={["laboratory"]}>
                          <LaboratoryProfileEditPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/laboratory/catalog"
                      element={
                        <ProtectedRoute roles={["laboratory"]}>
                          <LaboratoryCatalogPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/laboratory/orders"
                      element={
                        <ProtectedRoute roles={["laboratory"]}>
                          <LaboratoryOrdersPage />
                        </ProtectedRoute>
                      }
                    />
                    {/* Error Handling */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Layout>
              </ErrorBoundary>
            </ChatProvider>
          </RemindersProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
