const express = require('express');
const router = express.Router();
const {
  createOffre,
  listOffres,
  sendOffre,
  getOffreStats,
  markOffreUsed
} = require('../controllers/offresController');
const authMiddleware = require('../middleware/authMiddleware');
const { offreValidation, handleValidationErrors } = require('../middleware/validation');

/** POST /api/offres/create — Créer une offre flash */
router.post('/create', authMiddleware, offreValidation, handleValidationErrors, createOffre);

/** GET /api/offres/list — Liste des offres (?actif=true|false) */
router.get('/list', authMiddleware, listOffres);

/** POST /api/offres/:id/send — Envoyer l'offre par notif push (?cible=tous|actifs|dormants) */
router.post('/:id/send', authMiddleware, sendOffre);

/** GET /api/offres/:id/stats — Stats utilisation de l'offre */
router.get('/:id/stats', authMiddleware, getOffreStats);

/** POST /api/offres/:id/use — Marquer une offre comme utilisée (PUBLIC — appelé côté client) */
router.post('/:id/use', markOffreUsed);

module.exports = router;
