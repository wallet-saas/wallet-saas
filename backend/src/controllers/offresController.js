const { supabase } = require('../config/supabase');
const { sendPushNotification } = require('../services/notificationService');

/**
 * ⚠️  TABLE `offres` MANQUANTE DANS LE SCHÉMA SUPABASE
 *
 * Avant d'utiliser ce module, exécuter ce SQL dans Supabase → SQL Editor :
 *
 * CREATE TABLE offres (
 *   id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   commercant_id     uuid REFERENCES commercants(id) ON DELETE CASCADE NOT NULL,
 *   titre             varchar NOT NULL,
 *   description       text,
 *   code_promo        varchar,
 *   reduction_pct     numeric,           -- ex: 20 pour 20%
 *   reduction_montant numeric,           -- ex: 5 pour 5€
 *   date_debut        timestamptz DEFAULT now(),
 *   date_fin          timestamptz,
 *   actif             bool DEFAULT true,
 *   total_envoyes     int4 DEFAULT 0,
 *   total_utilises    int4 DEFAULT 0,
 *   created_at        timestamptz DEFAULT now(),
 *   updated_at        timestamptz DEFAULT now()
 * );
 */

// ---------------------------------------------------------------------------
// POST /api/offres/create
// ---------------------------------------------------------------------------
const createOffre = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const {
      titre, description, code_promo,
      reduction_pct, reduction_montant,
      date_debut, date_fin
    } = req.body;

    if (!titre?.trim()) {
      return res.status(400).json({ success: false, error: 'Le titre est requis.' });
    }
    if (!reduction_pct && !reduction_montant) {
      return res.status(400).json({
        success: false,
        error: 'Au moins un type de réduction est requis (reduction_pct ou reduction_montant).'
      });
    }

    const { data: offre, error } = await supabase
      .from('offres')
      .insert([{
        commercant_id: commercantId,
        titre: titre.trim(),
        description: description?.trim() || null,
        code_promo: code_promo?.trim().toUpperCase() || null,
        reduction_pct: reduction_pct ? parseFloat(reduction_pct) : null,
        reduction_montant: reduction_montant ? parseFloat(reduction_montant) : null,
        date_debut: date_debut || new Date().toISOString(),
        date_fin: date_fin || null,
        actif: true
      }])
      .select()
      .single();

    if (error) {
      console.error('Erreur création offre:', error);
      // Message d'aide si la table n'existe pas encore
      if (error.code === '42P01') {
        return res.status(500).json({
          success: false,
          error: 'Table `offres` introuvable. Créez-la d\'abord dans Supabase (voir commentaire dans offresController.js).'
        });
      }
      return res.status(500).json({ success: false, error: 'Erreur lors de la création de l\'offre.' });
    }

    return res.status(201).json({ success: true, data: { offre } });

  } catch (error) {
    console.error('Erreur createOffre:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de la création de l\'offre.' });
  }
};

// ---------------------------------------------------------------------------
// GET /api/offres/list
// ---------------------------------------------------------------------------
const listOffres = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { actif } = req.query;

    let query = supabase
      .from('offres')
      .select('*')
      .eq('commercant_id', commercantId)
      .order('created_at', { ascending: false });

    if (actif === 'true') query = query.eq('actif', true);
    if (actif === 'false') query = query.eq('actif', false);

    const { data: offres, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        return res.status(500).json({
          success: false,
          error: 'Table `offres` introuvable. Créez-la d\'abord dans Supabase.'
        });
      }
      return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des offres.' });
    }

    // Marquer automatiquement les offres expirées
    const now = new Date();
    const offresAvecStatut = offres.map(o => ({
      ...o,
      expiree: o.date_fin ? new Date(o.date_fin) < now : false
    }));

    return res.status(200).json({
      success: true,
      count: offres.length,
      data: { offres: offresAvecStatut }
    });

  } catch (error) {
    console.error('Erreur listOffres:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des offres.' });
  }
};

