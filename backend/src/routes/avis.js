const express = require('express');
const router = express.Router();
const {
  requestAvis,
  listAvis,
  suggestResponse,
  sendResponse,
  getAvisForm,
  submitAvis
} = require('../controllers/avisController');
const authMiddleware = require('../middleware/authMiddleware');

// --- Routes protégées (commerçant) ---

/** POST /api/avis/request — Déclencher une demande d'avis pour une carte */
router.post('/request', authMiddleware, requestAvis);

/** GET /api/avis/list — Liste des avis reçus (filtres: source, note_min, note_max, repondu) */
router.get('/list', authMiddleware, listAvis);

/** POST /api/avis/suggest-response — Générer une réponse IA via Anthropic */
router.post('/suggest-response', authMiddleware, suggestResponse);

/** POST /api/avis/send-response — Valider et envoyer la réponse sur Google */
router.post('/send-response', authMiddleware, sendResponse);

// --- Routes publiques (client) ---

/** GET /api/avis/form/:carteId — Formulaire HTML d'évaluation client */
router.get('/form/:carteId', getAvisForm);

/** POST /api/avis/submit — Soumission de l'avis depuis le formulaire client */
router.post('/submit', submitAvis);

module.exports = router;
