const jwt = require('jsonwebtoken');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function run() {
  // Use correct JWT_SECRET from .env
  const token = jwt.sign(
    { id: 'admin' }, 
    'blm_premium_luxury_ecommerce_secret_key_2026'
  );

  console.log('Generated Admin Token:', token);

  const form = new FormData();
  
  // Create a dummy image file
  const dummyFile = path.join(__dirname, 'temp_test.png');
  fs.writeFileSync(dummyFile, 'dummy content');
  
  form.append('banners', fs.createReadStream(dummyFile), {
    filename: 'temp_test.png',
    contentType: 'image/png'
  });

  try {
    const res = await axios.post('http://localhost:5000/api/admin/banner', form, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders()
      }
    });
    console.log('API Status:', res.status);
    console.log('API Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('API Error Code:', err.response?.status);
    console.error('API Error Response:', JSON.stringify(err.response?.data, null, 2));
  } finally {
    if (fs.existsSync(dummyFile)) {
      fs.unlinkSync(dummyFile);
    }
  }
}

run();
