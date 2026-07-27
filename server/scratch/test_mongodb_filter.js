const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://devutyagi654_db_user:iS7tBEWnM6ybsb2J@cluster0.spzntn1.mongodb.net/?appName=Cluster0';

const Schema = new mongoose.Schema({
  tableName: String,
  rowId: String,
  data: mongoose.Schema.Types.Mixed
});

const DataRow = mongoose.model('DataRow', Schema);

async function testFilter() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Load products like initDB does
    const rows = await DataRow.find({ tableName: 'products.xlsx' });
    const products = rows.map(row => ({ id: row.rowId, ...row.data }));
    
    console.log(`Loaded ${products.length} products.`);
    
    // Simulate backend filter for category = 'Bangles'
    const cat = 'bangles';
    const filteredProducts = products.filter(p => {
      const prodCat = String(p.category || '').toLowerCase().trim();
      const prodName = String(p.name || '').toLowerCase();
      
      if (cat === 'bracelet' || cat === 'bracelets') {
        return prodCat === 'bangles' || prodCat === 'bracelet' || prodCat === 'bracelets' || prodName.includes('bangle') || prodName.includes('bracelet');
      }
      if (cat === 'watch' || cat === 'watches') {
        return prodCat === 'watches' || prodCat === 'watch' || prodName.includes('watch');
      }
      if (cat === 'pendant' || cat === 'pendants') {
        return prodCat === 'pendant' || prodCat === 'pendants' || prodCat === 'necklaces' || prodCat === 'rings' || prodName.includes('pendant') || prodName.includes('necklace') || prodName.includes('ring');
      }
      if (cat === 'hamper' || cat === 'hampers') {
        return prodCat === 'hamper' || prodCat === 'hampers' || prodName.includes('hamper') || prodName.includes('box');
      }
      
      return prodCat === cat;
    });
    
    console.log('Filtered products count:', filteredProducts.length);
    filteredProducts.forEach(p => {
      console.log(`Name: ${p.name} | Category: ${p.category}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testFilter();
