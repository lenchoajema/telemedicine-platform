import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import AdminDashboardPage from './AdminDashboardPage';
import DoctorDashboardPage from './DoctorDashboardPage';
import PatientDashboardPage from './PatientDashboardPage';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullPage />;
  
  if (!user) return <div>Please log in to view your dashboard.</div>;

  // Route users to the appropriate dashboard based on their role
  switch (user.role) {
    case 'admin':
      return <AdminDashboardPage />;
    case 'doctor':
      return <DoctorDashboardPage />;
    case 'patient':
    default:
      return <PatientDashboardPage />;
  }
}
