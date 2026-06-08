const express = require('express');
const router = express.Router();
const {
  listBoutiques,
  getBoutique,
  createBoutique,
  updateBoutique,
  deleteBoutique,
  getBoutiqueStats,
  getGlobalStats,
} = require('../controllers/boutiquesController');
const authMiddleware = require('../middleware/authMiddleware');

// --- Routes protégées (commerçant) ---

/** GET /api/boutiques — Liste des boutiques */
router.get('/', authMiddleware, listBoutiques);

/** GET /api/boutiques/global-stats — Stats globales */
router.get('/global-stats', authMiddleware, getGlobalStats);

/** GET /api/boutiques/:id — Détail d'une boutique */
router.get('/:id', authMiddleware, getBoutique);

/** POST /api/boutiques — Créer une boutique */
router.post('/', authMiddleware, createBoutique);

/** PUT /api/boutiques/:id — Modifier une boutique */
router.put('/:id', authMiddleware, updateBoutique);

/** DELETE /api/boutiques/:id — Désactiver une boutique */
router.delete('/:id', authMiddleware, deleteBoutique);

/** GET /api/boutiques/:id/stats — Stats d'une boutique */
router.get('/:id/stats', authMiddleware, getBoutiqueStats);

module.exports = router;
