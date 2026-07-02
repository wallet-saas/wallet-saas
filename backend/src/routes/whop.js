const express = require('express');
const router = express.Router();
const { webhookHandler } = require('../controllers/whopController');

// Whop envoie du JSON, donc on utilise express.raw pour capturer le body brut
// puis on le parse manuellement pour préserver la signature
router.post('/whop', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    req.rawBody = req.body.toString('utf8');
    req.body = JSON.parse(req.rawBody);
  } catch (e) {
    return res.status(400).json({ success: false, error: 'Invalid JSON' });
  }
  webhookHandler(req, res);
});

module.exports = router;