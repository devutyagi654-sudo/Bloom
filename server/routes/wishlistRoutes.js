const express = require('express');
const router = express.Router();
const { getWishlist, toggleWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // protect all wishlist routes

router.get('/', getWishlist);
router.post('/toggle', toggleWishlist);

module.exports = router;
