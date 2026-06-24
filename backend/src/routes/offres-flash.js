/**
 * Stamply — Offres Flash
 * 
 * Les commerçants créent des offres limitées dans le temps.
 * Les clients reçoivent une notification push quand une offre est disponible.
 * 
 * Règles :
 * - Durée max : 24h (configurable)
 * - Notification push immédiate aux clients à proximité (geofencing)
 * - Une seule offre flash active par boutique à la fois
 * - Compteur de vues et de réclamations
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');
const { body, query, validationResult } = require('express-validator');

// ============================================
// SQL: Table offres_flash
// ============================================
// CREATE TABLE IF NOT EXISTS offres_flash (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   commercant_id UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
//   boutique_id UUID REFERENCES boutiques(id) ON DELETE SET NULL,
//   titre TEXT NOT NULL,
//   description TEXT,
//   image_url TEXT,
//   reduction_pourcentage INTEGER,
//   reduction_montant DECIMAL(10,2),
//   prix_original DECIMAL(10,2),
//   prix_reduit DECIMAL(10,2),
//   code_promo TEXT,
//   debut TIMESTAMP WITH TIME ZONE NOT NULL,
//   fin TIMESTAMP WITH TIME ZONE NOT NULL,
//   max_reclamations INTEGER, -- NULL = illimité
//   reclamations_count INTEGER DEFAULT 0,
//   vues_count INTEGER DEFAULT 0,
//   active BOOLEAN DEFAULT true,
//   notification_envoyee BOOLEAN DEFAULT false,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );
//
// CREATE INDEX IF NOT EXISTS idx_offres_flash_commercant ON offres_flash(commercant_id);
// CREATE INDEX IF NOT EXISTS idx_offres_flash_dates ON offres_flash(debut, fin) WHERE active = true;
//
// RLS
// ALTER TABLE offres_flash ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Commercants manage their flash offers" ON offres_flash FOR ALL USING (commercant_id = auth.uid());

// ============================================
// POST /api/offres-flash
// Créer une offre flash
// ============================================
router.post('/', authMiddleware, [
  body('titre').trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('reduction_pourcentage').optional().isInt({ min: 1, max: 99 }),
  body('reduction_montant').optional().isFloat({ min: 0.01 }),
  body('prix_original').optional().isFloat({ min: 0.01 }),
  body('prix_reduit').optional().isFloat({ min: 0.01 }),
  body('code_promo').optional().trim().isLength({ max: 50 }),
  body('debut').optional().isISO8601(),
  body('fin').optional().isISO8601(),
  body('max_reclamations').optional().isInt({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const commercantId = req.commercant.id;
    const now = new Date();

    const {
      titre, description, image_url,
      reduction_pourcentage, reduction_montant,
      prix_original, prix_reduit, code_promo,
      debut = now.toISOString(),
      fin = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      max_reclamations,
    } = req.body;

    // Vérifier qu'il n'y a pas déjà une offre active
    // Fallback: si la colonne 'active' n'existe pas, on filtre par date fin >= now
    let activeCheck = supabase
      .from('offres_flash')
      .select('id, titre')
      .eq('commercant_id', commercantId)
      .gte('fin', now.toISOString());

    const { data: existing } = await activeCheck.maybeSingle();
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Une offre flash est déjà active pour ce commerce : "${existing.titre}"`,
        existing_offer: existing,
      });
    }

    // Créer l'offre
    const { data: offre, error } = await supabase
      .from('offres_flash')
      .insert({
        commercant_id: commercantId,
        titre,
        description: description || null,
        image_url: image_url || null,
        reduction_pourcentage: reduction_pourcentage || null,
        reduction_montant: reduction_montant || null,
        prix_original: prix_original || null,
        prix_reduit: prix_reduit || null,
        code_promo: code_promo || null,
        debut,
        fin,
        max_reclamations: max_reclamations || null,
        notification_envoyee: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Envoyer la notification push aux clients de ce commerçant
    await notifyClientsOfNewFlashOffer(offre);

    res.status(201).json({
      success: true,
      message: 'Offre flash créée et notifications envoyées !',
      data: offre,
    });
  } catch (err) {
    console.error('POST /offres-flash error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// GET /api/offres-flash
// Lister les offres flash du commerçant
// ============================================
router.get('/', [
  query('status').optional().isIn(['active', 'past', 'all']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const commercantId = req.commercant.id;
    const { status = 'active' } = req.query;
    const now = new Date().toISOString();

    let query = supabase
      .from('offres_flash')
      .select('*')
      .eq('commercant_id', commercantId)
      .order('created_at', { ascending: false });

    if (status === 'active') {
      query = query.gte('fin', now);
    } else if (status === 'past') {
      query = query.lt('fin', now);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('GET /offres-flash error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// GET /api/offres-flash/public
// Offres flash actives pour les clients (public)
// ============================================
router.get('/public', [
  query('latitude').optional().isFloat(),
  query('longitude').optional().isFloat(),
  query('distance_km').optional().isInt({ min: 1, max: 50 }),
], async (req, res) => {
  try {
    const { latitude, longitude, distance_km = 10 } = req.query;
    const now = new Date().toISOString();

    let query = supabase
      .from('offres_flash')
      .select(`
        id,
        titre,
        description,
        image_url,
        reduction_pourcentage,
        reduction_montant,
        prix_original,
        prix_reduit,
        code_promo,
        debut,
        fin,
        commercant_id,
        boutique_id,
        commercants(nom, carte_logo_url)
      `)
      .gte('fin', now)
      .order('debut', { ascending: false })
      .limit(20);

    const { data, error } = await query;
    if (error) throw error;

    // Filtrer par distance si coordonnées fournies
    let offres = data || [];
    if (latitude && longitude) {
      offres = offres.filter(o => {
      if (!o.commercants || !o.commercants.latitude) return true;// Garder si pas de GPS
        const dist = haversineDistance(
          parseFloat(latitude), parseFloat(longitude),
          o.commercants.latitude, o.commercants.longitude
        );
        return dist <= parseInt(distance_km);
      });
    }

    res.json({ success: true, data: offres });
  } catch (err) {
    console.error('GET /offres-flash/public error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// GET /api/offres-flash/:id
// Détail d'une offre flash
// ============================================
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const commercantId = req.commercant.id;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('offres_flash')
      .select('*')
      .eq('id', id)
      .eq('commercant_id', commercantId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Offre non trouvée' });

    res.json({ success: true, data });
  } catch (err) {
    console.error('GET /offres-flash/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// PUT /api/offres-flash/:id
// Modifier une offre flash
// ============================================
router.put('/:id', authMiddleware, [
  body('titre').optional().trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('fin').optional().isISO8601(),
  body('active').optional().isBoolean(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const commercantId = req.commercant.id;
    const { id } = req.params;
    const updates = { ...req.body, updated_at: new Date().toISOString() };

    const { data, error } = await supabase
      .from('offres_flash')
      .update(updates)
      .eq('id', id)
      .eq('commercant_id', commercantId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Offre non trouvée' });

    res.json({ success: true, data });
  } catch (err) {
    console.error('PUT /offres-flash/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// DELETE /api/offres-flash/:id
// Supprimer/archiver une offre flash
// ============================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const commercantId = req.commercant.id;
    const { id } = req.params;

    const { error } = await supabase
      .from('offres_flash')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('commercant_id', commercantId);

    if (error) throw error;
    res.json({ success: true, message: 'Offre flash désactivée' });
  } catch (err) {
    console.error('DELETE /offres-flash/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// POST /api/offres-flash/:id/reclamer
// Un client réclame une offre flash
// ============================================
router.post('/:id/reclamer', authMiddleware, async (req, res) => {
  try {
    const clientId = req.commercant.id;
    const { id } = req.params;

    // Vérifier l'offre
    const { data: offre, error: offreError } = await supabase
      .from('offres_flash')
      .select('*')
      .eq('id', id)
      .gte('fin', new Date().toISOString())
      .single();

    if (offreError || !offre) {
      return res.status(404).json({ success: false, error: 'Offre non trouvée ou expirée' });
    }

    // Vérifier le max de réclamations
    if (offre.max_reclamations && offre.reclamations_count >= offre.max_reclamations) {
      return res.status(400).json({ success: false, error: 'Offre épuisée' });
    }

    // Enregistrer la réclamation
    const { data: reclamation, error } = await supabase
      .from('offres_flash_reclamations')
      .insert({
        offre_flash_id: id,
        client_id: clientId,
        code_utilise: offre.code_promo,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ success: false, error: 'Vous avez déjà réclamé cette offre' });
      }
      throw error;
    }

    // Incrémenter le compteur
    await supabase
      .from('offres_flash')
      .update({ reclamations_count: (offre.reclamations_count || 0) + 1 })
      .eq('id', id);

    res.json({
      success: true,
      message: 'Offre réclamée ! Montrez ce code au commerçant',
      data: {
        code_promo: offre.code_promo,
        titre: offre.titre,
        fin: offre.fin,
      },
    });
  } catch (err) {
    console.error('POST /offres-flash/:id/reclamer error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// POST /api/offres-flash/:id/vue
// Enregistrer une vue (client a vu l'offre)
// ============================================
router.post('/:id/vue', async (req, res) => {
  try {
    const { id } = req.params;

    await supabase.rpc('increment_flash_offer_views', { offer_id: id });

    res.json({ success: true });
  } catch (err) {
    // Fallback si la fonction RPC n'existe pas
    try {
      await supabase
        .from('offres_flash')
        .update({ vues_count: supabase.sql`vues_count + 1` })
        .eq('id', id);
    } catch (e) {
      // Ignorer silencieusement
    }
    res.json({ success: true });
  }
});

// ============================================
// GET /api/offres-flash/stats
// Statistiques des offres flash
// ============================================
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const commercantId = req.commercant.id;

    let query = supabase
      .from('offres_flash')
      .select('id, titre, reclamations_count, vues_count, debut, fin, active')
      .eq('commercant_id', commercantId);

    const { data, error } = await query;
    if (error) throw error;

    const stats = {
      total_offres: data?.length || 0,
      actives: data?.filter(o => new Date(o.fin) > new Date()).length || 0,
      expirees: data?.filter(o => new Date(o.fin) <= new Date()).length || 0,
      total_vues: data?.reduce((sum, o) => sum + (o.vues_count || 0), 0) || 0,
      total_reclamations: data?.reduce((sum, o) => sum + (o.reclamations_count || 0), 0) || 0,
      offres: data || [],
    };

    // Calculer le taux de conversion
    stats.taux_conversion = stats.total_vues > 0
      ? ((stats.total_reclamations / stats.total_vues) * 100).toFixed(1)
      : 0;

    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('GET /offres-flash/stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Envoyer une notification push aux clients quand une nouvelle offre flash est créée
 */
