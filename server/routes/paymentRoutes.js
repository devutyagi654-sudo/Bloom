const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyPayment, refundPayment, retryRazorpayOrder } = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.post('/refund/:orderId', protect, adminOnly, refundPayment);
router.post('/retry-order', protect, retryRazorpayOrder);

module.exports = router;
