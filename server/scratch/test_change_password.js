require('dotenv').config();
const axios = require('axios');
const { exec } = require('child_process');
const path = require('path');
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: 'admin', role: 'ADMIN' },
  process.env.JWT_SECRET || 'blc_premium_luxury_ecommerce_secret_key_2026',
  { expiresIn: '1h' }
);

async function runTest() {
  console.log('Starting local test server on PORT 5001...');
  const env = { ...process.env, PORT: '5001', NODE_ENV: 'test' };
  
  const serverProcess = exec('node server.js', {
    cwd: path.join(__dirname, '..'),
    env
  });

  serverProcess.stdout.on('data', (data) => {
    console.log('[SERVER LOG]:', data.toString().trim());
  });

  serverProcess.stderr.on('data', (data) => {
    console.error('[SERVER ERR]:', data.toString().trim());
  });

  await new Promise(resolve => setTimeout(resolve, 4000));

  try {
    console.log('Sending change password request...');
    const res = await axios.post(
      'http://localhost:5001/api/admin/change-password',
      {
        currentPassword: 'admin9090',
        newPassword: 'newadmin9090',
        confirmNewPassword: 'newadmin9090'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('Change Password Response:', res.status, res.data);

    console.log('Restoring password back to admin9090...');
    const restoreRes = await axios.post(
      'http://localhost:5001/api/admin/change-password',
      {
        currentPassword: 'newadmin9090',
        newPassword: 'admin9090',
        confirmNewPassword: 'admin9090'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log('Restore Password Response:', restoreRes.status, restoreRes.data);

  } catch (err) {
    console.error('Test Failed!');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data));
    } else {
      console.error('Error Details:', err);
    }
  } finally {
    console.log('Stopping test server...');
    serverProcess.kill();
  }
}

runTest();
