const express = require('express');
const router = express.Router();
const { getBanner } = require('../controllers/bannerController');

// Public route to fetch banner
router.get('/', getBanner);

module.exports = router;
