const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Contact = require('../models/Contact');
const Newsletter = require('../models/Newsletter');
const Setting = require('../models/Setting');
const { uploadToCloudinary } = require('../config/cloudinary');
const { transitionOrderStatus } = require('./orderController');

// --- ANALYTICS & DASHBOARD ---
const getDashboardStats = async (req, res) => {
  try {
    const orders = await Order.find().lean();
    const products = await Product.find().lean();
    const users = await User.find().lean();
    const categories = await Category.find().lean();
    const newsletterCount = await Newsletter.countDocuments();
    const contactsCount = await Contact.countDocuments();
    
    // Total Revenue
    const activeOrders = orders.filter(o => o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Refunded');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    
    // Customer Count
    const customerCount = users.filter(u => u.role !== 'admin' && u.role !== 'ADMIN').length;
    
    // Today's Date String
    const todayStr = new Date().toISOString().split('T')[0];

    // Today's stats
    const todayOrders = orders.filter(o => o.createdAt && new Date(o.createdAt).toISOString().split('T')[0] === todayStr);
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
      .map(p => ({ id: p._id, name: p.name, stock: Number(p.stock) }));

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
    
    last7Days.forEach(date => {
      salesByDay[date] = 0;
    });
    
    activeOrders.forEach(o => {
      const orderDate = o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '';
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
      .slice(0, 5)
      .map(o => ({ ...o, id: o._id }));
      
    return res.json({
      revenue: Number(totalRevenue.toFixed(2)),
      ordersCount: orders.length,
      productsCount: products.length,
      customersCount: customerCount,
      categoriesCount: categories.length,
      newsletterCount,
      contactsCount,
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
      image = cloudinaryUrl || `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    const exists = await Category.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
    if (exists) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    
    const newCategory = await Category.create({
      name: name.trim(),
      description: description || '',
      image
    });

    const obj = newCategory.toObject();
    obj.id = obj._id;
    
    return res.status(201).json(obj);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error adding category' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    let category = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      category = await Category.findById(id);
    }
    if (!category) {
      category = await Category.findOne({ _id: id });
    }

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description;
    
    if (req.file) {
      if (category.image && category.image.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', category.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      const cloudinaryUrl = await uploadToCloudinary(req.file.path, 'categories');
      category.image = cloudinaryUrl || `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }
    
    await category.save();
    const obj = category.toObject();
    obj.id = obj._id;
    return res.json(obj);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error updating category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    let category = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      category = await Category.findById(id);
    }
    if (!category) {
      category = await Category.findOne({ _id: id });
    }

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    if (category.image && category.image.startsWith('/uploads/')) {
      const imgPath = path.join(__dirname, '..', category.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    
    await Category.findByIdAndDelete(category._id);
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
    
    if (!name || price === undefined || !category || stock === undefined) {
      return res.status(400).json({ message: 'Please provide name, price, category and stock' });
    }
    
    let images = [];
    const host = `${req.protocol}://${req.get('host')}`;
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const cloudinaryUrl = await uploadToCloudinary(file.path, 'products');
        images.push(cloudinaryUrl || `${host}/uploads/${file.filename}`);
      }
    }
    
    const newProduct = await Product.create({
      name,
      description: description || '',
      price: Number(price),
      discountPrice: (discountPrice !== undefined && discountPrice !== '' && discountPrice !== null) ? Number(discountPrice) : null,
      category,
      stock: Number(stock),
      images: images,
      isTrending: isTrending === 'true' || isTrending === true,
      isBestSeller: isBestSeller === 'true' || isBestSeller === true,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isNewArrival: isNewArrival === 'true' || isNewArrival === true,
      limitedOffer: limitedOffer === 'true' || limitedOffer === true,
      ratings: 0,
      reviews: []
    });

    const obj = newProduct.toObject();
    obj.id = obj._id;
    
    return res.status(201).json(obj);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error creating product' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let product = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }
    if (!product) {
      product = await Product.findOne({ _id: id });
    }
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const {
      name, description, price, discountPrice, category, stock,
      isTrending, isBestSeller, isFeatured, isNewArrival, limitedOffer,
      existingImages
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
    
    let newImages = [];
    const host = `${req.protocol}://${req.get('host')}`;
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const cloudinaryUrl = await uploadToCloudinary(file.path, 'products');
        newImages.push(cloudinaryUrl || `${host}/uploads/${file.filename}`);
      }
    }
    
    const finalImages = [...parsedExistingImages, ...newImages];
    
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (discountPrice !== undefined) {
      product.discountPrice = (discountPrice === '' || discountPrice === null) ? null : Number(discountPrice);
    }
    if (category) product.category = category;
    if (stock !== undefined) product.stock = Number(stock);
    product.images = finalImages;
    if (isTrending !== undefined) product.isTrending = (isTrending === 'true' || isTrending === true);
    if (isBestSeller !== undefined) product.isBestSeller = (isBestSeller === 'true' || isBestSeller === true);
    if (isFeatured !== undefined) product.isFeatured = (isFeatured === 'true' || isFeatured === true);
    if (isNewArrival !== undefined) product.isNewArrival = (isNewArrival === 'true' || isNewArrival === true);
    if (limitedOffer !== undefined) product.limitedOffer = (limitedOffer === 'true' || limitedOffer === true);
    
    await product.save();
    const obj = product.toObject();
    obj.id = obj._id;
    return res.json(obj);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error updating product' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let product = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }
    if (!product) {
      product = await Product.findOne({ _id: id });
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (img.startsWith('/uploads/')) {
          const imgPath = path.join(__dirname, '..', img);
          if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }
      });
    }
    
    await Product.findByIdAndDelete(product._id);
    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error deleting product' });
  }
};

