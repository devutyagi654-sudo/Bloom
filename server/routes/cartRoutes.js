const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartQuantity, removeFromCart, clearCart } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // protect all cart routes

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:id', updateCartQuantity);
router.delete('/:id', removeFromCart);
router.delete('/', clearCart);

module.exports = router;
