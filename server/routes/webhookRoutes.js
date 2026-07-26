const express = require('express');
const router = express.Router();
const { handleShiprocketWebhook } = require('../controllers/webhookController');

router.post('/shiprocket', handleShiprocketWebhook);

module.exports = router;
