const express = require('express');
const router = express.Router();
const badgeService = require('../services/badgeService');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * GET /api/badges/stats
 * Statistiques des badges du commerçant
 * Protégé par JWT
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const stats = await badgeService.getBadgeStats(commercantId);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur.' });
  }
});

/**
 * GET /api/badges/client/:carteId
 * Badges d'un client spécifique
 * Protégé par JWT
 */
router.get('/client/:carteId', authMiddleware, async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { carteId } = req.params;
    const badges = await badgeService.getClientBadges(carteId, commercantId);
    res.json({ success: true, data: badges });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur.' });
  }
});

module.exports = router;
