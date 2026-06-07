const express = require('express');
const router = express.Router();
const {
  overview,
  cardsEvolution,
  notificationsStats,
  clientsDormants,
  avisStats,
  offresStats
} = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

// Toutes les routes analytics sont protégées par JWT
router.use(authMiddleware);

/** GET /api/analytics — Alias vers overview */
router.get('/', overview);

/** GET /api/analytics/overview — Vue d'ensemble (cartes, visites, notifications) */
router.get('/overview', overview);

/** GET /api/analytics/cards — Évolution cartes installées (?jours=30) */
router.get('/cards', cardsEvolution);

/** GET /api/analytics/notifications — Taux d'ouverture notifications */
router.get('/notifications', notificationsStats);

/** GET /api/analytics/clients-dormants — Clients inactifs (?seuil=30) */
router.get('/clients-dormants', clientsDormants);

/** GET /api/analytics/avis — Stats module Avis Google */
router.get('/avis', avisStats);

/** GET /api/analytics/offres — Performance module Offres Flash */
router.get('/offres', offresStats);

module.exports = router;
