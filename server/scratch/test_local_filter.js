const axios = require('axios');

async function run() {
  try {
    console.log('Querying all products locally...');
    const all = await axios.get('http://localhost:5000/api/products');
    console.log(`Returned ${all.data.length} products.`);

    console.log('\nQuerying category=Bracelet locally...');
    const bracelets = await axios.get('http://localhost:5000/api/products?category=Bracelet');
    console.log(`Returned ${bracelets.data.length} products.`);
    bracelets.data.forEach(p => console.log(`- ${p.name} (Category: ${p.category})`));

    console.log('\nQuerying category=Earrings locally...');
    const earrings = await axios.get('http://localhost:5000/api/products?category=Earrings');
    console.log(`Returned ${earrings.data.length} products.`);
    earrings.data.forEach(p => console.log(`- ${p.name} (Category: ${p.category})`));

    console.log('\nQuerying category=Rings locally...');
    const rings = await axios.get('http://localhost:5000/api/products?category=Rings');
    console.log(`Returned ${rings.data.length} products.`);
    rings.data.forEach(p => console.log(`- ${p.name} (Category: ${p.category})`));

  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
