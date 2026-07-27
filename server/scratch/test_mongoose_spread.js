const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://devutyagi654_db_user:iS7tBEWnM6ybsb2J@cluster0.spzntn1.mongodb.net/?appName=Cluster0';

const Schema = new mongoose.Schema({
  tableName: String,
  rowId: String,
  data: mongoose.Schema.Types.Mixed
});

const DataRow = mongoose.model('DataRow', Schema);

async function test() {
  try {
    await mongoose.connect(MONGODB_URI);
    const row = await DataRow.findOne({ tableName: 'products.xlsx', rowId: '1' });
    
    console.log('--- RAW DOCUMENT ---');
    console.log('row.data type:', typeof row.data);
    console.log('row.data is Mongoose Document?', row.data instanceof mongoose.Document);
    
    console.log('--- SPREAD TEST ---');
    const spreadData = { id: row.rowId, ...row.data };
    console.log('spreadData.name:', spreadData.name);
    console.log('spreadData.category:', spreadData.category);
    console.log('Keys in spreadData:', Object.keys(spreadData));
    
    console.log('--- TOOBJECT SPREAD TEST ---');
    const rowObj = row.toObject();
    const spreadObj = { id: row.rowId, ...rowObj.data };
    console.log('spreadObj.name:', spreadObj.name);
    console.log('spreadObj.category:', spreadObj.category);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