// ---------------------------------------------------------------------------
// POST /api/offres/:id/send
// Envoyer une offre flash par notification push à tous les clients
// ---------------------------------------------------------------------------
const sendOffre = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { id } = req.params;
    const { cible = 'tous' } = req.body;

    // Vérifier que l'offre appartient à ce commerçant et est active
    const { data: offre, error: offreError } = await supabase
      .from('offres')
      .select('*')
      .eq('id', id)
      .eq('commercant_id', commercantId)
      .single();

    if (offreError || !offre) {
      return res.status(404).json({ success: false, error: 'Offre introuvable ou non autorisée.' });
    }

    if (!offre.actif) {
      return res.status(400).json({ success: false, error: 'Cette offre est désactivée.' });
    }

    // Construire le message de notification
    const reduction = offre.reduction_pct
      ? `-${offre.reduction_pct}%`
      : offre.reduction_montant
        ? `-${offre.reduction_montant}€`
        : '';

    const titre = `🔥 Offre flash ${reduction} — ${offre.titre}`;
    const message = offre.description || `Profitez de cette offre exclusive${offre.code_promo ? ` avec le code ${offre.code_promo}` : ''} !`;

    // Envoyer via le service de notifications
    const { totalCible, totalEnvoyes, simulation } = await sendPushNotification(
      commercantId, titre, message, cible
    );

    // Mettre à jour total_envoyes de l'offre
    await supabase
      .from('offres')
      .update({
        total_envoyes: offre.total_envoyes + totalEnvoyes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // Enregistrer la notification en DB
    await supabase.from('notifications').insert([{
      commercant_id: commercantId,
      titre,
      message,
      type: 'push',
      cible,
      total_envoyes: totalEnvoyes,
      envoyee: true
    }]);

    return res.status(200).json({
      success: true,
      simulation,
      message: `Offre flash envoyée à ${totalEnvoyes}/${totalCible} clients.`,
      data: { totalCible, totalEnvoyes }
    });

  } catch (error) {
    console.error('Erreur sendOffre:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de l\'envoi de l\'offre.' });
  }
};

// ---------------------------------------------------------------------------
// GET /api/offres/:id/stats
// Statistiques d'utilisation d'une offre (taux de conversion)
// ---------------------------------------------------------------------------
const getOffreStats = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { id } = req.params;

    const { data: offre, error } = await supabase
      .from('offres')
      .select('*')
      .eq('id', id)
      .eq('commercant_id', commercantId)
      .single();

    if (error || !offre) {
      return res.status(404).json({ success: false, error: 'Offre introuvable ou non autorisée.' });
    }

    const tauxUtilisation = offre.total_envoyes > 0
      ? Math.round((offre.total_utilises / offre.total_envoyes) * 100 * 10) / 10
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        offre: {
          id: offre.id,
          titre: offre.titre,
          actif: offre.actif,
          date_debut: offre.date_debut,
          date_fin: offre.date_fin
        },
        stats: {
          totalEnvoyes: offre.total_envoyes,
          totalUtilises: offre.total_utilises,
          tauxUtilisation  // en %
        }
      }
    });

  } catch (error) {
    console.error('Erreur getOffreStats:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des stats.' });
  }
};

// ---------------------------------------------------------------------------
// POST /api/offres/:id/use  (PUBLIC — appelé quand un client utilise un code promo)
// Incrémenter total_utilises
// ---------------------------------------------------------------------------
const markOffreUsed = async (req, res) => {
  try {
    const { id } = req.params;
    const { code_promo } = req.body;

    const { data: offre, error } = await supabase
      .from('offres')
      .select('id, code_promo, total_utilises, actif')
      .eq('id', id)
      .single();

    if (error || !offre) {
      return res.status(404).json({ success: false, error: 'Offre introuvable.' });
    }
    if (!offre.actif) {
      return res.status(400).json({ success: false, error: 'Offre expirée ou désactivée.' });
    }
    if (offre.code_promo && offre.code_promo !== code_promo?.toUpperCase()) {
      return res.status(400).json({ success: false, error: 'Code promo invalide.' });
    }

    await supabase
      .from('offres')
      .update({ total_utilises: offre.total_utilises + 1, updated_at: new Date().toISOString() })
      .eq('id', id);

    return res.status(200).json({ success: true, message: 'Offre enregistrée comme utilisée.' });

  } catch (error) {
    console.error('Erreur markOffreUsed:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de l\'enregistrement.' });
  }
};

module.exports = {
  createOffre,
  listOffres,
  sendOffre,
  getOffreStats,
  markOffreUsed
};
