/**
 * Stamply — Analytics / Tableau de bord
 * 
 * Statistiques et graphiques pour les commerçants :
 * - Visites (quotidiennes, hebdomadaires, mensuelles)
 * - Rétention des clients
 * - Avis (moyenne, distribution)
 * - Revenus estimés
 * - Comparaison par boutique
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const { query, validationResult } = require('express-validator');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'stamply-dev-secret';

// ============================================
// MIDDLEWARE AUTH
// ============================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'Token requis' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, error: 'Token invalide' });
    req.user = user;
    next();
  });
}

// ============================================
// GET /api/analytics/dashboard
// Dashboard complet avec toutes les stats
// ============================================
router.get('/dashboard', authenticateToken, [
  query('periode').optional().isIn(['7d', '30d', '90d', '1y', 'all']),
  query('boutique_id').optional().isUUID(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const commercantId = req.user.id;
    const { periode = '30d', boutique_id } = req.query;

    // Calculer la date de début
    const now = new Date();
    let dateDebut;
    switch (periode) {
      case '7d': dateDebut = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': dateDebut = new Date(now - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': dateDebut = new Date(now - 90 * 24 * 60 * 60 * 1000); break;
      case '1y': dateDebut = new Date(now - 365 * 24 * 60 * 60 * 1000); break;
      default: dateDebut = new Date(2020, 0, 1);
    }

    const dateDebutISO = dateDebut.toISOString();

    // Construire les filtres de base
    const baseFilter = (q) => {
      let filtered = q.eq('commercant_id', commercantId);
      if (boutique_id) filtered = filtered.eq('boutique_id', boutique_id);
      return filtered;
    };

    // ===== VISITES =====
    let visitesQuery = supabase
      .from('visites')
      .select('id, date_visite, client_id')
      .gte('date_visite', dateDebutISO);

    visitesQuery = baseFilter(visitesQuery);
    const { data: visites } = await visitesQuery;

    // Visites par jour
    const visitesParJour = {};
    (visites || []).forEach(v => {
      const jour = v.date_visite.split('T')[0];
      visitesParJour[jour] = (visitesParJour[jour] || 0) + 1;
    });

    // Clients uniques
    const clientsUniques = new Set((visites || []).map(v => v.client_id)).size;

    // ===== AVIS =====
    let avisQuery = supabase
      .from('avis')
      .select('id, note, created_at')
      .gte('created_at', dateDebutISO);

    avisQuery = baseFilter(avisQuery);
    const { data: avis } = await avisQuery;

    const moyenneAvis = avis?.length
      ? (avis.reduce((sum, a) => sum + a.note, 0) / avis.length).toFixed(1)
      : 0;

    const distributionAvis = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    (avis || []).forEach(a => {
      if (a.note >= 1 && a.note <= 5) distributionAvis[a.note]++;
    });

    // ===== CLIENTS (rétention) =====
    // Clients qui ont visité au moins 2 fois
    const { data: clientsRecurrents } = await supabase
      .from('visites')
      .select('client_id')
      .eq('commercant_id', commercantId)
      .gte('date_visite', new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString());

    const visitesParClient = {};
    (clientsRecurrents || []).forEach(v => {
      visitesParClient[v.client_id] = (visitesParClient[v.client_id] || 0) + 1;
    });

    const clientsRecurrentsCount = Object.values(visitesParClient).filter(c => c >= 2).length;

    // ===== OFFRES FLASH =====
    let offresQuery = supabase
      .from('offres_flash')
      .select('id, reclamations_count, vues_count')
      .eq('commercant_id', commercantId);

    if (boutique_id) offresQuery = offresQuery.eq('boutique_id', boutique_id);
    const { data: offres } = await offresQuery;

    const totalVuesOffres = offres?.reduce((sum, o) => sum + (o.vues_count || 0), 0) || 0;
    const totalReclamations = offres?.reduce((sum, o) => sum + (o.reclamations_count || 0), 0) || 0;

    // ===== COMPARAISON PAR BOUTIQUE =====
    let boutiquesQuery = supabase
      .from('boutiques')
      .select('id, nom')
      .eq('commercant_id', commercantId);

    const { data: boutiques } = await boutiquesQuery;

    const statsParBoutique = [];
    if (boutiques && boutiques.length > 0) {
      for (const boutique of boutiques) {
        const { data: vBoutique } = await supabase
          .from('visites')
          .select('id', { count: 'exact', head: true })
          .eq('boutique_id', boutique.id)
          .gte('date_visite', dateDebutISO);

        const { data: aBoutique } = await supabase
          .from('avis')
          .select('note')
          .eq('boutique_id', boutique.id)
          .gte('created_at', dateDebutISO);

        const moyBoutique = aBoutique?.length
          ? (aBoutique.reduce((s, a) => s + a.note, 0) / aBoutique.length).toFixed(1)
          : 0;

        statsParBoutique.push({
          boutique_id: boutique.id,
          nom: boutique.nom,
          visites: vBoutique?.length || 0,
          avis_moyenne: parseFloat(moyBoutique),
          avis_count: aBoutique?.length || 0,
        });
      }
    }

    // ===== COMPARAISON PÉRIODÉ PRÉCÉDENTE =====
    const dureePeriode = now.getTime() - dateDebut.getTime();
    const dateDebutPrecedente = new Date(dateDebut.getTime() - dureePeriode).toISOString();

    const { count: visitesPrecedentes } = await supabase
      .from('visites')
      .select('id', { count: 'exact', head: true })
      .eq('commercant_id', commercantId)
      .gte('date_visite', dateDebutPrecedente)
      .lt('date_visite', dateDebutISO);

    const evolutionVisites = visitesPrecedentes > 0
      ? (((visites?.length || 0) - visitesPrecedentes) / visitesPrecedentes * 100).toFixed(1)
      : null;

    // ===== ASSEMBLER LE DASHBOARD =====
    const dashboard = {
      periode,
      date_debut: dateDebutISO,
      date_fin: now.toISOString(),

      visites: {
        total: visites?.length || 0,
        par_jour: visitesParJour,
        clients_uniques: clientsUniques,
        evolution_pourcentage: evolutionVisites ? parseFloat(evolutionVisites) : null,
      },

      clients: {
        uniques: clientsUniques,
        recurrents: clientsRecurrentsCount,
        taux_retention: clientsUniques > 0
          ? ((clientsRecurrentsCount / clientsUniques) * 100).toFixed(1)
          : 0,
      },

      avis: {
        total: avis?.length || 0,
        moyenne: parseFloat(moyenneAvis),
        distribution: distributionAvis,
        taux_satisfaction: avis?.length > 0
          ? (((distributionAvis[4] + distributionAvis[5]) / avis.length) * 100).toFixed(1)
          : 0,
      },

      offres_flash: {
        vues: totalVuesOffres,
        reclamations: totalReclamations,
        taux_conversion: totalVuesOffres > 0
          ? ((totalReclamations / totalVuesOffres) * 100).toFixed(1)
          : 0,
      },

      par_boutique: statsParBoutique,
    };

    res.json({ success: true, data: dashboard });
  } catch (err) {
    console.error('GET /analytics/dashboard error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// GET /api/analytics/visites-hebdo
// Visites des 7 derniers jours (pour graphique)
// ============================================
router.get('/visites-hebdo', authenticateToken, async (req, res) => {
  try {
    const commercantId = req.user.id;
    const { boutique_id } = req.query;
    const now = new Date();
    const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    const visitesParJour = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const cle = jours[d.getDay()] + ' ' + d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      visitesParJour[cle] = 0;
    }

    let query = supabase
      .from('visites')
      .select('date_visite')
      .eq('commercant_id', commercantId)
      .gte('date_visite', new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (boutique_id) query = query.eq('boutique_id', boutique_id);

    const { data, error } = await query;
    if (error) throw error;

    (data || []).forEach(v => {
      const d = new Date(v.date_visite);
      const cle = jours[d.getDay()] + ' ' + d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      if (visitesParJour[cle] !== undefined) {
        visitesParJour[cle]++;
      }
    });

    res.json({
      success: true,
      data: {
        labels: Object.keys(visitesParJour),
        values: Object.values(visitesParJour),
      },
    });
  } catch (err) {
    console.error('GET /analytics/visites-hebdo error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// GET /api/analytics/clients-top
// Top 10 des clients les plus fidèles
// ============================================
router.get('/clients-top', authenticateToken, [
  query('limit').optional().isInt({ min: 1, max: 50 }),
], async (req, res) => {
  try {
    const commercantId = req.user.id;
    const { boutique_id, limit = 10 } = req.query;

    let query = supabase
      .from('visites')
      .select('client_id, clients(nom, email, telephone)')
      .eq('commercant_id', commercantId);

    if (boutique_id) query = query.eq('boutique_id', boutique_id);

    const { data, error } = await query;
    if (error) throw error;

    // Compter les visites par client
    const clientMap = new Map();
    (data || []).forEach(v => {
      const id = v.client_id;
      if (!clientMap.has(id)) {
        clientMap.set(id, {
          client_id: id,
          nom: v.clients?.nom || 'Client #' + id.substring(0, 8),
          visites: 0,
        });
      }
      clientMap.get(id).visites++;
    });

    // Trier par nombre de visites
    const topClients = Array.from(clientMap.values())
      .sort((a, b) => b.visites - a.visites)
      .slice(0, parseInt(limit));

    res.json({ success: true, data: topClients });
  } catch (err) {
    console.error('GET /analytics/clients-top error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// GET /api/analytics/revenus-estimes
// Revenus moyens par clients / jour sur la periode
// ============================================
router.get('/revenus-estimes', authenticateToken, async (req, res) => {
  try {
    const commercantId = req.user.id;
    const { periode = '30d', moyenne_achat = 15, boutique_id } = req.query;

    const now = new Date();
    const jours = periode === '7d' ? 7 : periode === '90d' ? 90 : 30;
    const dateDebut = new Date(now - jours * 24 * 60 * 60 * 1000);

    let query = supabase
      .from('visites')
      .select('id')
      .eq('commercant_id', commercantId)
      .gte('date_visite', dateDebut.toISOString());

    if (boutique_id) query = query.eq('boutique_id', boutique_id);

    const { data, error } = await query;
    if (error) throw error;

    const totalVisites = data?.length || 0;
    const nbJours = Math.max(1, jours);
    const visitesJour = (totalVisites / nbJours).toFixed(1);
    const revenusEstimesTotal = totalVisites * parseFloat(moyenne_achat);
    const revenusEstimesJour = (revenusEstimesTotal / nbJours).toFixed(2);
    const revenusEstimesMois = (revenusEstimesJour * 30).toFixed(2);

    res.json({
      success: true,
      data: {
        periode: `${jours} jours`,
        total_visites: totalVisites,
        visites_par_jour: parseFloat(visitesJour),
        moyenne_achat_estimee: parseFloat(moyenne_achat),
        revenus_estimes_total: parseFloat(revenusEstimesTotal.toFixed(2)),
        revenus_estimes_jour: parseFloat(revenusEstimesJour),
        revenus_estimes_mois: parseFloat(revenusEstimesMois),
        cout_stamply_mois: 49,
        roi_estime: (parseFloat(revenusEstimesMois) - 49).toFixed(2),
      },
    });
  } catch (err) {
    console.error('GET /analytics/revenus-estimes error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
