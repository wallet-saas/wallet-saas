const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { checkout, portal, cancel, status, sync } = require('../controllers/subscriptionController');

// GET  /api/subscription/checkout  — browser redirect (token in query param)
// No authMiddleware here — checkout controller handles token extraction from query
router.get('/checkout', checkout);

// POST /api/subscription/portal   — returns Whop customer portal URL
router.post('/portal', authMiddleware, portal);

// POST /api/subscription/cancel   — cancel at period end
router.post('/cancel', authMiddleware, cancel);

// GET  /api/subscription/status
router.get('/status', authMiddleware, status);

// POST /api/subscription/sync — force-sync Whop → Supabase (dev fallback)
router.post('/sync', authMiddleware, sync);

module.exports = router;
