const express = require('express');
const router = express.Router();
const { createShipment, trackShipment, cancelShipment, requestReturn } = require('../controllers/shippingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/create', protect, adminOnly, createShipment);
router.get('/track/:orderId', protect, trackShipment);
router.post('/cancel/:orderId', protect, cancelShipment);
router.post('/return/:orderId', protect, requestReturn);

module.exports = router;
