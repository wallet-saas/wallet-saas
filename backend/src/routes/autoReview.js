const express = require('express');
const router = express.Router();
const {
  scheduleReviewNotification,
  getInternalFeedback,
  getReviewFormHTML,
  getFeedbackFormHTML,
} = require('../services/autoReviewService');
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * POST /api/auto-review/schedule
 * Programme une notification d'avis après un scan
 * Appelé automatiquement par le scan controller
 */
router.post('/schedule', authMiddleware, async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { carte_id, points } = req.body;

    if (!carte_id) {
      return res.status(400).json({ success: false, error: 'carte_id requis.' });
    }

    const result = await scheduleReviewNotification(carte_id, commercantId, points);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[auto-review] Erreur:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/auto-review/feedback
 * Récupère les feedbacks internes (avis < 4 étoiles) du commerçant
 */
router.get('/feedback', authMiddleware, async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { limit = 50, offset = 0 } = req.query;
    const result = await getInternalFeedback(commercantId, parseInt(limit), parseInt(offset));
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/auto-review/settings
 * Récupère les paramètres d'avis automatique du commerçant
 */
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { data, error } = await supabase
      .from('commercants')
      .select('module_avis_google, delai_notif_avis_minutes, google_place_url, google_place_id')
      .eq('id', commercantId)
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/auto-review/settings
 * Met à jour les paramètres d'avis automatique
 */
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { module_avis_google, delai_notif_avis_minutes, google_place_url, google_place_id } = req.body;

    const updateData = {};
    if (typeof module_avis_google === 'boolean') updateData.module_avis_google = module_avis_google;
    if (typeof delai_notif_avis_minutes === 'number') updateData.delai_notif_avis_minutes = delai_notif_avis_minutes;
    if (google_place_url !== undefined) updateData.google_place_url = google_place_url;
    if (google_place_id !== undefined) updateData.google_place_id = google_place_id;

    const { data, error } = await supabase
      .from('commercants')
      .update(updateData)
      .eq('id', commercantId)
      .select('module_avis_google, delai_notif_avis_minutes, google_place_url, google_place_id')
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Routes publiques (client) ---

/**
 * GET /api/avis/:carteId
 * Formulaire d'avis client (page HTML avec étoiles)
 */
router.get('/:carteId', async (req, res) => {
  try {
    const { carteId } = req.params;
    const html = await getReviewFormHTML(carteId);
    res.send(html);
  } catch (err) {
    res.status(500).send('<h1>Erreur</h1>');
  }
});

/**
 * GET /api/avis/feedback/:carteId
 * Formulaire de feedback interne (pour avis < 4 étoiles)
 */
router.get('/feedback/:carteId', async (req, res) => {
  try {
    const { carteId } = req.params;
    const html = await getFeedbackFormHTML(carteId);
    res.send(html);
  } catch (err) {
    res.status(500).send('<h1>Erreur</h1>');
  }
});

/**
 * POST /api/avis/feedback/:carteId
 * Soumission du feedback interne
 */
router.post('/feedback/:carteId', async (req, res) => {
  try {
    const { carteId } = req.params;
    const { contenu } = req.body;

    // Récupérer la carte et son commerçant
    const { data: carte } = await supabase
      .from('cartes')
      .select('id, commercant_id')
      .eq('id', carteId)
      .single();

    if (!carte) {
      return res.status(404).json({ success: false, error: 'Carte introuvable.' });
    }

    // Enregistrer le feedback interne
    const { data: avis, error } = await supabase
      .from('avis')
      .insert([{
        commercant_id: carte.commercant_id,
        source: 'formulaire_prive',
        note: 0, // feedback interne = pas de note publique
        contenu: contenu?.trim() || null,
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data: { avisId: avis.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
