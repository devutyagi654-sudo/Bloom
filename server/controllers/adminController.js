const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const { getTableData, insertRow, updateRow, deleteRow, writeTableData } = require('../config/db');
const { uploadToCloudinary } = require('../config/cloudinary');

// --- ANALYTICS ---
const getDashboardStats = async (req, res) => {
  try {
    const orders = getTableData('orders.xlsx');
    const products = getTableData('products.xlsx');
    const users = getTableData('users.xlsx');
    const categories = getTableData('categories.xlsx');
    const newsletter = getTableData('newsletter.xlsx');
    const contacts = getTableData('contacts.xlsx');
    
    // Total Revenue
    const activeOrders = orders.filter(o => o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Refunded');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    
    // Customer Count
    const customerCount = users.filter(u => u.role !== 'admin').length;
    
    // Today's Date String in local timezone format (YYYY-MM-DD)
    const todayStr = new Date().toISOString().split('T')[0];

    // Today's stats
    const todayOrders = orders.filter(o => o.createdAt && o.createdAt.split('T')[0] === todayStr);
    const todayOrdersCount = todayOrders.length;
    const todayActiveOrders = todayOrders.filter(o => o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Refunded');
    const todayRevenue = todayActiveOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // Counts by Status
    const pendingOrdersCount = orders.filter(o => o.orderStatus === 'Pending').length;
    const deliveredOrdersCount = orders.filter(o => o.orderStatus === 'Delivered').length;
    const cancelledOrdersCount = orders.filter(o => o.orderStatus === 'Cancelled').length;

    // Low stock warnings (< 5 units)
    const lowStockProducts = products
      .filter(p => Number(p.stock) < 5)
      .map(p => ({ id: p.id, name: p.name, stock: Number(p.stock) }));

    // Product Category breakdown
    const categoryCounts = {};
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    
    const categoryBreakdown = Object.keys(categoryCounts).map(name => ({
      name,
      count: categoryCounts[name]
    }));
    
    // Sales by day (last 7 days)
    const salesByDay = {};
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();
    
    // Initialize
    last7Days.forEach(date => {
      salesByDay[date] = 0;
    });
    
    activeOrders.forEach(o => {
      const orderDate = o.createdAt ? o.createdAt.split('T')[0] : '';
      if (salesByDay[orderDate] !== undefined) {
        salesByDay[orderDate] += Number(o.totalAmount || 0);
      }
    });
    
    const salesChartData = Object.keys(salesByDay).map(date => ({
      date,
      revenue: Number(salesByDay[date].toFixed(2))
    }));
    
    // Recent orders (last 5)
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
      
    return res.json({
      revenue: Number(totalRevenue.toFixed(2)),
      ordersCount: orders.length,
      productsCount: products.length,
      customersCount: customerCount,
      categoriesCount: categories.length,
      newsletterCount: newsletter.length,
      contactsCount: contacts.length,
      todayRevenue: Number(todayRevenue.toFixed(2)),
      todayOrdersCount,
      pendingOrdersCount,
      deliveredOrdersCount,
      cancelledOrdersCount,
      lowStockProducts,
      categoryBreakdown,
      salesChartData,
      recentOrders
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error generating dashboard statistics' });
  }
};

// --- CATEGORIES ---
const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    let image = '';
    
    if (req.file) {
      const cloudinaryUrl = await uploadToCloudinary(req.file.path, 'categories');
      image = cloudinaryUrl || `/uploads/${req.file.filename}`;
    }
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    const categories = getTableData('categories.xlsx');
    const exists = categories.some(c => String(c.name).toLowerCase() === name.toLowerCase());
    if (exists) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    
    const newCategory = insertRow('categories.xlsx', {
      name,
      description: description || '',
      image
    });
    
    return res.status(201).json(newCategory);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error adding category' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const categories = getTableData('categories.xlsx');
    const category = categories.find(c => String(c.id) === String(id));
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const updatedFields = {
      name: name || category.name,
      description: description !== undefined ? description : category.description
    };
    
    if (req.file) {
      // Remove old image file if possible
      if (category.image && category.image.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', category.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      const cloudinaryUrl = await uploadToCloudinary(req.file.path, 'categories');
      updatedFields.image = cloudinaryUrl || `/uploads/${req.file.filename}`;
    }
    
    const updated = updateRow('categories.xlsx', id, updatedFields);
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error updating category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const categories = getTableData('categories.xlsx');
    const category = categories.find(c => String(c.id) === String(id));
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Delete image if exists
    if (category.image && category.image.startsWith('/uploads/')) {
      const imgPath = path.join(__dirname, '..', category.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    
    deleteRow('categories.xlsx', id);
    return res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error deleting category' });
  }
};

// --- PRODUCTS ---
const addProduct = async (req, res) => {
  try {
    const {
      name, description, price, discountPrice, category, stock,
      isTrending, isBestSeller, isFeatured, isNewArrival, limitedOffer
    } = req.body;
    
    if (!name || !price || !category || stock === undefined) {
      return res.status(400).json({ message: 'Please provide name, price, category and stock' });
    }
    
    // Extract image paths
    let images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const cloudinaryUrl = await uploadToCloudinary(file.path, 'products');
        images.push(cloudinaryUrl || `/uploads/${file.filename}`);
      }
    }
    
    const newProduct = insertRow('products.xlsx', {
      name,
      description: description || '',
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      category,
      stock: Number(stock),
      images: images, // will be auto JSON stringified
      isTrending: isTrending === 'true' || isTrending === true,
      isBestSeller: isBestSeller === 'true' || isBestSeller === true,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isNewArrival: isNewArrival === 'true' || isNewArrival === true,
      limitedOffer: limitedOffer === 'true' || limitedOffer === true,
      ratings: 0,
      reviews: []
    });
    
    return res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error creating product' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const products = getTableData('products.xlsx');
    const product = products.find(p => String(p.id) === String(id));
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const {
      name, description, price, discountPrice, category, stock,
      isTrending, isBestSeller, isFeatured, isNewArrival, limitedOffer,
      existingImages // Keep existing images (as JSON array or comma separated)
    } = req.body;
    
    let parsedExistingImages = [];
    if (existingImages) {
      try {
        parsedExistingImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
      } catch (e) {
        parsedExistingImages = String(existingImages).split(',').filter(Boolean);
      }
    } else {
      parsedExistingImages = product.images || [];
    }
    
    // New uploaded files
    let newImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const cloudinaryUrl = await uploadToCloudinary(file.path, 'products');
        newImages.push(cloudinaryUrl || `/uploads/${file.filename}`);
      }
    }
    
    const finalImages = [...parsedExistingImages, ...newImages];
    
    const updatedFields = {
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      price: price !== undefined ? Number(price) : product.price,
      discountPrice: discountPrice !== undefined ? (discountPrice === '' ? null : Number(discountPrice)) : product.discountPrice,
      category: category || product.category,
      stock: stock !== undefined ? Number(stock) : product.stock,
      images: finalImages,
      isTrending: isTrending !== undefined ? (isTrending === 'true' || isTrending === true) : product.isTrending,
      isBestSeller: isBestSeller !== undefined ? (isBestSeller === 'true' || isBestSeller === true) : product.isBestSeller,
      isFeatured: isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : product.isFeatured,
      isNewArrival: isNewArrival !== undefined ? (isNewArrival === 'true' || isNewArrival === true) : product.isNewArrival,
      limitedOffer: limitedOffer !== undefined ? (limitedOffer === 'true' || limitedOffer === true) : product.limitedOffer
    };
    
    const updated = updateRow('products.xlsx', id, updatedFields);
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error updating product' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const products = getTableData('products.xlsx');
    const product = products.find(p => String(p.id) === String(id));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Delete product image files
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (img.startsWith('/uploads/')) {
          const imgPath = path.join(__dirname, '..', img);
          if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }
      });
    }
    
    deleteRow('products.xlsx', id);
    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error deleting product' });
  }
};

