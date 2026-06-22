/**
 * Stamply — Routes Admin
 * 
 * Panel d'administration pour gérer les commerçants, abonnements, stats.
 * 
 * Authentification : X-Admin-Key header OU JWT admin
 * 
 * Routes :
 *   GET    /api/admin/stats              — Stats globales
 *   GET    /api/admin/commercants        — Liste commerçants (pagination, recherche)
 *   GET    /api/admin/commercants/:id    — Fiche détaillée
 *   PUT    /api/admin/commercants/:id    — Modifier un commerçant
 *   POST   /api/admin/commercants/:id/reset-password  — Reset mot de passe
 *   POST   /api/admin/commercants/:id/suspendre       — Suspendre
 *   POST   /api/admin/commercants/:id/reactiver       — Réactiver
 *   DELETE /api/admin/commercants/:id                 — Supprimer
 *   GET    /api/admin/feedbacks          — Feedbacks clients (<4 étoiles)
 *   GET    /api/admin/logs               — Logs admin
 */

const express = require('express');
const router = express.Router();
const { adminMiddleware } = require('../middleware/adminMiddleware');
const {
  listCommerçants,
  getCommercantDetail,
  resetPassword,
  updateCommercant,
  suspendreCommercant,
  reactiverCommercant,
  supprimerCommercant,
  getGlobalStats,
  logAdminAction,
  getAdminLogs,
  getFeedbacks,
} = require('../services/adminService');

// Toutes les routes admin sont protégées
router.use(adminMiddleware);

// ─── Stats globales ───────────────────────────────────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    const stats = await getGlobalStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('[Admin] GET /stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Commerçants ──────────────────────────────────────────────────────────────

router.get('/commercants', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', statut = 'all' } = req.query;
    const result = await listCommerçants({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      statut,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Admin] GET /commercants error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/commercants/:id', async (req, res) => {
  try {
    const detail = await getCommercantDetail(req.params.id);
    res.json({ success: true, data: detail });
  } catch (err) {
    console.error('[Admin] GET /commercants/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/commercants/:id', async (req, res) => {
  try {
    const updated = await updateCommercant(req.params.id, req.body);
    await logAdminAction('update_commercant', 'commercant', req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[Admin] PUT /commercants/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/commercants/:id/reset-password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, error: 'Mot de passe requis (8 caractères min).' });
    }
    await resetPassword(req.params.id, password);
    await logAdminAction('reset_password', 'commercant', req.params.id, {});
    res.json({ success: true, message: 'Mot de passe réinitialisé.' });
  } catch (err) {
    console.error('[Admin] POST /commercants/:id/reset-password error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/commercants/:id/suspendre', async (req, res) => {
  try {
    await suspendreCommercant(req.params.id);
    await logAdminAction('suspendre', 'commercant', req.params.id, {});
    res.json({ success: true, message: 'Commerçant suspendu.' });
  } catch (err) {
    console.error('[Admin] POST /commercants/:id/suspendre error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/commercants/:id/reactiver', async (req, res) => {
  try {
    await reactiverCommercant(req.params.id);
    await logAdminAction('reactiver', 'commercant', req.params.id, {});
    res.json({ success: true, message: 'Commerçant réactivé.' });
  } catch (err) {
    console.error('[Admin] POST /commercants/:id/reactiver error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/commercants/:id', async (req, res) => {
  try {
    await supprimerCommercant(req.params.id);
    await logAdminAction('supprimer', 'commercant', req.params.id, {});
    res.json({ success: true, message: 'Commerçant supprimé.' });
  } catch (err) {
    console.error('[Admin] DELETE /commercants/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Feedbacks ────────────────────────────────────────────────────────────────

router.get('/feedbacks', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await getFeedbacks({ page: parseInt(page), limit: parseInt(limit) });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Admin] GET /feedbacks error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Logs ─────────────────────────────────────────────────────────────────────

router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await getAdminLogs({ page: parseInt(page), limit: parseInt(limit) });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Admin] GET /logs error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
