const { getTableData } = require('../config/db');

try {
  const categories = getTableData('categories.xlsx');
  console.log('--- CATEGORIES ---');
  console.log(categories);

  const products = getTableData('products.xlsx');
  console.log('--- PRODUCTS CATEGORIES ---');
  const prodCats = [...new Set(products.map(p => p.category))];
  console.log(prodCats);
} catch (err) {
  console.error(err);
}
