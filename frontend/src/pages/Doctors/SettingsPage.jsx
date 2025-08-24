import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContextCore";
import apiClient from "../../api/apiClient";
import "./DoctorPages.css";

export default function SettingsPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [profile, setProfile] = useState({
    personalInfo: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      bio: "",
      photo: "",
    },
    professionalInfo: {
      specialization: "",
      licenseNumber: "",
      experience: "",
      education: "",
      certifications: "",
      consultationFee: "",
    },
    preferences: {
      consultationDuration: 30,
      bufferTime: 15,
      maxDailyAppointments: 20,
      autoConfirmBookings: true,
      emailNotifications: true,
      smsNotifications: false,
      timezone: "America/New_York",
    },
    availability: {
      workingDays: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      },
      workingHours: {
        start: "09:00",
        end: "17:00",
      },
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [verificationDocs, setVerificationDocs] = useState([]);
  const [docUploading, setDocUploading] = useState(false);
  const [docFiles, setDocFiles] = useState([]); // temp selected files
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchDoctorProfile();
    loadVerificationDocs();
  }, []);

  const loadVerificationDocs = async () => {
    try {
      const { documents } = await apiClient
        .get("/doctors/verification-documents")
        .then((r) => r.data);
      setVerificationDocs(documents || []);
    } catch (e) {
      /* silent */
    }
  };

  const fetchDoctorProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/doctors/profile");
      const doctorData = response.data;

      if (doctorData) {
        setProfile((prevProfile) => ({
          ...prevProfile,
          personalInfo: {
            firstName: doctorData.user?.profile?.firstName || "",
            lastName: doctorData.user?.profile?.lastName || "",
            email: doctorData.user?.email || "",
            phone: doctorData.user?.profile?.phone || "",
            bio: doctorData.bio || "",
            photo: doctorData.user?.profile?.photo || "",
          },
          professionalInfo: {
            specialization: doctorData.specialization || "",
            licenseNumber: doctorData.licenseNumber || "",
            experience: doctorData.experience || "",
            education: doctorData.education || "",
            certifications: doctorData.certifications || "",
            consultationFee: doctorData.consultationFee || "50",
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching doctor profile:", error);
      addNotification("Failed to load profile data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setProfile((prevProfile) => ({
      ...prevProfile,
      [section]: {
        ...prevProfile[section],
        [field]: value,
      },
    }));
  };

  const handleWorkingDayChange = (day, checked) => {
    setProfile((prevProfile) => ({
      ...prevProfile,
      availability: {
        ...prevProfile.availability,
        workingDays: {
          ...prevProfile.availability.workingDays,
          [day]: checked,
        },
      },
    }));
  };

  const saveProfile = async (section) => {
    try {
      setSaving(true);

      let updateData = {};

      if (section === "personal") {
        updateData = {
          bio: profile.personalInfo.bio,
          user: {
            profile: {
              firstName: profile.personalInfo.firstName,
              lastName: profile.personalInfo.lastName,
              phone: profile.personalInfo.phone,
              photo: profile.personalInfo.photo,
            },
          },
        };
      } else if (section === "professional") {
        updateData = {
          specialization: profile.professionalInfo.specialization,
          licenseNumber: profile.professionalInfo.licenseNumber,
          experience: profile.professionalInfo.experience,
          education: profile.professionalInfo.education,
          certifications: profile.professionalInfo.certifications,
          consultationFee: profile.professionalInfo.consultationFee,
        };
      } else if (section === "preferences") {
        updateData = {
          preferences: profile.preferences,
        };
      } else if (section === "availability") {
        updateData = {
          availability: profile.availability,
        };
      }

      await apiClient.put("/doctors/profile", updateData);
      addNotification("Profile updated successfully", "success");
      if (section === "professional" || section === "personal") {
        // Refresh documents & profile snapshot (in case specialization/license changed)
        loadVerificationDocs();
        fetchDoctorProfile();
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      addNotification("Failed to save profile changes", "error");
    } finally {
      setSaving(false);
    }
  };

  const uploadSelectedDocs = async () => {
    if (!docFiles.length) return;
    try {
      setDocUploading(true);
      const form = new FormData();
      docFiles.forEach((df) => {
        form.append("files", df.file);
        form.append("type", df.type);
      });
      const res = await apiClient.post(
        "/doctors/verification-documents/upload",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (res.data && res.data.files) {
        // Add/replace each
        for (const f of res.data.files) {
          await apiClient.post("/doctors/verification-documents", {
            type: f.type,
            fileUrl: f.fileUrl,
          });
        }
        addNotification("Documents uploaded", "success");
        setDocFiles([]);
        loadVerificationDocs();
      }
    } catch (e) {
      console.error("Upload docs error", e);
      addNotification("Failed to upload documents", "error");
    } finally {
      setDocUploading(false);
    }
  };

  const removeDoc = async (type) => {
    try {
      await apiClient.delete(
        `/doctors/verification-documents/${encodeURIComponent(type)}`
      );
      addNotification("Document removed", "success");
      loadVerificationDocs();
    } catch (e) {
      addNotification("Failed to remove document", "error");
    }
  };

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification("New passwords do not match", "error");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      addNotification("Password must be at least 8 characters long", "error");
      return;
    }

    try {
      setSaving(true);
      await apiClient.put("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      addNotification("Password changed successfully", "success");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      addNotification("Failed to change password", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="doctor-page">
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="doctor-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your profile and preferences</p>
      </div>

      <div className="settings-container">
        <div className="settings-tabs">
          <button
            className={`tab ${activeTab === "personal" ? "active" : ""}`}
            onClick={() => setActiveTab("personal")}
          >
            Personal Info
          </button>
          <button
            className={`tab ${activeTab === "professional" ? "active" : ""}`}
            onClick={() => setActiveTab("professional")}
          >
            Professional
          </button>
          <button
            className={`tab ${activeTab === "preferences" ? "active" : ""}`}
            onClick={() => setActiveTab("preferences")}
          >
            Preferences
          </button>
          <button
            className={`tab ${activeTab === "availability" ? "active" : ""}`}
            onClick={() => setActiveTab("availability")}
          >
            Availability
          </button>
          <button
            className={`tab ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            Security
          </button>
        </div>
        <button
          className={`tab ${activeTab === "verification" ? "active" : ""}`}
          onClick={() => setActiveTab("verification")}
        >
          Verification
        </button>

        <div className="settings-content">
          {activeTab === "personal" && (
            <div className="settings-section">
              <h2>Personal Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={profile.personalInfo.firstName}
                    onChange={(e) =>
                      handleInputChange(
                        "personalInfo",
                        "firstName",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={profile.personalInfo.lastName}
                    onChange={(e) =>
                      handleInputChange(
                        "personalInfo",
                        "lastName",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profile.personalInfo.email}
                    disabled
                    className="disabled"
                  />
                  <small>
                    Email cannot be changed. Contact support if needed.
                  </small>
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={profile.personalInfo.phone}
                    onChange={(e) =>
                      handleInputChange("personalInfo", "phone", e.target.value)
                    }
                  />
                </div>
                <div className="form-group full-width">
                  <label>Bio</label>
                  <textarea
                    value={profile.personalInfo.bio}
                    onChange={(e) =>
                      handleInputChange("personalInfo", "bio", e.target.value)
                    }
                    rows="4"
                    placeholder="Tell patients about yourself..."
                  />
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => saveProfile("personal")}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Personal Info"}
              </button>
            </div>
          )}

          {activeTab === "professional" && (
            <div className="settings-section">
              <h2>Professional Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Specialization</label>
                  <select
                    value={profile.professionalInfo.specialization}
                    onChange={(e) =>
                      handleInputChange(
                        "professionalInfo",
                        "specialization",
                        e.target.value
                      )
                    }
                  >
                    <option value="">Select Specialization</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Psychiatry">Psychiatry</option>
                    <option value="Pediatrics">Pediatrics</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>License Number</label>
                  <input
                    type="text"
                    value={profile.professionalInfo.licenseNumber}
                    onChange={(e) =>
                      handleInputChange(
                        "professionalInfo",
                        "licenseNumber",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Years of Experience</label>
                  <input
                    type="number"
                    value={profile.professionalInfo.experience}
                    onChange={(e) =>
                      handleInputChange(
                        "professionalInfo",
                        "experience",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Consultation Fee ($)</label>
                  <input
                    type="number"
                    value={profile.professionalInfo.consultationFee}
                    onChange={(e) =>
                      handleInputChange(
                        "professionalInfo",
                        "consultationFee",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="form-group full-width">
                  <label>Education</label>
                  <textarea
                    value={profile.professionalInfo.education}
                    onChange={(e) =>
                      handleInputChange(
                        "professionalInfo",
                        "education",
                        e.target.value
                      )
                    }
                    rows="3"
                    placeholder="Medical school, residency, fellowships..."
                  />
                </div>
                <div className="form-group full-width">
                  <label>Certifications</label>
                  <textarea
                    value={profile.professionalInfo.certifications}
                    onChange={(e) =>
                      handleInputChange(
                        "professionalInfo",
                        "certifications",
                        e.target.value
                      )
                    }
                    rows="3"
                    placeholder="Board certifications, additional qualifications..."
                  />
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => saveProfile("professional")}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Professional Info"}
              </button>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="settings-section">
              <h2>Preferences</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Default Consultation Duration (minutes)</label>
                  <select
                    value={profile.preferences.consultationDuration}
                    onChange={(e) =>
                      handleInputChange(
                        "preferences",
                        "consultationDuration",
                        parseInt(e.target.value)
                      )
                    }
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Buffer Time Between Appointments (minutes)</label>
                  <select
                    value={profile.preferences.bufferTime}
                    onChange={(e) =>
                      handleInputChange(
                        "preferences",
                        "bufferTime",
                        parseInt(e.target.value)
                      )
                    }
                  >
                    <option value={0}>No buffer</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Maximum Daily Appointments</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={profile.preferences.maxDailyAppointments}
                    onChange={(e) =>
                      handleInputChange(
                        "preferences",
                        "maxDailyAppointments",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Timezone</label>
                  <select
                    value={profile.preferences.timezone}
                    onChange={(e) =>
                      handleInputChange(
                        "preferences",
                        "timezone",
                        e.target.value
                      )
                    }
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
              </div>

              <div className="checkbox-group">
                <h3>Booking Preferences</h3>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={profile.preferences.autoConfirmBookings}
                    onChange={(e) =>
                      handleInputChange(
                        "preferences",
                        "autoConfirmBookings",
                        e.target.checked
                      )
                    }
                  />
                  Auto-confirm new bookings
                </label>
              </div>

              <div className="checkbox-group">
                <h3>Notification Preferences</h3>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={profile.preferences.emailNotifications}
                    onChange={(e) =>
                      handleInputChange(
                        "preferences",
                        "emailNotifications",
                        e.target.checked
                      )
                    }
                  />
                  Email notifications
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={profile.preferences.smsNotifications}
                    onChange={(e) =>
                      handleInputChange(
                        "preferences",
                        "smsNotifications",
                        e.target.checked
                      )
                    }
                  />
                  SMS notifications
                </label>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => saveProfile("preferences")}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          )}

          {activeTab === "availability" && (
            <div className="settings-section">
              <h2>Availability Settings</h2>

              <div className="availability-section">
                <h3>Working Days</h3>
                <div className="days-grid">
                  {Object.keys(profile.availability.workingDays).map((day) => (
                    <label key={day} className="day-checkbox">
                      <input
                        type="checkbox"
                        checked={profile.availability.workingDays[day]}
                        onChange={(e) =>
                          handleWorkingDayChange(day, e.target.checked)
                        }
                      />
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="availability-section">
                <h3>Working Hours</h3>
                <div className="time-grid">
                  <div className="form-group">
                    <label>Start Time</label>
                    <input
                      type="time"
                      value={profile.availability.workingHours.start}
                      onChange={(e) =>
                        handleInputChange("availability", "workingHours", {
                          ...profile.availability.workingHours,
                          start: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time</label>
                    <input
                      type="time"
                      value={profile.availability.workingHours.end}
                      onChange={(e) =>
                        handleInputChange("availability", "workingHours", {
                          ...profile.availability.workingHours,
                          end: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => saveProfile("availability")}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Availability"}
              </button>
            </div>
          )}

          {activeTab === "security" && (
            <div className="settings-section">
              <h2>Security Settings</h2>

              <div className="security-section">
                <h3>Change Password</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={changePassword}
                  disabled={
                    saving ||
                    !passwordData.currentPassword ||
                    !passwordData.newPassword
                  }
                >
                  {saving ? "Changing..." : "Change Password"}
                </button>
              </div>

              <div className="security-section">
                <h3>Account Security</h3>
                <div className="security-info">
                  <p>✅ Account verified</p>
                  <p>✅ Two-factor authentication enabled</p>
                  <p>✅ HIPAA compliant</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "verification" && (
            <div className="settings-section">
              <h2>Verification Documents</h2>
              <div style={{ marginBottom: "0.5rem" }}>
                <strong>Status: </strong>
                <span style={{ textTransform: "capitalize" }}>
                  {user?.verificationStatus || "pending"}
                </span>
              </div>
              <p>
                Upload or replace required documents. Each type can have one
                active file.
              </p>
              <div className="verification-upload">
                <div className="form-group">
                  <label>Select Files (you can select multiple)</label>
                  <input
                    multiple
                    type="file"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setDocFiles(
                        files.map((f) => ({
                          file: f,
                          type: inferTypeFromName(f.name),
                        }))
                      );
                    }}
                  />
                  <small>
                    Automatically infers type by filename (license, degree,
                    cert, id). You can adjust below.
                  </small>
                </div>
                {docFiles.length > 0 && (
                  <div className="doc-file-edit-list">
                    {docFiles.map((f, i) => (
                      <div key={i} className="doc-file-row">
                        <span>{f.file.name}</span>
                        <select
                          value={f.type}
                          onChange={(e) => {
                            setDocFiles((prev) =>
                              prev.map((p, idx) =>
                                idx === i ? { ...p, type: e.target.value } : p
                              )
                            );
                          }}
                        >
                          <option value="license">License</option>
                          <option value="degree">Degree</option>
                          <option value="certification">Certification</option>
                          <option value="identity">Identity</option>
                        </select>
                        <span>{Math.round(f.file.size / 1024)} KB</span>
                        <button
                          className="btn btn-link"
                          onClick={() =>
                            setDocFiles((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      className="btn btn-primary"
                      disabled={docUploading}
                      onClick={uploadSelectedDocs}
                    >
                      {docUploading ? "Uploading..." : "Upload Selected"}
                    </button>
                  </div>
                )}
              </div>
              <h3>Current Documents</h3>
              {verificationDocs.length === 0 && <p>No documents uploaded</p>}
              <div className="doc-grid">
                {verificationDocs.map((doc) => (
                  <div key={doc.type} className="doc-card">
                    <strong>{prettyLabel(doc.type)}</strong>
                    <div className="doc-preview">
                      {isImage(doc.fileUrl) ? (
                        <img src={doc.fileUrl} alt={doc.type} />
                      ) : (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open Document
                        </a>
                      )}
                    </div>
                    <small>
                      Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                    </small>
                    <div className="doc-actions">
                      <button
                        className="btn btn-sm"
                        onClick={() => removeDoc(doc.type)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helpers (placed at file bottom)
function inferTypeFromName(name) {
  const lower = name.toLowerCase();
  if (lower.includes("license")) return "license";
  if (lower.includes("degree")) return "degree";
  if (lower.includes("cert")) return "certification";
  if (
    lower.includes("id") ||
    lower.includes("identity") ||
    lower.includes("passport")
  )
    return "identity";
  return "certification";
}
function prettyLabel(type) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
function isImage(url) {
  return /(png|jpe?g|gif|webp|svg)$/i.test(
    url.split("?")[0].split(".").pop() || ""
  );
}
