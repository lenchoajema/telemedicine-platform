// Added import to resolve ReferenceError
import VerificationReviewPage from "./pages/Admin/VerificationReviewPage";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/Home/Home';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DoctorsPage from './pages/Doctors/DoctorsPage';
import AppointmentsPage from './pages/Appointments/AppointmentsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import NotFoundPage from './pages/Error/NotFoundPage';
import UsersManagementPage from './pages/Admin/UsersManagementPage';
import ReportsPage from './pages/Admin/ReportsPage';
import DoctorProfilePage from './pages/Doctors/DoctorProfilePage';
import DoctorAvailabilityPage from './pages/Doctors/DoctorAvailabilityPage';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                <PublicRoute>
                  <HomePage />
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
              
              <Route path="/appointments" element={
                <ProtectedRoute>
                  <AppointmentsPage />
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
                  <UsersManagementPage />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/reports" element={
                <ProtectedRoute roles={['admin']}>
                  <ReportsPage />
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

              {/* Error Handling */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

