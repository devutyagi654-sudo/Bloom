const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://devutyagi654_db_user:iS7tBEWnM6ybsb2J@cluster0.spzntn1.mongodb.net/?appName=Cluster0';

const Schema = new mongoose.Schema({
  tableName: String,
  rowId: String,
  data: mongoose.Schema.Types.Mixed
});

const DataRow = mongoose.model('DataRow', Schema);

async function inspect() {
  try {
    console.log('Connecting to live MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const rows = await DataRow.find({ tableName: 'products.xlsx' });
    console.log(`Found ${rows.length} products in MongoDB.`);
    rows.forEach(r => {
      console.log(`RowID: ${r.rowId} | Data:`, JSON.stringify(r.data));
    });

    const cats = await DataRow.find({ tableName: 'categories.xlsx' });
    console.log(`Found ${cats.length} categories in MongoDB.`);
    cats.forEach(c => {
      console.log(`RowID: ${c.rowId} | Data:`, JSON.stringify(c.data));
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
