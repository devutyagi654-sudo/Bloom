const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const usePersistent = fs.existsSync('/data');
const DB_DIR = usePersistent ? '/data/database' : path.join(__dirname, '../database');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Schemas & Headers
const SCHEMAS = {
  'users.xlsx': ['id', 'fullName', 'email', 'mobile', 'password', 'role', 'status', 'createdAt'],
  'products.xlsx': [
    'id', 'name', 'description', 'price', 'discountPrice', 'category', 'stock',
    'images', 'isTrending', 'isBestSeller', 'isFeatured', 'isNewArrival',
    'limitedOffer', 'ratings', 'reviews', 'createdAt'
  ],
  'categories.xlsx': ['id', 'name', 'description', 'image', 'createdAt'],
  'orders.xlsx': [
    'id', 'userId', 'fullName', 'email', 'mobile', 'address', 'city', 'state', 'zip',
    'paymentMethod', 'paymentStatus', 'totalAmount', 'shippingCharges', 'deliveryCharge', 'couponCode',
    'items', 'orderStatus', 'razorpayOrderId', 'razorpayPaymentId', 'razorpaySignature', 
    'shipmentId', 'trackingId', 'awbCode', 'courierName', 'trackingUrl', 'expectedDelivery', 'createdAt'
  ],
  'cart.xlsx': ['id', 'userId', 'productId', 'quantity', 'createdAt'],
  'wishlist.xlsx': ['id', 'userId', 'productId', 'createdAt'],
  'contacts.xlsx': ['id', 'name', 'email', 'mobile', 'message', 'status', 'createdAt'],
  'newsletter.xlsx': ['id', 'email', 'createdAt'],
  'banners.xlsx': ['id', 'filename', 'bannerPath', 'createdAt'],
  'order_status_history.xlsx': ['id', 'orderId', 'prevStatus', 'newStatus', 'updatedBy', 'timestamp', 'notes']
};

// Initialize sheets with headers if not present
function initDB() {
  Object.keys(SCHEMAS).forEach(file => {
    const filePath = path.join(DB_DIR, file);
    if (!fs.existsSync(filePath)) {
      const headers = SCHEMAS[file];
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.aoa_to_sheet([headers]);
      xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
      xlsx.writeFile(wb, filePath);
      console.log(`Initialized Excel database sheet: ${file}`);
    }
  });
}

// Initialize on require
initDB();

/**
 * Get all rows from a table
 * @param {string} fileName - E.g., 'users.xlsx'
 * @returns {Array<object>}
 */
function getTableData(fileName) {
  const filePath = path.join(DB_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    initDB();
  }
  const wb = xlsx.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  
  // Parse rows as JSON (with default empty values for blank cells)
  const rawData = xlsx.utils.sheet_to_json(ws, { defval: "" });
  
  // Clean values (convert numeric strings, make sure ID is string)
  return rawData.map(row => {
    if (row.id !== undefined && row.id !== null) {
      row.id = String(row.id);
    }
    
    // Parse JSON strings back to arrays/objects if they look like JSON
    Object.keys(row).forEach(key => {
      if (typeof row[key] === 'string') {
        const val = row[key].trim();
        if ((val.startsWith('[') && val.endsWith(']')) || (val.startsWith('{') && val.endsWith('}'))) {
          try {
            row[key] = JSON.parse(val);
          } catch (e) {
            // Leave as string if parsing fails
          }
        }
      }
    });
    
    return row;
  });
}

/**
 * Write table data back to Excel
 * @param {string} fileName 
 * @param {Array<object>} data 
 */
function writeTableData(fileName, data) {
  const filePath = path.join(DB_DIR, fileName);
  const headers = SCHEMAS[fileName];
  const wb = xlsx.utils.book_new();
  
  // Format data for saving (serialize objects/arrays as JSON strings)
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
 * Insert a new row with auto-increment ID
 * @param {string} fileName 
 * @param {object} rowData 
 * @returns {object} The created row
 */
function insertRow(fileName, rowData) {
  const data = getTableData(fileName);
  let newId = 1;
  if (data.length > 0) {
    const ids = data.map(r => parseInt(r.id, 10)).filter(id => !isNaN(id));
    if (ids.length > 0) {
      newId = Math.max(...ids) + 1;
    }
  }
  
  const newRow = {
    id: String(newId),
    ...rowData,
    createdAt: new Date().toISOString()
  };
  
  data.push(newRow);
  writeTableData(fileName, data);
  return newRow;
}

/**
 * Update an existing row
 * @param {string} fileName 
 * @param {string} id 
 * @param {object} updatedFields 
 * @returns {object|null} Updated row or null
 */
function updateRow(fileName, id, updatedFields) {
  const data = getTableData(fileName);
  const index = data.findIndex(r => String(r.id) === String(id));
  if (index === -1) return null;
  
  data[index] = {
    ...data[index],
    ...updatedFields,
    id: String(data[index].id), // preserve ID
    createdAt: data[index].createdAt // preserve createdAt
  };
  
  writeTableData(fileName, data);
  return data[index];
}

/**
 * Delete a row
 * @param {string} fileName 
 * @param {string} id 
 * @returns {boolean} True if deleted, false if not found
 */
function deleteRow(fileName, id) {
  const data = getTableData(fileName);
  const filteredData = data.filter(r => String(r.id) !== String(id));
  const deleted = data.length > filteredData.length;
  if (deleted) {
    writeTableData(fileName, filteredData);
  }
  return deleted;
}

module.exports = {
  getTableData,
  writeTableData,
  insertRow,
  updateRow,
  deleteRow
};
