const axios = require('axios');
const { exec } = require('child_process');
const path = require('path');

const uri = 'mongodb+srv://devutyagi654_db_user:iS7tBEWnM6ybsb2J@cluster0.spzntn1.mongodb.net/test?retryWrites=true&w=majority';

async function runTest() {
  console.log('Starting local server in MongoDB Atlas Mode on PORT 5001...');
  const env = { 
    ...process.env, 
    PORT: '5001', 
    MONGODB_URI: uri,
    NODE_ENV: 'test'
  };
  
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

  // Wait 4 seconds for server to connect and sync cache
  await new Promise(resolve => setTimeout(resolve, 4000));

  try {
    console.log('\n--- TESTING API FILTERS IN MONGODB MODE ---');
    
    console.log('Querying category=Bracelet...');
    const bracelets = await axios.get('http://localhost:5001/api/products?category=Bracelet');
    console.log(`Returned ${bracelets.data.length} products.`);
    bracelets.data.forEach(p => console.log(`- ${p.name} (Category: ${p.category})`));

    console.log('\nQuerying category=Earrings...');
    const earrings = await axios.get('http://localhost:5001/api/products?category=Earrings');
    console.log(`Returned ${earrings.data.length} products.`);
    earrings.data.forEach(p => console.log(`- ${p.name} (Category: ${p.category})`));

    console.log('\nQuerying category=Rings...');
    const rings = await axios.get('http://localhost:5001/api/products?category=Rings');
    console.log(`Returned ${rings.data.length} products.`);
    rings.data.forEach(p => console.log(`- ${p.name} (Category: ${p.category})`));

    console.log('\nQuerying category=Watches...');
    const watches = await axios.get('http://localhost:5001/api/products?category=Watches');
    console.log(`Returned ${watches.data.length} products.`);
    watches.data.forEach(p => console.log(`- ${p.name} (Category: ${p.category})`));

  } catch (err) {
    console.error('Test Failed!');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data));
    } else {
      console.error('Error Details:', err);
    }
  } finally {
    console.log('\nStopping test server...');
    serverProcess.kill();
  }
}

runTest();
