const mongoose = require('mongoose');

const uri = 'mongodb+srv://devutyagi654_db_user:iS7tBEWnM6ybsb2J@cluster0.spzntn1.mongodb.net/?retryWrites=true&w=majority';

async function test() {
  try {
    console.log('Connecting to MongoDB Atlas (default db)...');
    await mongoose.connect(uri);
    console.log('Connected!');

    const DataRowSchema = new mongoose.Schema({
      tableName: { type: String, required: true },
      rowId: { type: String, required: true },
      data: { type: mongoose.Schema.Types.Mixed, default: {} }
    });
    const DataRow = mongoose.model('DataRow', DataRowSchema);

    console.log('Querying all DataRow documents...');
    const allRows = await DataRow.find({});
    console.log('Total documents in MongoDB:', allRows.length);

    const tables = {};
    allRows.forEach(row => {
      if (!tables[row.tableName]) {
        tables[row.tableName] = [];
      }
      tables[row.tableName].push({ id: row.rowId, ...row.data });
    });

    for (const [table, rows] of Object.entries(tables)) {
      console.log(`\n--- TABLE: ${table} (${rows.length} rows) ---`);
      if (table === 'products.xlsx') {
        rows.forEach(r => {
          console.log(`ID: ${r.id} | Name: ${r.name} | Category: ${r.category} | Price: ${r.price}`);
        });
      } else if (table === 'categories.xlsx') {
        rows.forEach(r => {
          console.log(`ID: ${r.id} | Name: ${r.name}`);
        });
      } else {
        console.log(`First row:`, JSON.stringify(rows[0]));
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

test();
