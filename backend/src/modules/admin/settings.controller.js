import Settings from './settings.model.js';

// Get all admin settings
export const getAdminSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = new Settings({
        platform: {
          siteName: 'TeleMed Platform',
          siteDescription: 'Modern telemedicine platform for healthcare providers',
          allowRegistration: true,
          requireEmailVerification: true,
          enableVideoCalls: true,
          maintenanceMode: false,
          maxAppointmentsPerDay: 50,
          appointmentDuration: 30,
          timeZone: 'America/New_York'
        },
        users: {
          autoApprovePatients: true,
          requireDoctorVerification: true,
          sessionTimeout: 60,
          passwordComplexity: 'medium',
          maxLoginAttempts: 5,
          lockoutDuration: 30
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          adminNotifications: true,
          systemAlerts: true,
          appointmentReminders: true,
          marketingEmails: false
        },
        payments: {
          acceptPayments: true,
          paymentProvider: 'stripe',
          currency: 'USD',
          consultationFee: 75,
          platformFee: 10,
          refundPolicy: 'Within 24 hours',
          autoRefunds: false
        },
        security: {
          enableTwoFactor: false,
          requireHttps: true,
          enableAuditLogs: true,
          dataRetentionDays: 365,
          enableBackups: true,
          backupFrequency: 'daily',
          encryptSensitiveData: true
        }
      });
      await settings.save();
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin settings',
      error: error.message
    });
  }
};

// Update specific settings section
export const updateSettingsSection = async (req, res) => {
  try {
    const { section } = req.params;
    const updateData = req.body;
    
    const validSections = ['platform', 'users', 'notifications', 'payments', 'security'];
    
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings section'
      });
    }
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }
    
    // Update the specific section
    settings[section] = { ...settings[section], ...updateData };
    settings.updatedAt = new Date();
    
    await settings.save();
    
    res.json({
      success: true,
      message: `${section} settings updated successfully`,
      data: settings[section]
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin settings',
      error: error.message
    });
  }
};

// Reset settings to default
export const resetSettings = async (req, res) => {
  try {
    await Settings.deleteMany({});
    
    const defaultSettings = new Settings({
      platform: {
        siteName: 'TeleMed Platform',
        siteDescription: 'Modern telemedicine platform for healthcare providers',
        allowRegistration: true,
        requireEmailVerification: true,
        enableVideoCalls: true,
        maintenanceMode: false,
        maxAppointmentsPerDay: 50,
        appointmentDuration: 30,
        timeZone: 'America/New_York'
      },
      users: {
        autoApprovePatients: true,
        requireDoctorVerification: true,
        sessionTimeout: 60,
        passwordComplexity: 'medium',
        maxLoginAttempts: 5,
        lockoutDuration: 30
      },
      notifications: {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        adminNotifications: true,
        systemAlerts: true,
        appointmentReminders: true,
        marketingEmails: false
      },
      payments: {
        acceptPayments: true,
        paymentProvider: 'stripe',
        currency: 'USD',
        consultationFee: 75,
        platformFee: 10,
        refundPolicy: 'Within 24 hours',
        autoRefunds: false
      },
      security: {
        enableTwoFactor: false,
        requireHttps: true,
        enableAuditLogs: true,
        dataRetentionDays: 365,
        enableBackups: true,
        backupFrequency: 'daily',
        encryptSensitiveData: true
      }
    });
    
    await defaultSettings.save();
    
    res.json({
      success: true,
      message: 'Settings reset to defaults successfully',
      data: defaultSettings
    });
  } catch (error) {
    console.error('Error resetting admin settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset admin settings',
      error: error.message
    });
  }
};