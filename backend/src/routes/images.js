const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * GET /api/images/:commercantId
 * Sert le logo d'un commerçant.
 * Priorité : carte_logo_url (Supabase) → logo par défaut du template → logo générique
 * Public — pas de JWT requis (les logos sont affichés sur les pages d'installation)
 */
router.get('/:commercantId', async (req, res) => {
  try {
    const { commercantId } = req.params;

    const { data: commercant, error } = await supabase
      .from('commercants')
      .select('carte_logo_url, template_metier')
      .eq('id', commercantId)
      .single();

    if (error || !commercant) {
      return res.status(404).json({ success: false, error: 'Commerçant introuvable.' });
    }

    // Si le logo est une URL externe (http/https), rediriger
    // MAIS ignorer les URLs qui pointent vers notre propre API (évite boucle infinie)
    const selfUrl = req.protocol + '://' + req.get('host');
    const logo = commercant.carte_logo_url || '';
    const isSelfUrl = logo && (
      logo.startsWith(selfUrl)
      || logo.startsWith('/api/')
      || logo.includes('stamply-backend')
      || logo.includes('render.com')
      || logo.includes('localhost')
      || logo.includes('127.0.0.1')
      || logo.includes('/api/images/')
      || logo.includes('/wallet/')
    );
    console.log('[images] logo=' + logo + ' | selfUrl=' + selfUrl + ' | isSelf=' + isSelfUrl);
    if (logo.startsWith('http') && !isSelfUrl) {
      return res.redirect(302, logo);
    }

    // Sinon, retourner les infos du logo en JSON (le frontend utilisera le template par défaut)
    const templateLogos = {
      boulangerie: 'https://placehold.co/200x200/D97706/ffffff?text=B',
      coiffeur: 'https://placehold.co/200x200/7C3AED/ffffff?text=C',
      restaurant: 'https://placehold.co/200x200/DC2626/ffffff?text=R',
      kine: 'https://placehold.co/200x200/059669/ffffff?text=K',
      garagiste: 'https://placehold.co/200x200/374151/ffffff?text=G',
    };

    // IGNORER le carte_logo_url s'il pointe vers notre propre API (évite boucle)
    // Priorité : logo custom (si externe) → logo template → placeholder générique
    const logoUrl = isSelfUrl
      ? (templateLogos[commercant.template_metier] || 'https://placehold.co/200x200/6366f1/ffffff?text=S')
      : (commercant.carte_logo_url || templateLogos[commercant.template_metier] || 'https://placehold.co/200x200/6366f1/ffffff?text=S');

    res.json({
      success: true,
      data: {
        logo_url: logoUrl,
        template_metier: commercant.template_metier,
      }
    });
  } catch (err) {
    console.error('[images] Erreur:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération du logo.' });
  }
});

/**
 * POST /api/images/upload
 * Upload un logo pour le commerçant connecté.
 * Accepte un fichier multipart (champ "logo") ou une URL (body JSON { logo_url }).
 * Protégé par JWT
 */
router.post('/upload', authMiddleware, async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { logo_url } = req.body;

    if (!logo_url) {
      return res.status(400).json({ success: false, error: 'logo_url requis.' });
    }

    // Valider que c'est une URL
    try {
      new URL(logo_url);
    } catch {
      return res.status(400).json({ success: false, error: 'URL invalide.' });
    }

    const { data, error } = await supabase
      .from('commercants')
      .update({ carte_logo_url: logo_url })
      .eq('id', commercantId)
      .select('carte_logo_url')
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: 'Erreur lors de la sauvegarde.' });
    }

    res.json({ success: true, data: { logo_url: data.carte_logo_url } });
  } catch (err) {
    console.error('[images] Erreur upload:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'upload.' });
  }
});

module.exports = router;
