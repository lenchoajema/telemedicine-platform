// create-sample-appointments.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Helper to resolve absolute paths to backend modules
const resolveBackendPath = (relativePath) => {
  // Using path.join for cross-platform compatibility
  return 'file:///' + path.resolve(__dirname, 'backend', 'src', relativePath);
};

const createSampleData = async () => {
  try {
    const connectDB = (await import(resolveBackendPath('modules/shared/db.js'))).default;
    const User = (await import(resolveBackendPath('models/User.js'))).default;
    const Doctor = (await import(resolveBackendPath('modules/doctors/doctor.model.js'))).default;
    const AppointmentSlot = (await import(resolveBackendPath('modules/appointment-slots/appointment-slot.model.js'))).default;
    const Appointment = (await import(resolveBackendPath('modules/appointments/appointment.model.js'))).default;

    await connectDB();

    // 1. Find a doctor and a patient
    const doctorUser = await User.findOne({ role: 'doctor' });
    const patientUser = await User.findOne({ role: 'patient' });

    if (!doctorUser || !patientUser) {
      console.log('Please create at least one doctor and one patient user.');
      return;
    }

    const doctor = await Doctor.findOne({ user: doctorUser._id });
    if (!doctor) {
        console.log('Doctor profile not found for the doctor user.');
        return;
    }

    // 2. Create a new appointment slot
    const slotDate = new Date();
    slotDate.setDate(slotDate.getDate() + 1); // Tomorrow
    const slot = new AppointmentSlot({
      doctor: doctor._id,
      date: slotDate,
      startTime: '11:00',
      endTime: '11:30',
      isAvailable: true,
    });
    await slot.save();
    console.log('Created appointment slot:', slot);

    // 3. Create a new appointment
    const appointment = new Appointment({
      doctor: doctor._id,
      patient: patientUser._id,
      date: slot.date,
      time: slot.startTime,
      timeSlot: slot._id,
      reason: 'Regular Checkup',
      symptoms: ['None'],
      caseDetails: 'Annual physical examination.',
      status: 'scheduled',
    });
    await appointment.save();
    console.log('Created appointment:', appointment);

    // 4. Mark slot as unavailable
    slot.isAvailable = false;
    await slot.save();
    console.log('Updated slot availability.');

  } catch (error) {
    console.error('Error creating sample data:', error);
    process.exit(1); // Exit with error
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('Disconnected from database.');
    }
    process.exit(0); // Exit successfully
  }
};

createSampleData();

