const express = require('express');
const router = express.Router();
const { webhookHandler } = require('../controllers/stripeController');

// IMPORTANT: express.raw() must be used here, not express.json()
// This route must be registered in index.js BEFORE the global express.json() middleware.
router.post('/stripe', express.raw({ type: 'application/json' }), webhookHandler);

module.exports = router;
