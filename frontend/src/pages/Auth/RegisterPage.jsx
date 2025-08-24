import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { useNotifications } from "../../contexts/NotificationContextCore";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient",
    licenseNumber: "",
    specialization: "",
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      addNotification("Passwords do not match", "error");
      return;
    }

    setLoading(true);

    try {
      // Create registration data object
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
        role: formData.role,
      };

      // Add doctor-specific fields if role is doctor
      if (formData.role === "doctor") {
        registrationData.profile.licenseNumber = formData.licenseNumber;
        registrationData.profile.specialization = formData.specialization;
      }

      await register(registrationData);
      addNotification("Registration successful!", "success");

      // Redirect to appropriate landing after auto-login
      if (formData.role === "doctor") {
        navigate("/doctor/appointments");
      } else if (formData.role === "pharmacist") {
        navigate("/pharmacy/portal");
      } else if (formData.role === "laboratory") {
        navigate("/laboratory/portal");
      } else {
        navigate("/appointments");
      }
    } catch (err) {
      addNotification(err.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Get started with telemedicine</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g., jane.doe"
            />
          </div>

          <div className="name-fields">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                autoComplete="given-name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="8"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="role-selection">
            <label>I am a:</label>
            <div className="radio-group">
              <label htmlFor="patientRole">
                <input
                  id="patientRole"
                  type="radio"
                  name="role"
                  value="patient"
                  checked={formData.role === "patient"}
                  onChange={handleChange}
                />
                Patient
              </label>

              <label htmlFor="doctorRole">
                <input
                  id="doctorRole"
                  type="radio"
                  name="role"
                  value="doctor"
                  checked={formData.role === "doctor"}
                  onChange={handleChange}
                />
                Doctor
              </label>

              <label htmlFor="pharmacistRole">
                <input
                  id="pharmacistRole"
                  type="radio"
                  name="role"
                  value="pharmacist"
                  checked={formData.role === "pharmacist"}
                  onChange={handleChange}
                />
                Pharmacist
              </label>

              <label htmlFor="laboratoristRole">
                <input
                  id="laboratoristRole"
                  type="radio"
                  name="role"
                  value="laboratory"
                  checked={formData.role === "laboratory"}
                  onChange={handleChange}
                />
                Laboratorist
              </label>
            </div>
          </div>

          {/* Conditional doctor fields that only appear when "Doctor" role is selected */}
          {formData.role === "doctor" && (
            <div className="doctor-fields">
              <div className="form-group">
                <label htmlFor="licenseNumber">License Number</label>
                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="specialization">Specialization</label>
                <select
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Specialization --</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Psychiatry">Psychiatry</option>
                  <option value="Gynecology">Gynecology</option>
                  <option value="Ophthalmology">Ophthalmology</option>
                  <option value="ENT">ENT</option>
                </select>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
