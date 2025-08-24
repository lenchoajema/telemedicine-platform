// create-doctor-availability.js
// Script to seed availability slots for a given doctor on a specific date

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Helper to resolve absolute paths to backend modules
const resolveBackendPath = (relativePath) =>
  'file:///' + path.resolve(__dirname, 'backend', 'src', relativePath);

async function main() {
  const [doctorId, dateStr] = process.argv.slice(2);
  if (!doctorId || !dateStr) {
    console.log('Usage: node create-doctor-availability.js <doctorId> <YYYY-MM-DD>');
    process.exit(1);
  }

  // Import DB connector and AppointmentSlot model
  const connectDB = (await import(resolveBackendPath('modules/shared/db.js'))).default;
  const AppointmentSlot = (await import(resolveBackendPath('modules/appointment-slots/appointment-slot.model.js'))).default;

  // Connect to database
  await connectDB();

  // Prepare slot date
  const [year, month, day] = dateStr.split('-').map(Number);
  const slotDate = new Date(year, month - 1, day);

  // Default time slots (each 30 minutes)
  const times = ['09:00', '10:00', '11:00', '14:00', '15:00'];
  const createdSlots = [];

  for (const startTime of times) {
    const [h, m] = startTime.split(':').map(Number);
    // Calculate end time (30 minutes later)
    const endDate = new Date(slotDate);
    endDate.setHours(h);
    endDate.setMinutes(m + 30);
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(
      endDate.getMinutes()
    ).padStart(2, '0')}`;

    const slot = new AppointmentSlot({
      doctor: doctorId,
      date: slotDate,
      startTime,
      endTime,
      isAvailable: true,
    });
    await slot.save();
    createdSlots.push(slot);
  }

  console.log(`Created ${createdSlots.length} availability slots for doctor ${doctorId} on ${dateStr}`);
  createdSlots.forEach(s => console.log(s));

  // Disconnect
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Error seeding availability slots:', err);
  process.exit(1);
});
