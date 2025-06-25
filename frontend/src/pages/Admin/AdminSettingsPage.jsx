import React, { useState, useEffect } from 'react';
import './AdminSettingsPage.css';

const AdminSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('platform');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Platform Settings
  const [platformSettings, setPlatformSettings] = useState({
    siteName: 'TeleMed Platform',
    siteDescription: 'Modern telemedicine platform for healthcare providers',
    allowRegistration: true,
    requireEmailVerification: true,
    enableVideoCalss: true,
    maintenanceMode: false,
    maxAppointmentsPerDay: 50,
    appointmentDuration: 30,
    timeZone: 'America/New_York'
  });

  // User Management Settings
  const [userSettings, setUserSettings] = useState({
    autoApprovePatients: true,
    requireDoctorVerification: true,
    sessionTimeout: 60,
    passwordComplexity: 'medium',
    maxLoginAttempts: 5,
    lockoutDuration: 30
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    adminNotifications: true,
    systemAlerts: true,
    appointmentReminders: true,
    marketingEmails: false
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    acceptPayments: true,
    paymentProvider: 'stripe',
    currency: 'USD',
    consultationFee: 75,
    platformFee: 10,
    refundPolicy: 'Within 24 hours',
    autoRefunds: false
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    enableTwoFactor: false,
    requireHttps: true,
    enableAuditLogs: true,
    dataRetentionDays: 365,
    enableBackups: true,
    backupFrequency: 'daily',
    encryptSensitiveData: true
  });

  const handlePlatformChange = (field, value) => {
    setPlatformSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUserChange = (field, value) => {
    setUserSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (field, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePaymentChange = (field, value) => {
    setPaymentSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSecurityChange = (field, value) => {
    setSecuritySettings(prev => ({
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
    } catch (error) {
      setSaveMessage('Error saving settings. Please try again.');
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'platform', label: 'Platform', icon: '⚙️' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'security', label: 'Security', icon: '🔒' }
  ];

  return (
    <div className="admin-settings-page">
      <div className="page-header">
        <h1>Admin Settings</h1>
        <p>Configure platform settings and preferences</p>
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
          {/* Platform Settings */}
          {activeTab === 'platform' && (
            <div className="settings-section">
              <h2>Platform Configuration</h2>
              <form onSubmit={(e) => { e.preventDefault(); saveSettings('platform'); }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Site Name</label>
                    <input
                      type="text"
                      value={platformSettings.siteName}
                      onChange={(e) => handlePlatformChange('siteName', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Time Zone</label>
                    <select
                      value={platformSettings.timeZone}
                      onChange={(e) => handlePlatformChange('timeZone', e.target.value)}
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Site Description</label>
                    <textarea
                      value={platformSettings.siteDescription}
                      onChange={(e) => handlePlatformChange('siteDescription', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Appointments Per Day</label>
                    <input
                      type="number"
                      value={platformSettings.maxAppointmentsPerDay}
                      onChange={(e) => handlePlatformChange('maxAppointmentsPerDay', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Default Appointment Duration (minutes)</label>
                    <select
                      value={platformSettings.appointmentDuration}
                      onChange={(e) => handlePlatformChange('appointmentDuration', parseInt(e.target.value))}
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                    </select>
                  </div>
                </div>

                <h3>Feature Toggles</h3>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={platformSettings.allowRegistration}
                      onChange={(e) => handlePlatformChange('allowRegistration', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Allow new user registration
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={platformSettings.requireEmailVerification}
                      onChange={(e) => handlePlatformChange('requireEmailVerification', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Require email verification
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={platformSettings.enableVideoCalss}
                      onChange={(e) => handlePlatformChange('enableVideoCalss', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Enable video calls
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={platformSettings.maintenanceMode}
                      onChange={(e) => handlePlatformChange('maintenanceMode', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Maintenance mode
                  </label>
                </div>

                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Platform Settings'}
                </button>
              </form>
            </div>
          )}

          {/* User Management Settings */}
          {activeTab === 'users' && (
            <div className="settings-section">
              <h2>User Management</h2>
              <form onSubmit={(e) => { e.preventDefault(); saveSettings('user management'); }}>
                <h3>User Approval</h3>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={userSettings.autoApprovePatients}
                      onChange={(e) => handleUserChange('autoApprovePatients', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Auto-approve patient registrations
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={userSettings.requireDoctorVerification}
                      onChange={(e) => handleUserChange('requireDoctorVerification', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Require manual verification for doctors
                  </label>
                </div>

                <h3>Security Policies</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={userSettings.sessionTimeout}
                      onChange={(e) => handleUserChange('sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Password Complexity</label>
                    <select
                      value={userSettings.passwordComplexity}
                      onChange={(e) => handleUserChange('passwordComplexity', e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Max Login Attempts</label>
                    <input
                      type="number"
                      value={userSettings.maxLoginAttempts}
                      onChange={(e) => handleUserChange('maxLoginAttempts', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Lockout Duration (minutes)</label>
                    <input
                      type="number"
                      value={userSettings.lockoutDuration}
                      onChange={(e) => handleUserChange('lockoutDuration', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? 'Saving...' : 'Save User Settings'}
                </button>
              </form>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Configuration</h2>
              <form onSubmit={(e) => { e.preventDefault(); saveSettings('notification'); }}>
                <h3>Communication Channels</h3>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailEnabled}
                      onChange={(e) => handleNotificationChange('emailEnabled', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Email notifications
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.smsEnabled}
                      onChange={(e) => handleNotificationChange('smsEnabled', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    SMS notifications
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.pushEnabled}
                      onChange={(e) => handleNotificationChange('pushEnabled', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Push notifications
                  </label>
                </div>

                <h3>Notification Types</h3>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.adminNotifications}
                      onChange={(e) => handleNotificationChange('adminNotifications', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Admin notifications
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.systemAlerts}
                      onChange={(e) => handleNotificationChange('systemAlerts', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    System alerts
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.appointmentReminders}
                      onChange={(e) => handleNotificationChange('appointmentReminders', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Appointment reminders
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.marketingEmails}
                      onChange={(e) => handleNotificationChange('marketingEmails', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Marketing emails
                  </label>
                </div>

                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Notification Settings'}
                </button>
              </form>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === 'payments' && (
            <div className="settings-section">
              <h2>Payment Configuration</h2>
              <form onSubmit={(e) => { e.preventDefault(); saveSettings('payment'); }}>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={paymentSettings.acceptPayments}
                      onChange={(e) => handlePaymentChange('acceptPayments', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Accept online payments
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={paymentSettings.autoRefunds}
                      onChange={(e) => handlePaymentChange('autoRefunds', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Enable automatic refunds
                  </label>
                </div>

                {paymentSettings.acceptPayments && (
                  <>
                    <h3>Payment Configuration</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Payment Provider</label>
                        <select
                          value={paymentSettings.paymentProvider}
                          onChange={(e) => handlePaymentChange('paymentProvider', e.target.value)}
                        >
                          <option value="stripe">Stripe</option>
                          <option value="paypal">PayPal</option>
                          <option value="square">Square</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Currency</label>
                        <select
                          value={paymentSettings.currency}
                          onChange={(e) => handlePaymentChange('currency', e.target.value)}
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="CAD">CAD</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Default Consultation Fee</label>
                        <input
                          type="number"
                          value={paymentSettings.consultationFee}
                          onChange={(e) => handlePaymentChange('consultationFee', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Platform Fee (%)</label>
                        <input
                          type="number"
                          value={paymentSettings.platformFee}
                          onChange={(e) => handlePaymentChange('platformFee', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Refund Policy</label>
                        <textarea
                          value={paymentSettings.refundPolicy}
                          onChange={(e) => handlePaymentChange('refundPolicy', e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Payment Settings'}
                </button>
              </form>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="settings-section">
              <h2>Security Configuration</h2>
              <form onSubmit={(e) => { e.preventDefault(); saveSettings('security'); }}>
                <h3>Authentication & Access</h3>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={securitySettings.enableTwoFactor}
                      onChange={(e) => handleSecurityChange('enableTwoFactor', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Enable two-factor authentication
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={securitySettings.requireHttps}
                      onChange={(e) => handleSecurityChange('requireHttps', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Require HTTPS connections
                  </label>
                </div>

                <h3>Data Protection</h3>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={securitySettings.enableAuditLogs}
                      onChange={(e) => handleSecurityChange('enableAuditLogs', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Enable audit logging
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={securitySettings.encryptSensitiveData}
                      onChange={(e) => handleSecurityChange('encryptSensitiveData', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Encrypt sensitive data
                  </label>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Data Retention (days)</label>
                    <input
                      type="number"
                      value={securitySettings.dataRetentionDays}
                      onChange={(e) => handleSecurityChange('dataRetentionDays', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <h3>Backup Configuration</h3>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={securitySettings.enableBackups}
                      onChange={(e) => handleSecurityChange('enableBackups', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Enable automatic backups
                  </label>
                </div>

                {securitySettings.enableBackups && (
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Backup Frequency</label>
                      <select
                        value={securitySettings.backupFrequency}
                        onChange={(e) => handleSecurityChange('backupFrequency', e.target.value)}
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                  </div>
                )}

                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Security Settings'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
