const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const mongoose = require('mongoose');

// Schemas & Headers (Old Excel schemas)
const SCHEMAS = {
  'users.xlsx': ['id', 'fullName', 'email', 'mobile', 'password', 'role', 'status', 'createdAt'],
  'products.xlsx': ['id', 'name', 'description', 'price', 'discountPrice', 'category', 'images', 'stock', 'ratings', 'reviewsCount', 'createdAt'],
  'categories.xlsx': ['id', 'name', 'image', 'createdAt'],
  'cart.xlsx': ['id', 'userId', 'productId', 'quantity', 'createdAt'],
  'wishlist.xlsx': ['id', 'userId', 'productId', 'createdAt'],
  'orders.xlsx': ['id', 'userId', 'items', 'totalAmount', 'shippingCharges', 'shippingAddress', 'paymentMethod', 'paymentStatus', 'orderStatus', 'createdAt'],
  'order_status_history.xlsx': ['id', 'orderId', 'previousStatus', 'newStatus', 'updatedBy', 'timestamp', 'notes', 'createdAt'],
  'contacts.xlsx': ['id', 'name', 'email', 'message', 'createdAt'],
  'newsletter.xlsx': ['id', 'email', 'createdAt'],
  'banners.xlsx': ['id', 'filename', 'bannerPath', 'createdAt']
};

const DB_DIR = path.join(__dirname, '../database');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Memory Cache
const memoryDb = {};
Object.keys(SCHEMAS).forEach(table => {
  memoryDb[table] = [];
});

let useMongoDB = false;
let DataRow = null;

// Helper to check if MongoDB is configured
const MONGODB_URI = process.env.MONGODB_URI;

// Define DataRow schema for mongoose
if (MONGODB_URI) {
  const DataRowSchema = new mongoose.Schema({
    tableName: { type: String, required: true },
    rowId: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} }
  }, { timestamps: true });

  DataRowSchema.index({ tableName: 1, rowId: 1 }, { unique: true });
  DataRow = mongoose.model('DataRow', DataRowSchema);
  useMongoDB = true;
}

/**
 * Excel legacy file readers/writers
 */
function getTableDataFromExcel(fileName) {
  const filePath = path.join(DB_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = xlsx.utils.sheet_to_json(worksheet);
  
  const headers = SCHEMAS[fileName];
  return rawData.map(row => {
    const formattedRow = {};
    headers.forEach(header => {
      let val = row[header];
      if (val === undefined || val === null) {
        val = '';
      } else if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try {
          val = JSON.parse(val);
        } catch (e) {
          // Keep as string
        }
      }
      formattedRow[header] = val;
    });
    return formattedRow;
  });
}

function writeTableDataToExcel(fileName, data) {
  const filePath = path.join(DB_DIR, fileName);
  const headers = SCHEMAS[fileName];
  const wb = xlsx.utils.book_new();
  
  const formattedData = data.map(row => {
    const formattedRow = {};
    headers.forEach(header => {
      let val = row[header];
      if (val === undefined || val === null) {
        val = '';
      } else if (typeof val === 'object') {
        val = JSON.stringify(val);
      }
      formattedRow[header] = val;
    });
    return formattedRow;
  });
  
  const ws = xlsx.utils.json_to_sheet(formattedData, { header: headers });
  xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
  xlsx.writeFile(wb, filePath);
}

/**
 * Database Initialization (Connected on server boot)
 */
