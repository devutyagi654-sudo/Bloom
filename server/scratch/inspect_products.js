const { getTableData } = require('../config/db');

try {
  const products = getTableData('products.xlsx');
  console.log('--- PRODUCTS LIST ---');
  products.forEach(p => {
    console.log(`ID: ${p.id} | Name: ${p.name} | Category: ${p.category}`);
  });
} catch (err) {
  console.error(err);
}
