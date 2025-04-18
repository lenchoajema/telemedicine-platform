import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PublicRoute({ children, restricted = false }) {
  const { user } = useAuth();

  if (user && restricted) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}