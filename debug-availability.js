// Use CommonJS requires
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
const { pathToFileURL } = require('url');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  // Use raw MongoDB driver to query slots, avoid import issues
  
  // Parse CLI args: doctorId, date, optional mongoUri
  const [doctorId, date, mongoUriArg] = process.argv.slice(2);
  if (!doctorId || !date) {
    console.log('Usage: node debug-availability.js <doctorId> <YYYY-MM-DD> [mongoUri]');
    process.exit(1);
  }

  // Connect to MongoDB
  // Determine MongoDB URI: CLI override, then default, then env vars
  const mongoUri =
    // allow passing a custom URI as third CLI arg
    mongoUriArg ||
    // respect environment variables from .env or compose
    process.env.MONGO_URI ||
    process.env.DATABASE_URL ||
    // fallback to local MongoDB on port 27018
    'mongodb://localhost:27018/telemedicine';
  if (!mongoUri) {
    console.error('Please set MONGO_URI or DATABASE_URL in your .env');
    process.exit(1);
  }
  // Connect to MongoDB (options default in current driver)
  await mongoose.connect(mongoUri);
  console.log(`
Connected to MongoDB: ${mongoUri}
`);

  // Compute local date boundaries
  const [year, month, day] = date.split('-').map(Number);
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

  // Fetch slots from 'appointmentslots' collection directly
  const { ObjectId } = mongoose.Types;
  const dbCollection = mongoose.connection.db.collection('appointmentslots');
  // DEBUG: List all slots for this doctor (no date filter)
  const allSlots = await dbCollection.find({ doctor: new ObjectId(doctorId) }).toArray();
  console.log(`All DB slots for doctor ${doctorId}:`, allSlots);
  // Now apply date filter to narrow to specific day
  const dbSlots = await dbCollection
    .find({
      doctor: new ObjectId(doctorId),
      date: { $gte: startOfDay, $lte: endOfDay },
    })
    .toArray();
  console.log(`DB slots for doctor ${doctorId} on ${date}:`, dbSlots);

  // Query the API endpoint
  const apiBase = process.env.VITE_API_URL || 'http://localhost:5000/api';
  console.log(`\nCalling API: GET ${apiBase}/appointments/available-slots?doctorId=${doctorId}&date=${date}`);
  try {
    const response = await axios.get(`${apiBase}/appointments/available-slots`, {
      params: { doctorId, date },
    });
    console.log('API response data:', response.data);
  } catch (error) {
    console.error('Error calling API:', error.response?.data || error.message);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(e => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
