const {
  getOverview,
  getCardsEvolution,
  getNotificationsStats,
  getClientsDormants,
  getAvisStats,
  getOffresStats
} = require('../services/analyticsService');
const { supabase } = require('../config/supabase');

// ---------------------------------------------------------------------------
// GET /api/analytics/overview
// Vue d'ensemble : cartes, visites, notifications, clients dormants
// ---------------------------------------------------------------------------
const overview = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const data = await getOverview(commercantId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Erreur analytics overview:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/analytics/cards
// Évolution des cartes installées sur N jours (?jours=30)
// ---------------------------------------------------------------------------
const cardsEvolution = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const jours = Math.min(parseInt(req.query.jours) || 30, 365);
    const data = await getCardsEvolution(commercantId, jours);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Erreur analytics cards:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/analytics/notifications
// Taux d'ouverture des notifications
// ---------------------------------------------------------------------------
const notificationsStats = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const data = await getNotificationsStats(commercantId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Erreur analytics notifications:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/analytics/clients-dormants
// Liste des clients inactifs depuis N jours (?seuil=30)
// ---------------------------------------------------------------------------
const clientsDormants = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const seuil = parseInt(req.query.seuil) || 30;
    const data = await getClientsDormants(commercantId, seuil);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Erreur analytics clients-dormants:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/analytics/avis
// Stats module avis Google
// ---------------------------------------------------------------------------
const avisStats = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;

    // Vérifier que le module est activé
    const { data: commercant } = await supabase
      .from('commercants')
      .select('module_avis_google')
      .eq('id', commercantId)
      .single();

    if (!commercant?.module_avis_google) {
      return res.status(200).json({
        success: true,
        moduleActif: false,
        message: 'Le module Avis Google est désactivé pour ce commerçant.'
      });
    }

    const data = await getAvisStats(commercantId);
    return res.status(200).json({ success: true, moduleActif: true, data });

  } catch (error) {
    console.error('Erreur analytics avis:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/analytics/offres
// Performance des offres flash
// ---------------------------------------------------------------------------
const offresStats = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;

    const { data: commercant } = await supabase
      .from('commercants')
      .select('module_offres_flash')
      .eq('id', commercantId)
      .single();

    if (!commercant?.module_offres_flash) {
      return res.status(200).json({
        success: true,
        moduleActif: false,
        message: 'Le module Offres Flash est désactivé pour ce commerçant.'
      });
    }

    const data = await getOffresStats(commercantId);
    return res.status(200).json({ success: true, moduleActif: true, data });

  } catch (error) {
    console.error('Erreur analytics offres:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  overview,
  cardsEvolution,
  notificationsStats,
  clientsDormants,
  avisStats,
  offresStats
};
