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
              <Route path="/admin/verifications" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <VerificationReviewPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/verifications/:doctorId" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <VerificationReviewPage />
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

export default App;// Admin routes

