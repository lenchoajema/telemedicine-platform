import User from '../auth/user.model.js';
import Appointment from '../appointments/appointment.model.js';
import Doctor from '../doctors/doctor.model.js';
import mongoose from 'mongoose';

// Get date range based on query parameter
const getDateRange = (range = 'month') => {
  const now = new Date();
  const endDate = now;
  let startDate;
  
  switch(range) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1); // Default to last month
  }
  
  return { startDate, endDate };
};

// Generate reports data for admin dashboard
export const getReports = async (req, res) => {
  try {
    const { range } = req.query;
    const { startDate, endDate } = getDateRange(range);
    
    // Get user registrations within the date range
    const registrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1
        }
      }
    ]);
    
    // Format registrations data for charting
    const formattedRegistrations = registrations.map(item => ({
      date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
      role: item._id.role,
      count: item.count
    }));
    
    // Get appointment data within the date range
    const appointments = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1
        }
      }
    ]);
    
    // Format appointment data for charting
    const formattedAppointments = appointments.map(item => ({
      date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
      status: item._id.status,
      count: item.count
    }));
    
    // Get verification requests data
    const verifications = await Doctor.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
            status: '$verificationStatus'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1
        }
      }
    ]);
    
    // Format verifications data for charting
    const formattedVerifications = verifications.map(item => ({
      date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
      status: item._id.status,
      count: item.count
    }));
    
    // Get summary statistics
    const summary = {
      userRegistrations: await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      doctorRegistrations: await User.countDocuments({ role: 'doctor', createdAt: { $gte: startDate, $lte: endDate } }),
      patientRegistrations: await User.countDocuments({ role: 'patient', createdAt: { $gte: startDate, $lte: endDate } }),
      appointmentsTotal: await Appointment.countDocuments({ date: { $gte: startDate, $lte: endDate } }),
      appointmentsCompleted: await Appointment.countDocuments({ 
        date: { $gte: startDate, $lte: endDate },
        status: 'completed'
      })
    };
    
    res.status(200).json({
      timeRange: range,
      summary,
      registrations: formattedRegistrations,
      appointments: formattedAppointments,
      verifications: formattedVerifications
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ error: 'Failed to generate reports' });
  }
};

// Generate export data for reports
export const exportReportData = async (req, res) => {
  try {
    const { reportType, range } = req.query;
    const { startDate, endDate } = getDateRange(range);
    
    let exportData;
    
    switch(reportType) {
      case 'users':
        exportData = await User.find({ 
          createdAt: { $gte: startDate, $lte: endDate } 
        })
        .select('email profile.firstName profile.lastName role createdAt status')
        .sort({ createdAt: -1 });
        break;
        
      case 'appointments':
        exportData = await Appointment.find({ 
          date: { $gte: startDate, $lte: endDate } 
        })
        .populate('patient', 'profile.firstName profile.lastName email')
        .populate('doctor', 'profile.firstName profile.lastName email')
        .select('date status duration')
        .sort({ date: -1 });
        
        // Format the data for export
        exportData = exportData.map(appt => ({
          date: appt.date,
          status: appt.status,
          duration: appt.duration,
          patientName: appt.patient ? `${appt.patient.profile.firstName} ${appt.patient.profile.lastName}` : 'Unknown',
          patientEmail: appt.patient ? appt.patient.email : '',
          doctorName: appt.doctor ? `${appt.doctor.profile.firstName} ${appt.doctor.profile.lastName}` : 'Unknown',
          doctorEmail: appt.doctor ? appt.doctor.email : ''
        }));
        break;
        
      case 'verifications':
        exportData = await Doctor.find({ 
          createdAt: { $gte: startDate, $lte: endDate } 
        })
        .populate('user', 'profile.firstName profile.lastName email')
        .select('specialization licenseNumber verificationStatus createdAt')
        .sort({ createdAt: -1 });
        
        // Format the data for export
        exportData = exportData.map(doc => ({
          doctorName: doc.user ? `${doc.user.profile.firstName} ${doc.user.profile.lastName}` : 'Unknown',
          email: doc.user ? doc.user.email : '',
          specialization: doc.specialization,
          licenseNumber: doc.licenseNumber,
          status: doc.verificationStatus,
          submittedDate: doc.createdAt
        }));
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }
    
    res.status(200).json({
      reportType,
      timeRange: range,
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting reports:', error);
    res.status(500).json({ error: 'Failed to export report data' });
  }
};
