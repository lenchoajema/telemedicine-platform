// Quick test to get a doctor ID
import mongoose from 'mongoose';
import Doctor from './backend/src/modules/doctors/doctor.model.js';

async function getDoctorId() {
  try {
    await mongoose.connect('mongodb://localhost:27017/telemedicine');
    console.log('Connected to MongoDB');
    
    const doctor = await Doctor.findOne();
    if (doctor) {
      console.log('Doctor ID:', doctor._id.toString());
      console.log('Doctor details:', doctor.user);
    } else {
      console.log('No doctors found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

getDoctorId();