// --- ORDERS ---
const getAllOrders = async (req, res) => {
  try {
    const orders = getTableData('orders.xlsx');
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json(orders);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error fetching orders' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus, notes } = req.body;
    
    const orders = getTableData('orders.xlsx');
    const order = orders.find(o => String(o.id) === String(id));
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (paymentStatus) {
      updateRow('orders.xlsx', id, {
        paymentStatus: paymentStatus
      });
    }

    let updated = order;
    if (orderStatus && orderStatus !== order.orderStatus) {
      const { transitionOrderStatus } = require('./orderController');
      updated = await transitionOrderStatus(id, orderStatus, 'Admin', notes || 'Updated manually by administrator');
    } else if (paymentStatus) {
      const updatedOrders = getTableData('orders.xlsx');
      updated = updatedOrders.find(o => String(o.id) === String(id));
    }

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error updating order' });
  }
};

const getAdminSettings = async (req, res) => {
  try {
    const settingsPath = path.join(__dirname, '../database/settings.json');
    if (!fs.existsSync(settingsPath)) {
      const defaultSettings = { autoStatusProgression: false, progressionDelaySeconds: 30 };
      fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
      return res.json(defaultSettings);
    }
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    return res.json(settings);
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return res.status(500).json({ message: 'Server error fetching settings' });
  }
};

