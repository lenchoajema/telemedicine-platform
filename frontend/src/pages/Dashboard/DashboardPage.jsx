import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import AdminDashboardPage from "./AdminDashboardPage";
import DoctorDashboardPage from "./DoctorDashboardPage";
import PatientDashboardPage from "./PatientDashboardPage";
import PharmacyDashboardPage from "./PharmacyDashboardPage";
import LaboratoryDashboardPage from "./LaboratoryDashboardPage";
// Lightweight portal dashboards for new roles can be added later; for now, keep patients default.
import "./DashboardPage.css";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  console.log(
    "DashboardPage - loading:",
    loading,
    "user:",
    user,
    "user.role:",
    user?.role
  );

  if (loading) return <LoadingSpinner fullPage />;

  if (!user) return <div>Please log in to view your dashboard.</div>;

  // Route users to the appropriate dashboard based on their role
  switch (user.role) {
    case "admin":
      console.log("Routing to AdminDashboardPage");
      return <AdminDashboardPage />;
    case "doctor":
      console.log("Routing to DoctorDashboardPage");
      return <DoctorDashboardPage />;
    case "pharmacist":
      console.log("Routing to PharmacyDashboardPage");
      return <PharmacyDashboardPage />;
    case "laboratory":
      console.log("Routing to LaboratoryDashboardPage");
      return <LaboratoryDashboardPage />;
    case "patient":
    default:
      console.log("Routing to PatientDashboardPage");
      return <PatientDashboardPage />;
  }
}
