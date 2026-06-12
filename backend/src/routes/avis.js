const express = require('express');
const router = express.Router();
const {
  requestAvis,
  listAvis,
  getTemplates,
  updateTemplates,
  sendResponse,
  getCollecteForm,
  submitCollecte
} = require('../controllers/avisController');
const authMiddleware = require('../middleware/authMiddleware');

// --- Routes protégées (commerçant) ---

/** GET /api/avis — Liste des avis reçus (filtres: source, note_min, note_max, repondu) */
router.get('/', authMiddleware, listAvis);

/** POST /api/avis/request — Déclencher une demande d'avis pour une carte */
router.post('/request', authMiddleware, requestAvis);

/** GET /api/avis/list — Alias liste des avis */
router.get('/list', authMiddleware, listAvis);

/** POST /api/avis/get-templates — Récupère les templates remplis pour un avis */
router.post('/get-templates', authMiddleware, getTemplates);

/** PUT /api/avis/templates — Sauvegarde les templates du commerçant */
router.put('/templates', authMiddleware, updateTemplates);

/** POST /api/avis/send-response — Valider et envoyer la réponse */
router.post('/send-response', authMiddleware, sendResponse);

// --- Routes publiques (client) ---

/** GET /api/avis/collecte/:commercantId — Formulaire d'avis public par commerçant */
router.get('/collecte/:commercantId', getCollecteForm);

/** POST /api/avis/submit-collecte — Soumission d'un avis via le formulaire de collecte */
router.post('/submit-collecte', submitCollecte);

module.exports = router;