const updateAdminSettings = async (req, res) => {
  try {
    const { autoStatusProgression, progressionDelaySeconds } = req.body;
    const settingsPath = path.join(__dirname, '../database/settings.json');
    
    let currentSettings = { autoStatusProgression: false, progressionDelaySeconds: 30 };
    if (fs.existsSync(settingsPath)) {
      currentSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }

    const updatedSettings = {
      autoStatusProgression: autoStatusProgression !== undefined ? autoStatusProgression : currentSettings.autoStatusProgression,
      progressionDelaySeconds: progressionDelaySeconds !== undefined ? Number(progressionDelaySeconds) : currentSettings.progressionDelaySeconds
    };

    fs.writeFileSync(settingsPath, JSON.stringify(updatedSettings, null, 2));
    return res.json(updatedSettings);
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return res.status(500).json({ message: 'Server error updating settings' });
  }
};

// --- USERS ---
const getAllUsers = async (req, res) => {
  try {
    const users = getTableData('users.xlsx');
    // Hide passwords
    const cleanUsers = users.map(u => {
      const { password, ...safe } = u;
      return safe;
    });
    return res.json(cleanUsers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error listing users' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (role !== 'admin' && role !== 'customer') {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const users = getTableData('users.xlsx');
    const user = users.find(u => String(u.id) === String(id));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent self-demotion
    if (String(user.id) === String(req.user.id)) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }
    
    const updated = updateRow('users.xlsx', id, { role });
    const { password, ...safe } = updated;
    return res.json(safe);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error changing user role' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const users = getTableData('users.xlsx');
    const user = users.find(u => String(u.id) === String(id));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (String(user.id) === String(req.user.id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    
    deleteRow('users.xlsx', id);
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error deleting user' });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { updateRow } = require('../config/db'); // ensure updateRow is accessible
    const users = getTableData('users.xlsx');
    const user = users.find(u => String(u.id) === String(id));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (String(user.id) === String(req.user.id)) {
      return res.status(400).json({ message: 'You cannot disable your own account' });
    }
    
    const newStatus = user.status === 'disabled' ? 'active' : 'disabled';
    const updated = updateRow('users.xlsx', id, { status: newStatus });
    
    const { password, ...safe } = updated;
    return res.json(safe);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error updating user status' });
  }
};

// --- IMPORT & EXPORT EXCEL ---
const exportExcel = async (req, res) => {
  try {
    const { tableName } = req.params;
    // Validate table name
    const validTables = ['users', 'products', 'categories', 'orders', 'cart', 'wishlist', 'contacts', 'newsletter'];
    if (!validTables.includes(tableName)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    const fileName = `${tableName}.xlsx`;
    const filePath = path.join(__dirname, '../database', fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Database file not found' });
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    return res.sendFile(filePath);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error exporting database' });
  }
};

const importExcel = async (req, res) => {
  try {
    const { tableName } = req.params;
    const validTables = ['users', 'products', 'categories', 'orders', 'cart', 'wishlist', 'contacts', 'newsletter'];
    if (!validTables.includes(tableName)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel file' });
    }
    
    // Read uploaded sheet
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
    
    // Validate rows
    if (rawData.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Uploaded sheet is empty' });
    }
    
    // Format rows (clean values, parse inner JSON fields if any)
    const cleanedData = rawData.map(row => {
      // make sure ID is string
      if (row.id !== undefined && row.id !== null) {
        row.id = String(row.id);
      }
      
      // Parse JSON columns back to objects/arrays for writing
      Object.keys(row).forEach(key => {
        if (typeof row[key] === 'string') {
          const val = row[key].trim();
          if ((val.startsWith('[') && val.endsWith(']')) || (val.startsWith('{') && val.endsWith('}'))) {
            try {
              row[key] = JSON.parse(val);
            } catch (e) {
              // Leave as string
            }
          }
        }
      });
      return row;
    });
    
    // Overwrite the DB file
    writeTableData(`${tableName}.xlsx`, cleanedData);
    
    // Delete temp file upload
    fs.unlinkSync(req.file.path);
    
    return res.json({ message: `Successfully imported ${cleanedData.length} records into ${tableName}` });
  } catch (error) {
    console.error(error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ message: 'Server error importing database' });
  }
};

const getAnalyticsData = async (req, res) => {
  try {
    const orders = getTableData('orders.xlsx');
    const products = getTableData('products.xlsx');

    // 1. Revenue by Month
    const revenueByMonth = {};
    // 2. Orders by Status
    const statusCounts = {
      Pending: 0,
      Confirmed: 0,
      Packed: 0,
      Shipped: 0,
      'In Transit': 0,
      'Out For Delivery': 0,
      Delivered: 0,
      Cancelled: 0,
      Refunded: 0
    };
    // 3. COD vs Online Payment split
    const paymentSplit = { COD: 0, Razorpay: 0 };
    // 4. Top Products Sold
    const productStats = {};
    // 5. Top Categories by Sales Revenue
    const categoryStats = {};

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt || Date.now());
      const monthName = orderDate.toLocaleString('default', { month: 'short', year: 'numeric' });

      // Group revenue by Month (only count non-cancelled/non-refunded orders for true revenue)
      const amount = Number(order.totalAmount || 0);
      if (order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Refunded') {
        revenueByMonth[monthName] = (revenueByMonth[monthName] || 0) + amount;
      }

      // Group by Order Status
      const status = order.orderStatus || 'Pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // Group by Payment Method
      const method = order.paymentMethod || 'COD';
      if (method === 'COD' || method === 'Cash on Delivery') {
        paymentSplit.COD += 1;
      } else {
        paymentSplit.Razorpay += 1;
      }

      // Group items details
      let items = [];
      try {
        items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
      } catch (err) {
        items = [];
      }

      items.forEach(item => {
        const prodId = item.productId || 'unknown';
        const prodName = item.name || 'Unknown Product';
        const qty = Number(item.quantity || 0);
        const itemTotal = Number(item.price || 0) * qty;

        // Top products
        if (!productStats[prodId]) {
          productStats[prodId] = { name: prodName, qty: 0, revenue: 0 };
        }
        productStats[prodId].qty += qty;
        productStats[prodId].revenue += itemTotal;

        // Top categories
        // Find category from products table
        const matchingProduct = products.find(p => String(p.id) === String(prodId));
        const categoryName = matchingProduct ? (matchingProduct.category || 'Jewelry') : 'Jewelry';
        categoryStats[categoryName] = (categoryStats[categoryName] || 0) + itemTotal;
      });
    });

    // Formatting outputs
    const monthlyRevenue = Object.keys(revenueByMonth).map(month => ({
      month,
      revenue: Number(revenueByMonth[month].toFixed(2))
    }));

    const ordersByStatus = Object.keys(statusCounts).map(status => ({
      status,
      count: statusCounts[status]
    }));

    const paymentMethodSplit = [
      { name: 'COD', value: paymentSplit.COD },
      { name: 'Online (Razorpay)', value: paymentSplit.Razorpay }
    ];

    const topProducts = Object.keys(productStats)
      .map(id => ({
        id,
        name: productStats[id].name,
        quantity: productStats[id].qty,
        revenue: Number(productStats[id].revenue.toFixed(2))
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const topCategories = Object.keys(categoryStats).map(catName => ({
      category: catName,
      revenue: Number(categoryStats[catName].toFixed(2))
    })).sort((a, b) => b.revenue - a.revenue);

    return res.json({
      monthlyRevenue,
      ordersByStatus,
      paymentMethodSplit,
      topProducts,
      topCategories
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    return res.status(500).json({ message: 'Server error generating detailed analytics' });
  }
};

module.exports = {
  getDashboardStats,
  addCategory,
  updateCategory,
  deleteCategory,
  addProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  updateUserRole,
  deleteUser,
  toggleUserStatus,
  exportExcel,
  importExcel,
  getAnalyticsData,
  getAdminSettings,
  updateAdminSettings
};
