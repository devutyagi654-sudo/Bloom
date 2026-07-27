const axios = require('axios');

async function test() {
  try {
    console.log('Querying live Render base URL...');
    const res = await axios.get('https://bloom-backend.onrender.com/');
    console.log('Response:', res.status, res.data);
  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    }
  }
}

test();
