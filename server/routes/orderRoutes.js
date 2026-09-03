const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrderDetails, generateInvoice } = require('../controllers/orderController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

router.post('/', optionalAuth, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', optionalAuth, getOrderDetails);
router.get('/:orderId/invoice', optionalAuth, generateInvoice);

module.exports = router;
