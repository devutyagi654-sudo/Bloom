const jwt = require('jsonwebtoken');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function run() {
  const token = jwt.sign(
    { id: 'admin' }, 
    'blm_premium_luxury_ecommerce_secret_key_2026'
  );

  console.log('Testing against port 5001...');

  // Scenario 1: Uploading multiple banners (we will append 'banners' twice and 'banner' once!)
  const form = new FormData();
  
  const dummyFile1 = path.join(__dirname, 'temp_test1.png');
  const dummyFile2 = path.join(__dirname, 'temp_test2.png');
  fs.writeFileSync(dummyFile1, 'dummy content 1');
  fs.writeFileSync(dummyFile2, 'dummy content 2');
  
  form.append('banners', fs.createReadStream(dummyFile1), { filename: 'temp_test1.png', contentType: 'image/png' });
  form.append('banner', fs.createReadStream(dummyFile2), { filename: 'temp_test2.png', contentType: 'image/png' });

  try {
    const res = await axios.post('http://localhost:5001/api/admin/banner', form, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders()
      }
    });
    console.log('POST Response status:', res.status);
    console.log('POST Response body:', JSON.stringify(res.data, null, 2));

    // Scenario 2: Fetch all banners
    const getRes = await axios.get('http://localhost:5001/api/banner');
    console.log('GET Response status:', getRes.status);
    console.log('GET Response banners count:', getRes.data.length);
    console.log('Banners:', JSON.stringify(getRes.data, null, 2));

    // Scenario 3: Delete the last banner
    if (getRes.data.length > 0) {
      const targetId = getRes.data[getRes.data.length - 1].id;
      const deleteRes = await axios.delete(`http://localhost:5001/api/admin/banner/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('DELETE Response status:', deleteRes.status);
      console.log('DELETE Response body:', JSON.stringify(deleteRes.data, null, 2));
    }

  } catch (err) {
    console.error('Error Code:', err.response?.status);
    console.error('Error Response:', JSON.stringify(err.response?.data, null, 2));
  } finally {
    if (fs.existsSync(dummyFile1)) fs.unlinkSync(dummyFile1);
    if (fs.existsSync(dummyFile2)) fs.unlinkSync(dummyFile2);
  }
}

run();
