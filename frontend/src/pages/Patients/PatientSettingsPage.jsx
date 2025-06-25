import React, { useState, useEffect } from 'react';
import './PatientSettingsPage.css';

const PatientSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Profile Settings
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1990-05-15',
    gender: 'male',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    emergencyContact: 'Jane Doe',
    emergencyPhone: '+1 (555) 987-6543'
  });

  // Medical Information
  const [medicalData, setMedicalData] = useState({
    bloodType: 'O+',
    allergies: 'Penicillin, Shellfish',
    medications: 'Lisinopril 10mg daily',
    medicalConditions: 'Hypertension',
    primaryDoctor: 'Dr. Sarah Johnson',
    insurance: 'Blue Cross Blue Shield',
    policyNumber: 'BC123456789'
  });

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    appointmentReminders: true,
    emailNotifications: true,
    smsNotifications: false,
    medicationReminders: true,
    healthTips: true,
    marketingEmails: false
  });

  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    shareDataWithDoctors: true,
    allowDataAnalytics: false,
    shareWithInsurance: true,
    publicProfile: false
  });

  // Security Settings
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorAuth: false
  });

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMedicalChange = (field, value) => {
    setMedicalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (field, value) => {
    setNotifications(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePrivacyChange = (field, value) => {
    setPrivacy(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSecurityChange = (field, value) => {
    setSecurity(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveSettings = async (section) => {
    try {
      setLoading(true);
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveMessage(`${section} settings saved successfully!`);
      setTimeout(() => setSaveMessage(''), 3000);
      
      if (section === 'security') {
        setSecurity(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (error) {
      setSaveMessage('Error saving settings. Please try again.');
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'medical', label: 'Medical Info', icon: '🏥' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'security', label: 'Security', icon: '🛡️' }
  ];

  return (
    <div className="patient-settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account preferences and information</p>
      </div>

      {saveMessage && (
        <div className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
          {saveMessage}
        </div>
      )}

      <div className="settings-container">
        <div className="settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="settings-content">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>Profile Information</h2>
              <form onSubmit={(e) => { e.preventDefault(); saveSettings('profile'); }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      value={profileData.gender}
                      onChange={(e) => handleProfileChange('gender', e.target.value)}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
                
                <h3>Address Information</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Address</label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => handleProfileChange('address', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={profileData.city}
                      onChange={(e) => handleProfileChange('city', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={profileData.state}
                      onChange={(e) => handleProfileChange('state', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>ZIP Code</label>
                    <input
                      type="text"
                      value={profileData.zipCode}
                      onChange={(e) => handleProfileChange('zipCode', e.target.value)}
                    />
                  </div>
                </div>

                <h3>Emergency Contact</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Contact Name</label>
                    <input
                      type="text"
                      value={profileData.emergencyContact}
                      onChange={(e) => handleProfileChange('emergencyContact', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Phone</label>
                    <input
                      type="tel"
                      value={profileData.emergencyPhone}
                      onChange={(e) => handleProfileChange('emergencyPhone', e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </div>
          )}

          {/* Medical Information */}
          {activeTab === 'medical' && (
            <div className="settings-section">
              <h2>Medical Information</h2>
              <form onSubmit={(e) => { e.preventDefault(); saveSettings('medical'); }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Blood Type</label>
                    <select
                      value={medicalData.bloodType}
                      onChange={(e) => handleMedicalChange('bloodType', e.target.value)}
                    >
                      <option value="">Select Blood Type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Primary Doctor</label>
                    <input
                      type="text"
                      value={medicalData.primaryDoctor}
                      onChange={(e) => handleMedicalChange('primaryDoctor', e.target.value)}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Allergies</label>
                    <textarea
                      value={medicalData.allergies}
                      onChange={(e) => handleMedicalChange('allergies', e.target.value)}
                      placeholder="List any allergies you have..."
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Current Medications</label>
                    <textarea
                      value={medicalData.medications}
                      onChange={(e) => handleMedicalChange('medications', e.target.value)}
                      placeholder="List your current medications..."
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Medical Conditions</label>
                    <textarea
                      value={medicalData.medicalConditions}
                      onChange={(e) => handleMedicalChange('medicalConditions', e.target.value)}
                      placeholder="List any medical conditions..."
                    />
                  </div>
                </div>

                <h3>Insurance Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Insurance Provider</label>
                    <input
                      type="text"
                      value={medicalData.insurance}
                      onChange={(e) => handleMedicalChange('insurance', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Policy Number</label>
                    <input
                      type="text"
                      value={medicalData.policyNumber}
                      onChange={(e) => handleMedicalChange('policyNumber', e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Medical Info'}
                </button>
              </form>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Preferences</h2>
              <form onSubmit={(e) => { e.preventDefault(); saveSettings('notifications'); }}>
                <div className="notification-groups">
                  <div className="notification-group">
                    <h3>Appointment Notifications</h3>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={notifications.appointmentReminders}
                          onChange={(e) => handleNotificationChange('appointmentReminders', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        Appointment reminders
                      </label>
                    </div>
                  </div>

                  <div className="notification-group">
                    <h3>Communication Preferences</h3>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={notifications.emailNotifications}
                          onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        Email notifications
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={notifications.smsNotifications}
                          onChange={(e) => handleNotificationChange('smsNotifications', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        SMS notifications
                      </label>
                    </div>
                  </div>

                  <div className="notification-group">
                    <h3>Health & Wellness</h3>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={notifications.medicationReminders}
                          onChange={(e) => handleNotificationChange('medicationReminders', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        Medication reminders
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={notifications.healthTips}
                          onChange={(e) => handleNotificationChange('healthTips', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        Health tips and articles
                      </label>
                    </div>
                  </div>

                  <div className="notification-group">
                    <h3>Marketing</h3>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={notifications.marketingEmails}
                          onChange={(e) => handleNotificationChange('marketingEmails', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        Marketing emails and promotions
                      </label>
                    </div>
                  </div>
                </div>

                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </form>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="settings-section">
              <h2>Privacy Settings</h2>
              <form onSubmit={(e) => { e.preventDefault(); saveSettings('privacy'); }}>
                <div className="privacy-groups">
                  <div className="privacy-group">
                    <h3>Data Sharing</h3>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={privacy.shareDataWithDoctors}
                          onChange={(e) => handlePrivacyChange('shareDataWithDoctors', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        Share medical data with healthcare providers
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={privacy.allowDataAnalytics}
                          onChange={(e) => handlePrivacyChange('allowDataAnalytics', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        Allow anonymized data for analytics and research
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={privacy.shareWithInsurance}
                          onChange={(e) => handlePrivacyChange('shareWithInsurance', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        Share relevant data with insurance providers
                      </label>
                    </div>
                  </div>

                  <div className="privacy-group">
                    <h3>Profile Visibility</h3>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={privacy.publicProfile}
                          onChange={(e) => handlePrivacyChange('publicProfile', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        Make profile visible to other patients (name and general info only)
                      </label>
                    </div>
                  </div>
                </div>

                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Privacy Settings'}
                </button>
              </form>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="settings-section">
              <h2>Security Settings</h2>
              <form onSubmit={(e) => { e.preventDefault(); saveSettings('security'); }}>
                <div className="security-groups">
                  <div className="security-group">
                    <h3>Change Password</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Current Password</label>
                        <input
                          type="password"
                          value={security.currentPassword}
                          onChange={(e) => handleSecurityChange('currentPassword', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>New Password</label>
                        <input
                          type="password"
                          value={security.newPassword}
                          onChange={(e) => handleSecurityChange('newPassword', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Confirm New Password</label>
                        <input
                          type="password"
                          value={security.confirmPassword}
                          onChange={(e) => handleSecurityChange('confirmPassword', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="security-group">
                    <h3>Two-Factor Authentication</h3>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={security.twoFactorAuth}
                          onChange={(e) => handleSecurityChange('twoFactorAuth', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        Enable two-factor authentication for additional security
                      </label>
                    </div>
                  </div>
                </div>

                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? 'Saving...' : 'Update Security'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientSettingsPage;
