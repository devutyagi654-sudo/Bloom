const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyPayment, refundPayment, retryRazorpayOrder } = require('../controllers/paymentController');
const { protect, adminOnly, optionalAuth } = require('../middleware/authMiddleware');

router.post('/create-order', optionalAuth, createRazorpayOrder);
router.post('/verify', optionalAuth, verifyPayment);
router.post('/refund/:orderId', protect, adminOnly, refundPayment);
router.post('/retry-order', optionalAuth, retryRazorpayOrder);

module.exports = router;
