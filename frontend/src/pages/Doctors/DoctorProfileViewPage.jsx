import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContextCore";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import "./DoctorProfileViewPage.css";

export default function DoctorProfileViewPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctor();
  }, [id]);

  const fetchDoctor = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/doctors/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch doctor details");
      }

      const data = await response.json();
      setDoctor(data);
    } catch (error) {
      console.error("Error fetching doctor:", error);
      addNotification(`Error: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  if (!doctor) {
    return (
      <div className="doctor-profile-view-page">
        <div className="error-message">
          <h2>Doctor Not Found</h2>
          <p>The requested doctor profile could not be found.</p>
          <Link to="/doctors" className="btn primary">
            Back to Doctors
          </Link>
        </div>
      </div>
    );
  }

  const isDoctorBookable = () => {
    const approved =
      typeof doctor?.verificationStatus === "string"
        ? /^(approved)$/i.test(doctor.verificationStatus)
        : true;
    const active =
      typeof doctor?.status === "string"
        ? /^(active)$/i.test(doctor.status)
        : true;
    return approved && active;
  };

  return (
    <div className="doctor-profile-view-page">
      <div className="profile-header">
        <div className="doctor-avatar-section">
          <img
            src={doctor.profile?.avatar || "/default-doctor.png"}
            alt={doctor.profile?.fullName}
            className="doctor-avatar"
            onError={(e) => {
              e.target.src = "/default-doctor.png";
            }}
          />
          <div className="doctor-basic-info">
            <h1>{doctor.profile?.fullName}</h1>
            <p className="specialization">{doctor.profile?.specialization}</p>
            {doctor.profile?.experience && (
              <p className="experience">
                {doctor.profile.experience} years of experience
              </p>
            )}
          </div>
        </div>

        <div className="profile-actions">
          <Link
            to={
              isDoctorBookable()
                ? `/appointments/new?doctorId=${doctor._id}`
                : "#"
            }
            className={`btn primary ${!isDoctorBookable() ? "disabled" : ""}`}
            aria-disabled={!isDoctorBookable()}
            onClick={(e) => {
              if (!isDoctorBookable()) e.preventDefault();
            }}
            title={
              !isDoctorBookable() ? "Doctor not available for booking" : ""
            }
          >
            Book Appointment
          </Link>
          <Link to="/doctors" className="btn secondary">
            Back to Doctors
          </Link>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-main">
          <section className="about-section">
            <h2>
              About Dr. {doctor.profile?.lastName || doctor.profile?.fullName}
            </h2>
            {doctor.profile?.bio ? (
              <p className="bio">{doctor.profile.bio}</p>
            ) : (
              <p className="no-bio">No biography available.</p>
            )}
          </section>

          {doctor.profile?.education && (
            <section className="education-section">
              <h2>Education</h2>
              <p>{doctor.profile.education}</p>
            </section>
          )}

          {doctor.profile?.licenseNumber && (
            <section className="credentials-section">
              <h2>Credentials</h2>
              <div className="credential-item">
                <strong>Medical License:</strong> {doctor.profile.licenseNumber}
              </div>
              <div className="credential-item">
                <strong>Verification Status:</strong>
                <span
                  className={`status ${doctor.verificationStatus || "pending"}`}
                >
                  {doctor.verificationStatus || "Pending"}
                </span>
              </div>
            </section>
          )}
        </div>

        <div className="profile-sidebar">
          <div className="quick-info-card">
            <h3>Quick Information</h3>
            <div className="info-items">
              <div className="info-item">
                <span className="label">Specialization:</span>
                <span className="value">
                  {doctor.profile?.specialization || "Not specified"}
                </span>
              </div>

              {doctor.profile?.experience && (
                <div className="info-item">
                  <span className="label">Experience:</span>
                  <span className="value">
                    {doctor.profile.experience} years
                  </span>
                </div>
              )}

              <div className="info-item">
                <span className="label">Status:</span>
                <span className={`value status ${doctor.status || "active"}`}>
                  {doctor.status || "Active"}
                </span>
              </div>

              <div className="info-item">
                <span className="label">Member Since:</span>
                <span className="value">
                  {new Date(doctor.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="booking-card">
            <h3>Book an Appointment</h3>
            <p>
              Schedule a consultation with Dr.{" "}
              {doctor.profile?.lastName || doctor.profile?.fullName}
            </p>
            <Link
              to={
                isDoctorBookable()
                  ? `/appointments/new?doctorId=${doctor._id}`
                  : "#"
              }
              className={`btn primary full-width ${
                !isDoctorBookable() ? "disabled" : ""
              }`}
              aria-disabled={!isDoctorBookable()}
              onClick={(e) => {
                if (!isDoctorBookable()) e.preventDefault();
              }}
              title={
                !isDoctorBookable() ? "Doctor not available for booking" : ""
              }
            >
              Book Now
            </Link>
            {!isDoctorBookable() && (
              <p className="helper-text">
                This doctor is not currently available for booking.
              </p>
            )}
          </div>

          {doctor.profile?.specialization && (
            <div className="specialization-card">
              <h3>Specialization</h3>
              <div className="specialization-badge">
                {doctor.profile.specialization}
              </div>
              <p>
                Expert care in {doctor.profile.specialization.toLowerCase()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
