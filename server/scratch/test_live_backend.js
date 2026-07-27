const axios = require('axios');

async function test() {
  try {
    console.log('Querying live Render backend for category=Bangles...');
    const res1 = await axios.get('https://bloom-backend.onrender.com/api/products?category=Bangles');
    console.log('--- Bangles Response ---');
    console.log(res1.data.map(p => ({ id: p.id, name: p.name, category: p.category })));

    console.log('\nQuerying live Render backend for category=bangles (lowercase)...');
    const res2 = await axios.get('https://bloom-backend.onrender.com/api/products?category=bangles');
    console.log('--- bangles Response ---');
    console.log(res2.data.map(p => ({ id: p.id, name: p.name, category: p.category })));
  } catch (err) {
    console.error(err.message);
  }
}

test();
