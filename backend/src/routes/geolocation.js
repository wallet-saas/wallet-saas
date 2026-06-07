const express = require('express');
const router = express.Router();
const {
  triggerNotification,
  reportDeviceLocation,
  getStats
} = require('../controllers/geolocationController');
const authMiddleware = require('../middleware/authMiddleware');

/** POST /api/geolocation/trigger — Déclencher notif proximité (dashboard commerçant) */
router.post('/trigger', authMiddleware, triggerNotification);

/** GET /api/geolocation/stats — Stats conversions géoloc */
router.get('/stats', authMiddleware, getStats);

/**
 * POST /api/geolocation/device-location — Webhook position GPS device client (PUBLIC)
 * Appelé par une app mobile companion ou une PWA avec accès géolocalisation.
 * Le device envoie sa position → le serveur décide si notif à envoyer.
 */
router.post('/device-location', reportDeviceLocation);

module.exports = router;
