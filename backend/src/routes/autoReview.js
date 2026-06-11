/**
 * Stamply — Notifications Avis Auto
 * 
 * Règles :
 * 1. Notification envoyée **1 seule fois** par client après l'installation de la carte
 * 2. Si le client n'a pas ouvert la notification, pas de renvoi (pas de spam)
 * 3. La notification est planifiée après un délai configurable par le commerçant
 * 4. Le commerçant peut configurer : délai, URL Google Place, activation/désactivation
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

// ============================================
// TABLE: auto_review_settings
// ============================================
// SQL à exécuter dans Supabase:
//
// CREATE TABLE IF NOT EXISTS auto_review_settings (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   commercant_id UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
//   boutique_id UUID REFERENCES boutiques(id) ON DELETE SET NULL,
//   active BOOLEAN DEFAULT true,
//   delai_minutes INTEGER DEFAULT 1440, -- 24h par défaut
//   google_place_url TEXT,
//   message_personnalise TEXT DEFAULT 'Merci de laisser un avis sur votre visite !',
//   seuil_etoiles INTEGER DEFAULT 4, -- ≥4 → Google, <4 → feedback interne
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );
//
// CREATE UNIQUE INDEX IF NOT EXISTS idx_auto_review_settings_commercant_boutique
//   ON auto_review_settings(commercant_id, boutique_id);

// ============================================
// TABLE: review_notifications (tracking)
// ============================================
// CREATE TABLE IF NOT EXISTS review_notifications (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   client_id UUID NOT NULL,
//   commercant_id UUID NOT NULL,
//   boutique_id UUID,
//   status TEXT DEFAULT 'pending', -- pending, sent, opened, completed, dismissed
//   scheduled_at TIMESTAMP WITH TIME ZONE,
//   sent_at TIMESTAMP WITH TIME ZONE,
//   opened_at TIMESTAMP WITH TIME ZONE,
//   completed_at TIMESTAMP WITH TIME ZONE,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );

// ============================================
// GET /api/auto-review/settings
// Récupérer les paramètres d'avis automatique du commerçant
// ============================================
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const { boutique_id } = req.query;
    const commercantId = req.commercant.id;

    const { data, error } = await supabase
      .from('auto_review_settings')
      .select('*')
      .eq('commercant_id', commercantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Retourner les paramètres existants ou les défauts
    res.json({
      success: true,
      data: data || {
        active: true,
        delai_minutes: 1440,
        google_place_url: '',
        message_personnalise: 'Merci de laisser un avis sur votre visite !',
        seuil_etoiles: 4,
      },
    });
  } catch (err) {
    console.error('GET /auto-review/settings error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// PUT /api/auto-review/settings
// Mettre à jour les paramètres d'avis automatique
// ============================================
router.put('/settings', authMiddleware, [
  body('active').optional().isBoolean(),
  body('delai_minutes').optional().isInt({ min: 1, max: 10080 }),
  body('google_place_url').optional().isURL().isLength({ max: 500 }),
  body('message_personnalise').optional().trim().isLength({ min: 1, max: 500 }),
  body('seuil_etoiles').optional().isInt({ min: 1, max: 5 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { active, delai_minutes, google_place_url, message_personnalise, seuil_etoiles } = req.body;
    const commercantId = req.commercant.id;

    // Vérifier si les paramètres existent déjà
    const { data: existing } = await supabase
      .from('auto_review_settings')
      .select('id')
      .eq('commercant_id', commercantId)
      .single();

    const settingsData = {
      commercant_id: commercantId,
      active: active ?? true,
      delai_minutes: delai_minutes ?? 1440,
      google_place_url: google_place_url || '',
      message_personnalise: message_personnalise || 'Merci de laisser un avis sur votre visite !',
      seuil_etoiles: seuil_etoiles ?? 4,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('auto_review_settings')
        .update(settingsData)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('auto_review_settings')
        .insert(settingsData)
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('PUT /auto-review/settings error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// GET /api/auto-review/feedback
// Récupérer les feedbacks internes (avis < 4 étoiles)
// ============================================
router.get('/feedback', authMiddleware, async (req, res) => {
  try {
    const commercantId = req.commercant.id;
    const { boutique_id, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('avis')
      .select(`
        id,
        client_id,
        note,
        commentaire,
        feedback_interne,
        created_at,
        clients(nom, email, telephone)
      `)
      .eq('commercant_id', commercantId)
      .not('feedback_interne', 'is', null)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (boutique_id) {
      query = query.eq('boutique_id', boutique_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('GET /auto-review/feedback error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// GET /api/auto-review/stats
// Statistiques des avis automatiques
// ============================================
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const commercantId = req.commercant.id;
    const { boutique_id } = req.query;

    // Compter les notifications par statut
    let query = supabase
      .from('review_notifications')
      .select('status', { count: 'exact', head: false })
      .eq('commercant_id', commercantId);

    if (boutique_id) {
      query = query.eq('boutique_id', boutique_id);
    }

    const { data: notifications, error: notifError } = await query;
    if (notifError) throw notifError;

    // Stats des avis
    let avisQuery = supabase
      .from('avis')
      .select('note', { count: 'exact', head: false })
      .eq('commercant_id', commercantId);

    if (boutique_id) {
      avisQuery = avisQuery.eq('boutique_id', boutique_id);
    }

    const { data: avis, count: totalAvis, error: avisError } = await avisQuery;
    if (avisError) throw avisError;

    const stats = {
      notifications: {
        pending: notifications?.filter(n => n.status === 'pending').length || 0,
        sent: notifications?.filter(n => n.status === 'sent').length || 0,
        opened: notifications?.filter(n => n.status === 'opened').length || 0,
        completed: notifications?.filter(n => n.status === 'completed').length || 0,
      },
      avis: {
        total: totalAvis || 0,
        moyenne: avis?.length ? (avis.reduce((sum, a) => sum + a.note, 0) / avis.length).toFixed(1) : 0,
        internes: notifications?.filter(n => n.status === 'completed').length || 0,
      },
    };

    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('GET /auto-review/stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// POST /api/auto-review/trigger (appelé après scan)
// Planifie la notification d'avis automatique
// RÈGLE : 1 notification par client, jamais de spam
// ============================================
router.post('/trigger', authMiddleware, async (req, res) => {
  try {
    const { client_id, commercant_id, boutique_id } = req.body;

    // Vérifier si une notification existe déjà pour ce client
    const { data: existing } = await supabase
      .from('review_notifications')
      .select('id, status')
      .eq('client_id', client_id)
      .eq('commercant_id', commercant_id)
      .in('status', ['pending', 'sent', 'opened'])
      .single();

    // Si une notification est déjà en cours → ne pas en créer une autre
    if (existing) {
      return res.json({
        success: true,
        message: 'Notification déjà planifiée pour ce client',
        data: { notification_id: existing.id, status: existing.status },
      });
    }

    // Récupérer les paramètres du commerçant
    let settingsQuery = supabase
      .from('auto_review_settings')
      .select('*')
      .eq('commercant_id', commercant_id)
      .eq('active', true);

    if (boutique_id) {
      settingsQuery = settingsQuery.eq('boutique_id', boutique_id);
    } else {
      settingsQuery = settingsQuery.is('boutique_id', null);
    }

    const { data: settings } = await settingsQuery.single();

    // Si les avis auto sont désactivés, ne rien faire
    if (!settings || !settings.active) {
      return res.json({ success: true, message: 'Avis automatique désactivé' });
    }

    const delaiMinutes = settings.delai_minutes || 1440;
    const scheduledAt = new Date(Date.now() + delaiMinutes * 60 * 1000);

    // Créer la notification
    const { data: notification, error } = await supabase
      .from('review_notifications')
      .insert({
        client_id,
        commercant_id,
        boutique_id: boutique_id || null,
        status: 'pending',
        scheduled_at: scheduledAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Notification planifiée pour ${scheduledAt.toLocaleDateString('fr-FR')}`,
      data: notification,
    });
  } catch (err) {
    console.error('POST /auto-review/trigger error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// POST /api/auto-review/send
// Envoyer les notifications planifiées (appelé par un cron)
// ============================================
router.post('/send', async (req, res) => {
  try {
    // Récupérer toutes les notifications pending dont le délai est passé
    const { data: pending, error } = await supabase
      .from('review_notifications')
      .select(`
        id,
        client_id,
        commercant_id,
        boutique_id,
        scheduled_at,
        auto_review_settings!inner(
          message_personnalise,
          google_place_url,
          seuil_etoiles,
          commercants(nom, carte_logo_url)
        ),
        clients!inner(fcm_token, nom)
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString());

    if (error) throw error;
    if (!pending || pending.length === 0) {
      return res.json({ success: true, message: 'Aucune notification à envoyer', sent: 0 });
    }

    let sent = 0;
    const results = [];

    for (const notif of pending) {
      try {
        const settings = notif.auto_review_settings;
        const client = notif.clients;
        const commercant = settings.commercants;

        // Envoyer la notification push (FCM)
        if (client.fcm_token) {
          await sendPushNotification(client.fcm_token, {
            title: `Vous avez visité ${commercant.nom} !`,
            body: settings.message_personnalise || 'Merci de laisser un avis sur votre visite !',
            data: {
              type: 'review_request',
              notification_id: notif.id,
              commercant_id: notif.commercant_id,
              boutique_id: notif.boutique_id || '',
              google_place_url: settings.google_place_url || '',
            },
          });
        }

        // Mettre à jour le statut
        await supabase
          .from('review_notifications')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', notif.id);

        sent++;
        results.push({ id: notif.id, client: client.nom, status: 'sent' });
      } catch (err) {
        console.error(`Erreur envoi notification ${notif.id}:`, err);
        results.push({ id: notif.id, error: err.message });
      }
    }

    res.json({ success: true, message: `${sent} notification(s) envoyée(s)`, sent, results });
  } catch (err) {
    console.error('POST /auto-review/send error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// POST /api/auto-review/mark-opened
// Marquer une notification comme ouverte
// ============================================
router.post('/mark-opened', async (req, res) => {
  try {
    const { notification_id } = req.body;

    const { data, error } = await supabase
      .from('review_notifications')
      .update({ status: 'opened', opened_at: new Date().toISOString() })
      .eq('id', notification_id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('POST /auto-review/mark-opened error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// POST /api/auto-review/mark-completed
// Marquer une notification comme terminée (après avis donné)
// ============================================
router.post('/mark-completed', async (req, res) => {
  try {
    const { notification_id, avis_id, feedback_interne } = req.body;

    const { data, error } = await supabase
      .from('review_notifications')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', notification_id)
      .select()
      .single();

    if (error) throw error;

    // Si feedback interne, enregistrer en DB
    if (feedback_interne) {
      await supabase
        .from('avis')
        .update({ feedback_interne })
        .eq('id', avis_id);
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('POST /auto-review/mark-completed error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// FONCTION UTILITAIRE: envoi notification push FCM
// ============================================
async function sendPushNotification(fcmToken, payload) {
  const admin = require('firebase-admin');

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'stamply_reviews',
          icon: 'ic_stamply',
          color: '#6C63FF',
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
    return { success: true };
  } catch (err) {
    console.error('FCM send error:', err.message);
    // Si le token est invalide, le supprimer de la DB
    if (err.code === 'messaging/registration-token-not-registered') {
      await supabase
        .from('clients')
        .update({ fcm_token: null })
        .eq('fcm_token', fcmToken);
    }
    throw err;
  }
}

module.exports = router;
