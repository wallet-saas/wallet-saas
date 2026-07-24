/**
 * Stamply — Routes Relance Automatique
 * 
 * Endpoints pour gérer les relances clients dormants
 * et les notifications d'anniversaire.
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const relanceService = require('../services/relanceService');
const commercantAnalyticsService = require('../services/commercantAnalyticsService');

// ─── POST /api/relance/cron ─────────────────────────────────────────────────
// Endpoint GLOBAL pour les crons Render : relance dormants + anniversaires
// pour TOUS les commerçants ayant activé ces options.
// Sécurisé par header x-cron-secret (env CRON_SECRET) — PAS par JWT commerçant,
// car un cron n'a pas de session. Les autres endpoints restent par-commerçant.

router.post('/cron', async (req, res) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return res.status(503).json({ success: false, error: 'CRON_SECRET non configuré sur le serveur.' });
    }
    if (req.headers['x-cron-secret'] !== cronSecret) {
      return res.status(401).json({ success: false, error: 'Secret cron invalide.' });
    }

    const { supabase } = require('../config/supabase');
    const { data: commercants, error } = await supabase
      .from('commercants')
      .select('id, nom_enseigne, relance_auto, anniversaire_auto')
      .or('relance_auto.eq.true,anniversaire_auto.eq.true');

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const resultats = [];
    for (const commercant of commercants || []) {
      const resultat = { commercant_id: commercant.id, nom: commercant.nom_enseigne };
      try {
        if (commercant.relance_auto) {
          resultat.relance = await relanceService.relanceDormants(commercant.id);
        }
        if (commercant.anniversaire_auto) {
          resultat.anniversaire = await relanceService.anniversaire(commercant.id);
        }
      } catch (err) {
        resultat.erreur = err.message;
        console.error(`[Cron relance] Erreur ${commercant.id}:`, err.message);
      }
      resultats.push(resultat);
    }

    console.log(`[Cron relance] ✅ ${resultats.length} commerçants traités`);
    return res.status(200).json({ success: true, traites: resultats.length, resultats });
  } catch (err) {
    console.error('[Cron relance] Erreur globale:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/relance/check ─────────────────────────────────────────────────
// Vérifie si des relances ou anniversaires sont dus

router.get('/check', authMiddleware, async (req, res) => {
  try {
    const commercantId = req.commercant.id;

    // Récupérer les infos du commerçant pour les flags
    const { supabase } = require('../config/supabase');
    const { data: commercant, error } = await supabase
      .from('commercants')
      .select('id, relance_auto, relance_jours, anniversaire_auto')
      .eq('id', commercantId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Commerçant introuvable'
      });
    }

    // Vérifier s'il y a des cartes dormantes à relancer
    let cartesDormantes = 0;
    if (commercant.relance_auto) {
      const dateSeuil = new Date();
      dateSeuil.setDate(dateSeuil.getDate() - (commercant.relance_jours || 30));

      const { count } = await supabase
        .from('cartes')
        .select('id', { count: 'exact', head: true })
        .eq('commercant_id', commercantId)
        .lt('last_visit_at', dateSeuil.toISOString())
        .not('last_visit_at', 'is', null);

      cartesDormantes = count || 0;
    }

    // Vérifier s'il y a des anniversaires aujourd'hui
    let anniversairesAujourdhui = 0;
    if (commercant.anniversaire_auto) {
      const aujourdHui = new Date();
      const mois = String(aujourdHui.getMonth() + 1).padStart(2, '0');
      const jour = String(aujourdHui.getDate()).padStart(2, '0');

      const { data: cartes } = await supabase
        .from('cartes')
        .select('id')
        .eq('commercant_id', commercantId);

      const carteIds = (cartes || []).map(c => c.id);

      if (carteIds.length > 0) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, date_naissance')
          .in('carte_id', carteIds)
          .not('date_naissance', 'is', null);

        anniversairesAujourdhui = (clients || []).filter(client => {
          if (!client.date_naissance) return false;
          const d = new Date(client.date_naissance);
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const j = String(d.getDate()).padStart(2, '0');
          return m === mois && j === jour;
        }).length;
      }
    }

    res.json({
      success: true,
      data: {
        relanceActive: !!commercant.relance_auto,
        anniversaireActif: !!commercant.anniversaire_auto,
        cartesDormantes,
        anniversairesAujourdhui,
        verifieLe: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('[Relance] Erreur check:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ─── POST /api/relance/run ──────────────────────────────────────────────────
// Exécute la relance manuellement

router.post('/run', authMiddleware, async (req, res) => {
  try {
    const commercantId = req.commercant.id;
    const resultat = await relanceService.relanceDormants(commercantId);

    res.json({
      success: true,
      data: resultat
    });

  } catch (err) {
    console.error('[Relance] Erreur run:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ─── POST /api/relance/anniversaire ─────────────────────────────────────────
// Exécute les anniversaires manuellement

router.post('/anniversaire', authMiddleware, async (req, res) => {
  try {
    const commercantId = req.commercant.id;
    const resultat = await relanceService.anniversaire(commercantId);

    res.json({
      success: true,
      data: resultat
    });

  } catch (err) {
    console.error('[Relance] Erreur anniversaire:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;