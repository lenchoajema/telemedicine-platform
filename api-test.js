// Simple script to test API connectivity
const apiUrl = 'http://localhost:5000/api/health';

fetch(apiUrl)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('✅ API connection successful!');
    console.log('Response:', data);
  })
  .catch(error => {
    console.error('❌ API connection failed:', error.message);
  });
