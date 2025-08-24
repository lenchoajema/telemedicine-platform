// debug-my-patients.js
// Script to call the My Patients endpoint and log results

require('dotenv').config();
const axios = require('axios');

async function main() {
  const token = process.argv[2];
  if (!token) {
    console.error('Usage: node debug-my-patients.js <doctor_jwt_token>');
    process.exit(1);
  }
  const apiBase = process.env.VITE_API_URL || 'http://localhost:5000/api';
  try {
    const response = await axios.get(`${apiBase}/doctors/my-patients`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('My Patients response:', response.data);
  } catch (err) {
    console.error('Error fetching my patients:', err.response?.data || err.message);
  }
}

main();
