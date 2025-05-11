// filepath: /workspaces/telemedicine-platform/backend/src/modules/admin/stats.controller.js
import User from '../auth/user.model.js';
import Appointment from '../appointments/appointment.model.js';

export const getAdminStats = async (req, res) => {
  try {
    // Aggregate counts for users by role
    const userCounts = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    // Convert to a more usable format
    const userStats = userCounts.reduce((acc, curr) => {
      acc[`${curr._id}Count`] = curr.count;
      return acc;
    }, {});

    // Total users count
    const totalUsers = await User.countDocuments();

    // Get appointment stats
    const appointmentCounts = await Appointment.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Convert to a more usable format
    const appointmentStats = appointmentCounts.reduce((acc, curr) => {
      acc[`${curr._id}Count`] = curr.count;
      return acc;
    }, {});

    // Total appointments
    const appointmentCount = await Appointment.countDocuments();
    
    // Get pending verifications count
    const pendingVerificationsCount = await User.countDocuments({
      role: 'doctor',
      'profile.isVerified': false,
      status: 'pending'
    });

    const stats = {
      totalUsers,
      ...userStats,
      appointmentCount,
      ...appointmentStats,
      pendingVerifications: pendingVerificationsCount
    };

    res.json(stats);
  } catch (err) {
    console.error('Error getting admin stats:', err);
    res.status(500).json({ error: err.message });
  }
};