async function initDB() {
  if (!useMongoDB) {
    console.log('[DB] Running in local Excel file database mode.');
    return;
  }

  try {
    console.log('[DB] Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('[DB] Connected to MongoDB successfully.');

    // Load data from MongoDB into in-memory cache
    const allRows = await DataRow.find({});
    console.log(`[DB] Loaded ${allRows.length} documents from MongoDB Atlas.`);

    // If MongoDB is empty, run migration from existing Excel files
    if (allRows.length === 0) {
      console.log('[DB] MongoDB is empty. Migrating local Excel databases to cloud...');
      for (const table of Object.keys(SCHEMAS)) {
        const excelData = getTableDataFromExcel(table);
        if (excelData.length > 0) {
          console.log(`[DB] Migrating ${excelData.length} rows for table: ${table}`);
          for (const row of excelData) {
            const { id, ...data } = row;
            await DataRow.create({
              tableName: table,
              rowId: String(id),
              data
            });
            memoryDb[table].push(row);
          }
        }
      }
      console.log('[DB] Migration to MongoDB complete.');
    } else {
      // Populate memory cache from MongoDB
      allRows.forEach(row => {
        const table = row.tableName;
        if (memoryDb[table]) {
          memoryDb[table].push({ id: row.rowId, ...row.data });
        }
      });
      console.log('[DB] Memory cache synchronization complete.');
    }
  } catch (error) {
    console.error('[DB] Failed to connect or sync with MongoDB. Falling back to local Excel database.', error);
    useMongoDB = false;
  }
}

/**
 * Public adapter functions (Synchronous interfaces for controllers compatibility)
 */
function getTableData(fileName) {
  if (useMongoDB) {
    return memoryDb[fileName] || [];
  }
  return getTableDataFromExcel(fileName);
}

function writeTableData(fileName, data) {
  if (useMongoDB) {
    memoryDb[fileName] = data;
    // Sync asynchronously to MongoDB
    DataRow.deleteMany({ tableName: fileName })
      .then(() => {
        const docs = data.map(row => ({
          tableName: fileName,
          rowId: String(row.id),
          data: Object.fromEntries(Object.entries(row).filter(([k]) => k !== 'id'))
        }));
        return DataRow.insertMany(docs);
      })
      .catch(err => console.error(`[DB] Background sync failed for writeTableData (${fileName}):`, err));
    return;
  }
  writeTableDataToExcel(fileName, data);
}

function insertRow(fileName, rowData) {
  const data = getTableData(fileName);
  
  // Calculate new ID
  let newId = 1;
  if (data.length > 0) {
    const ids = data.map(r => Number(r.id)).filter(id => !isNaN(id));
    if (ids.length > 0) {
      newId = Math.max(...ids) + 1;
    }
  }
  
  const newRow = {
    id: String(rowData.id || newId),
    ...rowData,
    createdAt: rowData.createdAt || new Date().toISOString()
  };
  
  if (useMongoDB) {
    memoryDb[fileName].push(newRow);
    const { id, ...dataFields } = newRow;
    DataRow.create({
      tableName: fileName,
      rowId: String(id),
      data: dataFields
    }).catch(err => console.error(`[DB] Background insert failed (${fileName}):`, err));
  } else {
    data.push(newRow);
    writeTableDataToExcel(fileName, data);
  }
  
  return newRow;
}

function updateRow(fileName, id, updatedData) {
  const data = getTableData(fileName);
  const index = data.findIndex(r => String(r.id) === String(id));
  
  if (index === -1) {
    return null;
  }
  
  const originalRow = data[index];
  const updatedRow = {
    ...originalRow,
    ...updatedData,
    id: String(id) // Ensure ID doesn't change
  };
  
  if (useMongoDB) {
    memoryDb[fileName][index] = updatedRow;
    const { id: _, ...dataFields } = updatedRow;
    DataRow.updateOne(
      { tableName: fileName, rowId: String(id) },
      { $set: { data: dataFields } },
      { upsert: true }
    ).catch(err => console.error(`[DB] Background update failed (${fileName}, id: ${id}):`, err));
  } else {
    data[index] = updatedRow;
    writeTableDataToExcel(fileName, data);
  }
  
  return updatedRow;
}

function deleteRow(fileName, id) {
  const data = getTableData(fileName);
  const index = data.findIndex(r => String(r.id) === String(id));
  
  if (index === -1) {
    return false;
  }
  
  if (useMongoDB) {
    memoryDb[fileName].splice(index, 1);
    DataRow.deleteOne({ tableName: fileName, rowId: String(id) })
      .catch(err => console.error(`[DB] Background delete failed (${fileName}, id: ${id}):`, err));
  } else {
    data.splice(index, 1);
    writeTableDataToExcel(fileName, data);
  }
  
  return true;
}

module.exports = {
  initDB,
  getTableData,
  writeTableData,
  insertRow,
  updateRow,
  deleteRow
};
