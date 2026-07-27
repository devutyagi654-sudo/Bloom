const { getTableData } = require('../config/db');

try {
  const products = getTableData('products.xlsx');
  console.log('--- LOCAL PRODUCTS ---');
  products.forEach(p => {
    console.log(`ID: ${p.id} | Name: ${p.name} | Category: ${p.category}`);
  });
} catch (err) {
  console.error(err);
}
