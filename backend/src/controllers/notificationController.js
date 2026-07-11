const { supabase } = require('../config/supabase');
const {
  sendPushNotification,
  trackNotificationOpen,
  APNS_ENABLED,
  FCM_ENABLED
} = require('../services/notificationService');
const walletNotificationService = require('../services/walletNotificationService');

// Valeurs autorisées pour le champ cible
const CIBLES_VALIDES = ['tous', 'actifs', 'dormants'];

// ---------------------------------------------------------------------------
// POST /api/notifications/send
// Envoi manuel d'une notification push depuis le dashboard commerçant
// ---------------------------------------------------------------------------
const sendNotification = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { titre, message, cible = 'tous', planifiee_pour } = req.body;

    // --- Validation ---
    if (!titre || !titre.trim()) {
      return res.status(400).json({ success: false, error: 'Le titre est requis.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Le message est requis.' });
    }
    if (!CIBLES_VALIDES.includes(cible)) {
      return res.status(400).json({
        success: false,
        error: `Cible invalide. Valeurs acceptées : ${CIBLES_VALIDES.join(', ')}.`
      });
    }

    // --- Créer l'entrée notification en base AVANT l'envoi ---
    const { data: notif, error: insertError } = await supabase
      .from('notifications')
      .insert([{
        commercant_id: commercantId,
        titre: titre.trim(),
        message: message.trim(),
        type: 'push',
        cible,
        total_envoyes: 0,
        total_ouverts: 0,
        envoyee: false,
        planifiee_pour: planifiee_pour || null
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Erreur insertion notification:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de la notification.'
      });
    }

    // --- Envoi effectif ---
    const { totalCible, totalEnvoyes, simulation } = await sendPushNotification(
      commercantId,
      titre.trim(),
      message.trim(),
      cible
    );

    // --- Envoyer aussi aux cartes Wallet de TOUS les clients ---
    // Google Wallet = TEXT_AND_NOTIFY (push natif dans Google Wallet)
    // Apple Wallet = changeMessage (notification système sur mise à jour)
    const walletResult = await walletNotificationService.sendToWalletCards(
      commercantId,
      titre.trim(),
      message.trim()
    ).catch(err => {
      console.error('[Notifications] Erreur envoi Wallet:', err.message);
      return { google: 0, apple: 0, total: 0 };
    });

    // --- Mettre à jour la notification avec les stats d'envoi ---
    const { error: updateError } = await supabase
      .from('notifications')
      .update({
        total_envoyes: totalEnvoyes,
        envoyee: true
      })
      .eq('id', notif.id);

    if (updateError) {
      console.error('Erreur mise à jour notification:', updateError);
      // Non bloquant : la notification est enregistrée, juste les stats qui décalent
    }

    return res.status(200).json({
      success: true,
      simulation,
      message: simulation
        ? `Notification simulée. ${totalEnvoyes}/${totalCible} clients ciblés.`
        : `Notification envoyée à ${totalEnvoyes}/${totalCible} clients + ${walletResult.total} cartes Wallet.`,
      data: {
        notificationId: notif.id,
        totalCible,
        totalEnvoyes,
        cible,
        wallet: walletResult
      }
    });

  } catch (error) {
    console.error('Erreur sendNotification:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi de la notification.'
    });
  }
};

// ---------------------------------------------------------------------------
// GET /api/notifications/history
// Historique des notifications envoyées par le commerçant
// ---------------------------------------------------------------------------
const getHistory = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;

    const { data: notifications, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('commercant_id', commercantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erreur historique notifications:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de l\'historique.'
      });
    }

    return res.status(200).json({
      success: true,
      total: count,
      count: notifications.length,
      data: { notifications }
    });

  } catch (error) {
    console.error('Erreur getHistory:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique.'
    });
  }
};

// ---------------------------------------------------------------------------
// GET /api/notifications/stats
// Statistiques globales des notifications du commerçant
// ---------------------------------------------------------------------------
const getStats = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('total_envoyes, total_ouverts, envoyee, cible, created_at')
      .eq('commercant_id', commercantId);

    if (error) {
      console.error('Erreur stats notifications:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques.'
      });
    }

    const totalNotifications = notifications.length;
    const totalEnvoyes = notifications.reduce((sum, n) => sum + (n.total_envoyes || 0), 0);
    const totalOuverts = notifications.reduce((sum, n) => sum + (n.total_ouverts || 0), 0);
    const tauxOuverture = totalEnvoyes > 0
      ? Math.round((totalOuverts / totalEnvoyes) * 100 * 10) / 10
      : 0;

    // Stats par cible
    const parCible = CIBLES_VALIDES.reduce((acc, cible) => {
      const groupe = notifications.filter(n => n.cible === cible);
      acc[cible] = {
        count: groupe.length,
        totalEnvoyes: groupe.reduce((s, n) => s + (n.total_envoyes || 0), 0),
        totalOuverts: groupe.reduce((s, n) => s + (n.total_ouverts || 0), 0)
      };
      return acc;
    }, {});

    // Dernière notification envoyée
    const derniereNotif = notifications
      .filter(n => n.envoyee)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;

    return res.status(200).json({
      success: true,
      data: {
        totalNotifications,
        totalEnvoyes,
        totalOuverts,
        tauxOuverture,        // en %
        parCible,
        derniereNotifAt: derniereNotif?.created_at || null,
        providers: {
          apns: APNS_ENABLED ? 'actif' : 'simulation',
          fcm: FCM_ENABLED ? 'actif' : 'simulation'
        }
      }
    });

  } catch (error) {
    console.error('Erreur getStats:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques.'
    });
  }
};

// ---------------------------------------------------------------------------
// POST /api/notifications/open/:id
// Webhook de tracking d'ouverture (appelé par le device ou un pixel)
// Public — pas de JWT requis
// ---------------------------------------------------------------------------
const trackOpen = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: 'ID de notification requis.' });
    }

    const result = await trackNotificationOpen(id);

    return res.status(200).json({
      success: true,
      total_ouverts: result.total_ouverts
    });

  } catch (error) {
    console.error('Erreur trackOpen:', error.message);
    return res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  sendNotification,
  getHistory,
  getStats,
  trackOpen
};