// --- ORDERS ---
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    const formatted = orders.map(o => ({ ...o, id: o._id }));
    return res.json(formatted);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error fetching orders' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, notes } = req.body;

    if (!orderStatus) {
      return res.status(400).json({ message: 'Order status is required' });
    }

    const updated = await transitionOrderStatus(id, orderStatus, req.user.fullName || 'Admin', notes);

    if (!updated) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const obj = updated.toObject ? updated.toObject() : updated;
    obj.id = obj._id;

    return res.json(obj);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error updating order status' });
  }
};

// --- ADMIN SETTINGS ---
const getAdminSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({ autoStatusProgression: false, progressionDelaySeconds: 30 });
    }
    const obj = settings.toObject();
    obj.id = obj._id;
    return res.json(obj);
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return res.status(500).json({ message: 'Server error fetching settings' });
  }
};

const updateAdminSettings = async (req, res) => {
  try {
    const { autoStatusProgression, progressionDelaySeconds } = req.body;
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }

    if (autoStatusProgression !== undefined) settings.autoStatusProgression = autoStatusProgression;
    if (progressionDelaySeconds !== undefined) settings.progressionDelaySeconds = Number(progressionDelaySeconds);

    await settings.save();
    const obj = settings.toObject();
    obj.id = obj._id;
    return res.json(obj);
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return res.status(500).json({ message: 'Server error updating settings' });
  }
};

// --- USERS ---
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    const cleanUsers = users.map(u => ({ ...u, id: u._id }));
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
    
    if (role !== 'admin' && role !== 'customer' && role !== 'ADMIN' && role !== 'USER') {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    let user = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id);
    }
    if (!user) {
      user = await User.findOne({ _id: id });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (String(user._id) === String(req.user.id || req.user._id)) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }
    
    user.role = role.toUpperCase();
    await user.save();
    
    const obj = user.toObject();
    delete obj.password;
    obj.id = obj._id;

    return res.json(obj);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error changing user role' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    let user = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id);
    }
    if (!user) {
      user = await User.findOne({ _id: id });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (String(user._id) === String(req.user.id || req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    
    await User.findByIdAndDelete(user._id);
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error deleting user' });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let user = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id);
    }
    if (!user) {
      user = await User.findOne({ _id: id });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (String(user._id) === String(req.user.id || req.user._id)) {
      return res.status(400).json({ message: 'You cannot disable your own account' });
    }
    
    user.status = user.status === 'disabled' ? 'active' : 'disabled';
    await user.save();
    
    const obj = user.toObject();
    delete obj.password;
    obj.id = obj._id;
    return res.json(obj);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error updating user status' });
  }
};

const getAnalyticsData = async (req, res) => {
  try {
    const orders = await Order.find().lean();
    const products = await Product.find().lean();

    const revenueByMonth = {};
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
    const paymentSplit = { COD: 0, Razorpay: 0 };
    const productStats = {};
    const categoryStats = {};

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt || Date.now());
      const monthName = orderDate.toLocaleString('default', { month: 'short', year: 'numeric' });

      const amount = Number(order.totalAmount || 0);
      if (order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Refunded') {
        revenueByMonth[monthName] = (revenueByMonth[monthName] || 0) + amount;
      }

      const status = order.orderStatus || 'Pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      const method = order.paymentMethod || 'COD';
      if (method === 'COD' || method === 'Cash on Delivery') {
        paymentSplit.COD += 1;
      } else {
        paymentSplit.Razorpay += 1;
      }

      const items = Array.isArray(order.items) ? order.items : [];

      items.forEach(item => {
        const prodId = String(item.productId || 'unknown');
        const prodName = item.name || 'Unknown Product';
        const qty = Number(item.quantity || 0);
        const itemTotal = Number(item.price || 0) * qty;

        if (!productStats[prodId]) {
          productStats[prodId] = { name: prodName, qty: 0, revenue: 0 };
        }
        productStats[prodId].qty += qty;
        productStats[prodId].revenue += itemTotal;

        const matchingProduct = products.find(p => String(p._id) === prodId);
        const categoryName = matchingProduct ? (matchingProduct.category || 'Jewelry') : 'Jewelry';
        categoryStats[categoryName] = (categoryStats[categoryName] || 0) + itemTotal;
      });
    });

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

const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'Please fill in all password fields' });
    }
    
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }
    
    const adminUser = await User.findOne({ email: 'admin@blc.com' });
    
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin account not found in database' });
    }
    
    const isMatch = await bcrypt.compare(currentPassword, adminUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    const salt = await bcrypt.genSalt(10);
    adminUser.password = await bcrypt.hash(newPassword, salt);
    await adminUser.save();
    
    return res.json({ message: 'Admin password changed successfully' });
  } catch (error) {
    console.error('Error changing admin password:', error);
    return res.status(500).json({ message: 'Server error changing password' });
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
  getAnalyticsData,
  getAdminSettings,
  updateAdminSettings,
  changeAdminPassword
};
