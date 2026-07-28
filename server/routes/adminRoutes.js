const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload, bannerUpload } = require('../middleware/uploadMiddleware');
const { uploadBanner, deleteBanner } = require('../controllers/bannerController');
const {
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
  updateAdminSettings,
  changeAdminPassword
} = require('../controllers/adminController');

// All admin routes are protected and restricted to admin
router.use(protect);
router.use(adminOnly);

// Stats
router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalyticsData);
router.get('/settings', getAdminSettings);
router.post('/settings', updateAdminSettings);
router.post('/change-password', changeAdminPassword);

// Categories
router.post('/categories', upload.single('image'), addCategory);
router.put('/categories/:id', upload.single('image'), updateCategory);
router.delete('/categories/:id', deleteCategory);

// Products
router.post('/products', upload.array('images', 8), addProduct);
router.put('/products/:id', upload.array('images', 8), updateProduct);
router.delete('/products/:id', deleteProduct);

// Orders
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Users
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

// Database import/export
router.get('/export/:tableName', exportExcel);
router.post('/import/:tableName', upload.single('file'), importExcel);

const uploadBannersMiddleware = (req, res, next) => {
  bannerUpload.fields([
    { name: 'banners', maxCount: 5 },
    { name: 'banner', maxCount: 5 }
  ])(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }

    // Consolidate files from both fieldnames into req.files
    const files = [];
    if (req.files) {
      if (req.files['banners']) files.push(...req.files['banners']);
      if (req.files['banner']) files.push(...req.files['banner']);
    }
    req.files = files;
    next();
  });
};

// Banner Management
router.post('/banner', uploadBannersMiddleware, uploadBanner);
router.put('/banner', uploadBannersMiddleware, uploadBanner);
router.delete('/banner/:id', deleteBanner);

module.exports = router;
