const express = require('express');
const router = express.Router();
const {
  sendNotification,
  getHistory,
  getStats,
  trackOpen
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');
const { notificationRateLimiter } = require('../middleware/rateLimiter');
const { notificationValidation, handleValidationErrors } = require('../middleware/validation');

/**
 * @route   POST /api/notifications/send
 * @desc    Envoyer une notification push manuellement
 * @body    { titre, message, cible: 'tous'|'actifs'|'dormants', planifiee_pour? }
 * @access  Private (JWT commerçant requis)
 */
router.post('/send', authMiddleware, notificationRateLimiter, notificationValidation, handleValidationErrors, sendNotification);

/**
 * @route   GET /api/notifications/history
 * @desc    Historique des notifications du commerçant
 * @query   ?limit=50&offset=0
 * @access  Private (JWT commerçant requis)
 */
router.get('/history', authMiddleware, getHistory);

/**
 * @route   GET /api/notifications/stats
 * @desc    Statistiques globales (envoyés, ouverts, taux, par cible)
 * @access  Private (JWT commerçant requis)
 */
router.get('/stats', authMiddleware, getStats);

/**
 * @route   POST /api/notifications/open/:id
 * @desc    Webhook de tracking d'ouverture (appelé par le device)
 * @access  Public (pas de JWT — appelé par le système client)
 */
router.post('/open/:id', trackOpen);

/**
 * @route   GET /api/notifications/open/:id
 * @desc    Tracking d'ouverture via pixel/lien (GET pour compatibilité email/wallet)
 * @access  Public
 */
router.get('/open/:id', trackOpen);

module.exports = router;
