const express = require('express');
const router = express.Router();
const { submitContact, subscribeNewsletter } = require('../controllers/contactController');

router.post('/query', submitContact);
router.post('/newsletter', subscribeNewsletter);

module.exports = router;
