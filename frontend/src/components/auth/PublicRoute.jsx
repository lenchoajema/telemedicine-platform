import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function PublicRoute({ children, restricted = false }) {
  const { user } = useAuth();

  if (user && restricted) {
    // Redirect based on role
    const path =
      user.role === "doctor" ? "/doctor/appointments" : "/appointments";
    return <Navigate to={path} replace />;
  }

  return children;
}
