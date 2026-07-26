const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrderDetails, generateInvoice } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // protect all order routes

router.post('/', createOrder);
router.get('/myorders', getMyOrders);
router.get('/:id', getOrderDetails);
router.get('/:orderId/invoice', generateInvoice);

module.exports = router;
