const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:5000/api/products?category=bangles');
    console.log('--- PRODUCTS WITH CATEGORY BANGLES ---');
    console.log(res.data.map(p => ({ id: p.id, name: p.name, category: p.category })));
  } catch (err) {
    console.error(err.message);
  }
}

test();
