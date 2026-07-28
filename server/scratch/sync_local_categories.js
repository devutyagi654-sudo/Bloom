const mongoose = require('mongoose');
const { writeTableData } = require('../config/db');

const uri = 'mongodb+srv://devutyagi654_db_user:iS7tBEWnM6ybsb2J@cluster0.spzntn1.mongodb.net/test?retryWrites=true&w=majority';

async function sync() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Connected!');

    const DataRowSchema = new mongoose.Schema({
      tableName: { type: String, required: true },
      rowId: { type: String, required: true },
      data: { type: mongoose.Schema.Types.Mixed, default: {} }
    });
    const DataRow = mongoose.model('DataRow', DataRowSchema);

    console.log('Fetching categories from MongoDB...');
    const dbCategories = await DataRow.find({ tableName: 'categories.xlsx' }).lean();
    console.log(`Found ${dbCategories.length} categories in Atlas.`);

    const formattedCategories = dbCategories.map(c => ({
      id: c.rowId,
      ...c.data
    })).sort((a, b) => Number(a.id) - Number(b.id));

    console.log('Syncing categories to local categories.xlsx sheet...');
    // We temporarily bypass useMongoDB setting to write directly to Excel on local system
    const { writeTableDataToExcel } = require('../config/db');
    
    // In db.js, the local Excel writer is writeTableData when useMongoDB is false.
    // Let's import xlsx and write it directly to keep it simple.
    const path = require('path');
    const xlsx = require('xlsx');
    const DB_DIR = path.join(__dirname, '../database');
    const filePath = path.join(DB_DIR, 'categories.xlsx');
    const headers = ['id', 'name', 'image', 'createdAt'];

    const formattedData = formattedCategories.map(row => {
      const formattedRow = {};
      headers.forEach(header => {
        formattedRow[header] = row[header] !== undefined ? row[header] : '';
      });
      return formattedRow;
    });

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(formattedData, { header: headers });
    xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
    xlsx.writeFile(wb, filePath);

    console.log('Categories sync complete! Categories inside local categories.xlsx:');
    formattedCategories.forEach(c => console.log(`- ID: ${c.id} | Name: ${c.name}`));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

sync();
