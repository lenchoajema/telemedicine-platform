import User from '../auth/user.model.js';
import Doctor from '../doctors/doctor.model.js';
import Appointment from '../appointments/appointment.model.js';
import Settings from './settings.model.js';

// Get admin dashboard overview
export const getDashboardOverview = async (req, res) => {
  try {
    // Get current date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    
    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thisMonth }
    });
    
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Appointment statistics
    const totalAppointments = await Appointment.countDocuments();
    const appointmentsToday = await Appointment.countDocuments({
      date: { 
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    const appointmentsThisWeek = await Appointment.countDocuments({
      date: { $gte: thisWeek }
    });
    const appointmentsThisMonth = await Appointment.countDocuments({
      date: { $gte: thisMonth }
    });
    
    const appointmentsByStatus = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Doctor statistics
    const totalDoctors = await Doctor.countDocuments();
    const verifiedDoctors = await Doctor.countDocuments({ verificationStatus: 'verified' });
    const pendingVerifications = await Doctor.countDocuments({ verificationStatus: 'pending' });
    
    // Recent activity
    const recentUsers = await User.find()
      .select('email role firstName lastName createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
      
    const recentAppointments = await Appointment.find()
      .populate('patient', 'firstName lastName email')
      .populate('doctor', 'firstName lastName email')
      .select('date status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // System health
    const systemHealth = {
      database: 'healthy',
      server: 'healthy',
      lastBackup: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Mock data
      uptime: process.uptime()
    };
    
    res.status(200).json({
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      appointments: {
        total: totalAppointments,
        today: appointmentsToday,
        thisWeek: appointmentsThisWeek,
        thisMonth: appointmentsThisMonth,
        byStatus: appointmentsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      doctors: {
        total: totalDoctors,
        verified: verifiedDoctors,
        pendingVerification: pendingVerifications
      },
      recentActivity: {
        users: recentUsers,
        appointments: recentAppointments
      },
      systemHealth
    });
  } catch (error) {
    console.log('Error fetching dashboard overview:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
};

// Get system logs (mock implementation)
export const getSystemLogs = async (req, res) => {
  try {
    const { level = 'all', limit = 100, page = 1 } = req.query;
    
    // Mock system logs - in production, this would fetch from logging service
    const logs = [
      {
        id: 1,
        timestamp: new Date(),
        level: 'info',
        message: 'User login successful: admin@telemedicine.com',
        module: 'auth',
        userId: req.user._id
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        level: 'warning',
        message: 'Failed login attempt: unknown@email.com',
        module: 'auth',
        ip: '192.168.1.100'
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        level: 'info',
        message: 'New user registered: patient@test.com',
        module: 'registration',
        userId: 'user123'
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        level: 'error',
        message: 'Database connection timeout',
        module: 'database',
        details: 'Connection pool exhausted'
      }
    ];
    
    const filteredLogs = level === 'all' ? logs : logs.filter(log => log.level === level);
    const startIndex = (page - 1) * limit;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + limit);
    
    res.status(200).json({
      logs: paginatedLogs,
      pagination: {
        total: filteredLogs.length,
        page: parseInt(page),
        pages: Math.ceil(filteredLogs.length / limit)
      }
    });
  } catch (error) {
    console.log('Error fetching system logs:', error);
    res.status(500).json({ error: 'Failed to fetch system logs' });
  }
};

// Backup database
export const createBackup = async (req, res) => {
  try {
    // Mock backup creation - in production, implement actual backup logic
    const backupId = `backup_${Date.now()}`;
    const backupDate = new Date();
    
    // Simulate backup process
    setTimeout(async () => {
      // Here you would implement actual backup logic
      console.log(`Backup ${backupId} completed successfully`);
    }, 2000);
    
    res.status(200).json({
      message: 'Backup initiated successfully',
      backupId,
      startTime: backupDate,
      status: 'in_progress'
    });
  } catch (error) {
    console.log('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
};

// Get backup history
export const getBackupHistory = async (req, res) => {
  try {
    // Mock backup history - in production, fetch from backup service
    const backups = [
      {
        id: 'backup_1703876400000',
        date: new Date('2024-01-01'),
        size: '125 MB',
        status: 'completed',
        type: 'scheduled'
      },
      {
        id: 'backup_1703790000000',
        date: new Date('2023-12-31'),
        size: '123 MB',
        status: 'completed',
        type: 'manual'
      }
    ];
    
    res.status(200).json({ backups });
  } catch (error) {
    console.log('Error fetching backup history:', error);
    res.status(500).json({ error: 'Failed to fetch backup history' });
  }
};

// System maintenance mode
export const setMaintenanceMode = async (req, res) => {
  try {
    const { enabled, message } = req.body;
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    settings.platform.maintenanceMode = enabled;
    settings.platform.maintenanceMessage = message || 'System is under maintenance. Please try again later.';
    settings.updatedAt = new Date();
    
    await settings.save();
    
    res.status(200).json({
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
      maintenanceMode: enabled,
      maintenanceMessage: settings.platform.maintenanceMessage
    });
  } catch (error) {
    console.log('Error setting maintenance mode:', error);
    res.status(500).json({ error: 'Failed to set maintenance mode' });
  }
};

// Send system announcement
export const sendSystemAnnouncement = async (req, res) => {
  try {
    const { title, message, targetAudience = 'all', priority = 'normal' } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }
    
    // Build user query based on target audience
    let userQuery = {};
    if (targetAudience !== 'all') {
      userQuery.role = targetAudience;
    }
    
    const users = await User.find(userQuery).select('email firstName lastName');
    
    // Mock announcement sending - in production, implement actual notification service
    const announcement = {
      id: `announcement_${Date.now()}`,
      title,
      message,
      targetAudience,
      priority,
      sentTo: users.length,
      sentAt: new Date(),
      sentBy: req.user._id
    };
    
    // Simulate sending process
    setTimeout(() => {
      console.log(`Announcement "${title}" sent to ${users.length} users`);
    }, 1000);
    
    res.status(200).json({
      message: 'Announcement sent successfully',
      announcement
    });
  } catch (error) {
    console.log('Error sending announcement:', error);
    res.status(500).json({ error: 'Failed to send announcement' });
  }
};

// Clear system cache
export const clearSystemCache = async (req, res) => {
  try {
    // Mock cache clearing - in production, implement actual cache clearing logic
    const cacheTypes = ['user_sessions', 'api_responses', 'static_assets'];
    const clearedCache = {};
    
    for (const cacheType of cacheTypes) {
      // Simulate cache clearing
      clearedCache[cacheType] = Math.floor(Math.random() * 1000) + ' items cleared';
    }
    
    res.status(200).json({
      message: 'System cache cleared successfully',
      clearedCache,
      clearedAt: new Date()
    });
  } catch (error) {
    console.log('Error clearing system cache:', error);
    res.status(500).json({ error: 'Failed to clear system cache' });
  }
};

// Export user data (for compliance/backup)
export const exportUserData = async (req, res) => {
  try {
    const { format = 'json', includeAppointments = true } = req.query;
    
    // Get all users
    const users = await User.find()
      .select('-password')
      .populate('profile');
    
    let exportData = { users };
    
    // Include appointments if requested
    if (includeAppointments) {
      const appointments = await Appointment.find()
        .populate('patient', 'email firstName lastName')
        .populate('doctor', 'email firstName lastName');
      exportData.appointments = appointments;
    }
    
    // Add export metadata
    exportData.exportedAt = new Date();
    exportData.exportedBy = req.user.email;
    exportData.totalRecords = users.length;
    
    if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csvData = users.map(user => ({
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        createdAt: user.createdAt
      }));
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
      
      // Simple CSV conversion
      const headers = Object.keys(csvData[0]).join(',');
      const rows = csvData.map(row => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');
      
      return res.send(csv);
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=users_export.json');
    res.status(200).json(exportData);
  } catch (error) {
    console.log('Error exporting user data:', error);
    res.status(500).json({ error: 'Failed to export user data' });
  }
};