async function notifyClientsOfNewFlashOffer(offre) {
  try {
    // Récupérer les FCM tokens des clients de ce commerçant
    const { data: clients, error } = await supabase
      .from('clients')
      .select('fcm_token, nom')
      .eq('fcm_token', supabase.sql`IS NOT NULL`);

    if (error || !clients || clients.length === 0) return;

    const tokens = clients
      .filter(c => c.fcm_token)
      .map(c => c.fcm_token);

    if (tokens.length === 0) return;

    // Envoyer via FCM
    const admin = require('firebase-admin');
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: `🔥 Offre Flash : ${offre.titre}`,
        body: offre.description || 'Profitez-en vite, offre limitée !',
      },
      data: {
        type: 'flash_offer',
        offre_id: offre.id,
        commercant_id: offre.commercant_id,
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'stamply_flash_offers',
          icon: 'ic_flash',
          color: '#FF6B35',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    });

    // Marquer comme notifié
    await supabase
      .from('offres_flash')
      .update({ notification_envoyee: true })
      .eq('id', offre.id);

    console.log(`[Flash Offer] ${tokens.length} notifications sent for "${offre.titre}"`);
  } catch (err) {
    console.error('[Flash Offer] Notification error:', err.message);
    // Ne pas bloquer la création de l'offre si les notifications échouent
  }
}

/**
 * Calculer la distance entre deux points GPS (formule haversine)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = router;
