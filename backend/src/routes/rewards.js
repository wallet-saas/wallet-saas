/**
 * Stamply — Routes Récompenses
 * 
 * GET  /api/rewards/config       → Récupérer la config récompenses
 * PUT  /api/rewards/config       → Sauvegarder la config récompenses
 * GET  /api/rewards              → Liste des récompenses débloquées
 * GET  /api/rewards/stats        → Statistiques
 * GET  /api/rewards/tabs/:id     → Config simplifiée (tableau de bord)
 */

const express = require('express');
const router = express.Router();
const { query, body, validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');
const rewardService = require('../services/rewardService');

// ============================================
// GET /api/rewards/config
// Récupérer la config récompenses du commerçant
// ============================================
router.get('/config', authMiddleware, async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const config = await rewardService.getRewardConfig(commercantId);
    res.json({ success: true, data: config });
  } catch (err) {
    console.error('GET /rewards/config error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// PUT /api/rewards/config
// Sauvegarder la config récompenses
// ============================================
router.put('/config', authMiddleware, [
  body('enabled').optional().isBoolean(),
  body('visites_recompense_1').optional().isInt({ min: 1, max: 999 }),
  body('visites_recompense_2').optional().isInt({ min: 1, max: 999 }),
  body('visites_recompense_3').optional().isInt({ min: 1, max: 999 }),
  body('label_recompense_1').optional().trim().isLength({ max: 100 }),
  body('label_recompense_2').optional().trim().isLength({ max: 100 }),
  body('label_recompense_3').optional().trim().isLength({ max: 100 }),
  body('recompense_action_1').optional().isIn(['message', 'bonus_points', 'code_promo', 'cadeau', 'reset_points']),
  body('recompense_action_2').optional().isIn(['message', 'bonus_points', 'code_promo', 'cadeau', 'reset_points']),
  body('recompense_action_3').optional().isIn(['message', 'bonus_points', 'code_promo', 'cadeau', 'reset_points']),
  body('points_bonus_1').optional().isInt({ min: 0, max: 100 }),
  body('points_bonus_2').optional().isInt({ min: 0, max: 100 }),
  body('points_bonus_3').optional().isInt({ min: 0, max: 100 }),
  body('auto_reset').optional().isBoolean(),
  body('reset_message').optional().trim().isLength({ max: 200 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { id: commercantId } = req.commercant;
    const currentConfig = await rewardService.getRewardConfig(commercantId);
    const newConfig = { ...currentConfig, ...req.body };
    const saved = await rewardService.saveRewardConfig(commercantId, newConfig);
    res.json({ success: true, message: 'Config récompenses sauvegardée !', data: saved });
  } catch (err) {
    console.error('PUT /rewards/config error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// GET /api/rewards
// Liste des récompenses débloquées
// ============================================
router.get('/', authMiddleware, [
  query('boutique_id').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { boutique_id, limit } = req.query;

    const rewards = await rewardService.getMerchantRewards(
      commercantId,
      boutique_id || null,
      parseInt(limit) || 50
    );

    res.json({ success: true, data: rewards });
  } catch (err) {
    console.error('GET /rewards error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// GET /api/rewards/stats
// Statistiques des récompenses
// ============================================
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { boutique_id } = req.query;

    const stats = await rewardService.getRewardStats(commercantId, boutique_id || null);
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('GET /rewards/stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// GET /api/rewards/tabs/:carteId
// Récompenses pour une carte spécifique
// ============================================
router.get('/tabs/:carteId', authMiddleware, async (req, res) => {
  try {
    const { carteId } = req.params;
    const rewards = await rewardService.getCarteRewards(carteId);
    res.json({ success: true, data: rewards });
  } catch (err) {
    console.error('GET /rewards/tabs/:carteId error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// POST /api/rewards/reset
// Réinitialiser les récompenses d'une carte (nouveau cycle manuel)
// ============================================
router.post('/reset', authMiddleware, [
  body('carte_id').isUUID(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { carte_id } = req.body;

    // Réinitialiser les points
    await supabase
      .from('cartes')
      .update({ points: 0, updated_at: new Date().toISOString() })
      .eq('id', carte_id)
      .eq('commercant_id', req.commercant.id);

    // Supprimer les récompenses débloquées pour cette carte
    await supabase
      .from('recompenses_debloquees')
      .delete()
      .eq('carte_id', carte_id);

    res.json({ success: true, message: 'Récompenses réinitialisées ! Nouveau cycle.' });
  } catch (err) {
    console.error('POST /rewards/reset error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
