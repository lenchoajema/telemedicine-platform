// Added import to resolve ReferenceError
import VerificationReviewPage from "./pages/Admin/VerificationReviewPage";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ErrorBoundary from './components/shared/ErrorBoundary';
import Layout from './components/layout/Layout';
import HomePage from './pages/Home/Home';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DoctorsPage from './pages/Doctors/DoctorsPage';
import AppointmentsPage from './pages/Appointments/AppointmentsPage';
import NewAppointmentPage from './pages/Appointments/NewAppointmentPage';
import MedicalRecordsPage from './pages/MedicalRecords/MedicalRecordsPage';
import DoctorProfileViewPage from './pages/Doctors/DoctorProfileViewPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import NotFoundPage from './pages/Error/NotFoundPage';
import UsersManagementPage from './pages/Admin/UsersManagementPage';
import AdminUsersManagement from './pages/Admin/AdminUsersManagement';
import ReportsPage from './pages/Admin/ReportsPage';
import DoctorProfilePage from './pages/Doctors/DoctorProfilePage';
import DoctorAvailabilityPage from './pages/Doctors/DoctorAvailabilityPage';
import DoctorAppointmentsPage from './pages/Doctors/DoctorAppointmentsPage';
import DoctorPatientsPage from './pages/Doctors/DoctorPatientsPage';
import AboutPage from './pages/Public/AboutPage';
import ServicesPage from './pages/Public/ServicesPage';
import ContactPage from './pages/Public/ContactPage';
import VideoCallsPage from './pages/Doctors/VideoCallsPage';
import AnalyticsPage from './pages/Doctors/AnalyticsPage';
import VideoCallRoom from './components/VideoCall/VideoCallRoom';
import SettingsPage from './pages/Doctors/SettingsPage';
import AdminDoctorsPage from './pages/Admin/AdminDoctorsPage';
import AdminAppointmentsPage from './pages/Admin/AdminAppointmentsPage';
import AdminAnalyticsPage from './pages/Admin/AdminAnalyticsPage';
import AdminSettingsPage from './pages/Admin/AdminSettingsPage';
import PatientVideoCallsPage from './pages/Patients/PatientVideoCallsPage';
import PatientSettingsPage from './pages/Patients/PatientSettingsPage';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Layout>
            <ErrorBoundary>
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                <PublicRoute>
                  <HomePage />
                </PublicRoute>
              } />
              
              <Route path="/about" element={
                <PublicRoute>
                  <AboutPage />
                </PublicRoute>
              } />
              
              <Route path="/services" element={
                <PublicRoute>
                  <ServicesPage />
                </PublicRoute>
              } />
              
              <Route path="/contact" element={
                <PublicRoute>
                  <ContactPage />
                </PublicRoute>
              } />
              
              <Route path="/login" element={
                <PublicRoute restricted>
                  <LoginPage />
                </PublicRoute>
              } />
              
              <Route path="/register" element={
                <PublicRoute restricted>
                  <RegisterPage />
                </PublicRoute>
              } />

              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              
              <Route path="/doctors" element={
                <ProtectedRoute>
                  <DoctorsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/doctors/:id" element={
                <ProtectedRoute>
                  <DoctorProfileViewPage />
                </ProtectedRoute>
              } />
              
              <Route path="/appointments" element={
                <ProtectedRoute>
                  <AppointmentsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/appointments/new" element={
                <ProtectedRoute>
                  <NewAppointmentPage />
                </ProtectedRoute>
              } />
              
              <Route path="/medical-records" element={
                <ProtectedRoute>
                  <MedicalRecordsPage />
                </ProtectedRoute>
              } />

              {/* Video Call Route */}
              <Route path="/video-call/:appointmentId" element={
                <ProtectedRoute>
                  <VideoCallRoom />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin/verifications" element={
                <ProtectedRoute roles={['admin']}>
                  <VerificationReviewPage />
                </ProtectedRoute>
              } />

              <Route path="/admin/verifications/:doctorId" element={
                <ProtectedRoute roles={['admin']}>
                  <VerificationReviewPage />
                </ProtectedRoute>
              } />

              <Route path="/admin/users" element={
                <ProtectedRoute roles={['admin']}>
                  <ErrorBoundary>
                    <AdminUsersManagement />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/reports" element={
                <ProtectedRoute roles={['admin']}>
                  <ReportsPage />
                </ProtectedRoute>
              } />

              <Route path="/admin/doctors" element={
                <ProtectedRoute roles={['admin']}>
                  <AdminDoctorsPage />
                </ProtectedRoute>
              } />

              <Route path="/admin/appointments" element={
                <ProtectedRoute roles={['admin']}>
                  <AdminAppointmentsPage />
                </ProtectedRoute>
              } />

              <Route path="/admin/analytics" element={
                <ProtectedRoute roles={['admin']}>
                  <AdminAnalyticsPage />
                </ProtectedRoute>
              } />

              <Route path="/admin/settings" element={
                <ProtectedRoute roles={['admin']}>
                  <AdminSettingsPage />
                </ProtectedRoute>
              } />

              {/* Doctor Routes */}
              <Route path="/doctor/profile" element={
                <ProtectedRoute roles={['doctor']}>
                  <DoctorProfilePage />
                </ProtectedRoute>
              } />
              
              <Route path="/doctor/availability" element={
                <ProtectedRoute roles={['doctor']}>
                  <DoctorAvailabilityPage />
                </ProtectedRoute>
              } />

              <Route path="/doctor/appointments" element={
                <ProtectedRoute roles={['doctor']}>
                  <DoctorAppointmentsPage />
                </ProtectedRoute>
              } />

              <Route path="/doctor/patients" element={
                <ProtectedRoute roles={['doctor']}>
                  <DoctorPatientsPage />
                </ProtectedRoute>
              } />

              <Route path="/video-calls" element={
                <ProtectedRoute roles={['doctor']}>
                  <VideoCallsPage />
                </ProtectedRoute>
              } />

              <Route path="/analytics" element={
                <ProtectedRoute roles={['doctor']}>
                  <AnalyticsPage />
                </ProtectedRoute>
              } />

              <Route path="/settings" element={
                <ProtectedRoute roles={['doctor', 'patient']}>
                  <SettingsPage />
                </ProtectedRoute>
              } />

              {/* Patient Routes */}
              <Route path="/patient/video-calls" element={
                <ProtectedRoute roles={['patient']}>
                  <PatientVideoCallsPage />
                </ProtectedRoute>
              } />

              <Route path="/patient/settings" element={
                <ProtectedRoute roles={['patient']}>
                  <PatientSettingsPage />
                </ProtectedRoute>
              } />

              {/* Error Handling */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            </ErrorBoundary>
          </Layout>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

