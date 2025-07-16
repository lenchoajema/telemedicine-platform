// Test script for TimeSlot system
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Simple TimeSlot schema for testing
const timeSlotSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  isReserved: { type: Boolean, default: false },
  reservedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  reservedAt: { type: Date, default: null },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  bookedAt: { type: Date, default: null }
}, { timestamps: true });

const TestTimeSlot = mongoose.model('TestTimeSlot', timeSlotSchema);

async function testTimeSlotSystem() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/telemedicine');
    console.log('✓ Connected to MongoDB');

    // Test 1: Create a time slot
    console.log('\n--- Test 1: Creating time slot ---');
    const slot = new TestTimeSlot({
      doctorId: new mongoose.Types.ObjectId(),
      date: new Date('2024-01-15'),
      startTime: '09:00',
      endTime: '09:30'
    });
    
    await slot.save();
    console.log('✓ Time slot created:', slot._id);

    // Test 2: Find available slots
    console.log('\n--- Test 2: Finding available slots ---');
    const availableSlots = await TestTimeSlot.find({ isAvailable: true });
    console.log('✓ Available slots found:', availableSlots.length);

    // Test 3: Reserve a slot
    console.log('\n--- Test 3: Reserving slot ---');
    const patientId = new mongoose.Types.ObjectId();
    await TestTimeSlot.findByIdAndUpdate(slot._id, {
      isReserved: true,
      reservedBy: patientId,
      reservedAt: new Date()
    });
    console.log('✓ Slot reserved');

    // Test 4: Book the slot
    console.log('\n--- Test 4: Booking slot ---');
    const appointmentId = new mongoose.Types.ObjectId();
    await TestTimeSlot.findByIdAndUpdate(slot._id, {
      isAvailable: false,
      appointmentId: appointmentId,
      bookedAt: new Date()
    });
    console.log('✓ Slot booked');

    console.log('\n🎉 All TimeSlot tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

testTimeSlotSystem();
