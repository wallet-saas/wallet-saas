const { supabase } = require('../config/supabase');
const fcmService = require('./fcmService');

/**
 * Mode réel activé uniquement si les variables d'env sont présentes.
 * Sans elles, toutes les notifications passent en mode simulation (log console).
 *
 * Pour activer APNS (iOS) :
 *   npm install @parse/node-apn
 *   Variables : APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID, APNS_KEY_PATH (chemin vers fichier .p8)
 *
 * Pour activer FCM (Android) :
 *   npm install firebase-admin
 *   Variable : FCM_KEY_JSON (contenu JSON complet du fichier firebase-adminsdk service account,
 *              en une seule ligne minifiée)
 */
const APNS_ENABLED =
  !!process.env.APNS_KEY_ID &&
  !!process.env.APNS_TEAM_ID &&
  !!process.env.APNS_BUNDLE_ID &&
  !!process.env.APNS_KEY_PATH;

const FCM_ENABLED = fcmService.isFCMEnabled();

// Chargement paresseux du provider APNS (optionnel)
let apnProvider = null;

function getApnProvider() {
  if (!APNS_ENABLED) return null;
  if (apnProvider) return apnProvider;

  const apn = require('@parse/node-apn'); // npm install @parse/node-apn
  apnProvider = new apn.Provider({
    token: {
      key: process.env.APNS_KEY_PATH,
      keyId: process.env.APNS_KEY_ID,
      teamId: process.env.APNS_TEAM_ID
    },
    production: process.env.NODE_ENV === 'production'
  });
  return apnProvider;
}

// ---------------------------------------------------------------------------
// Envoi APNS (iOS)
// ---------------------------------------------------------------------------
async function sendAPNS(deviceToken, titre, message) {
  if (!APNS_ENABLED) {
    console.log(`[SIMULATION APNS] → token:${deviceToken.slice(0, 8)}… | "${titre}" : "${message}"`);
    return { success: true, simulation: true };
  }

  try {
    const apn = require('@parse/node-apn');
    const provider = getApnProvider();
    const note = new apn.Notification();
    note.alert = { title: titre, body: message };
    note.sound = 'default';
    note.topic = process.env.APNS_BUNDLE_ID;

    const result = await provider.send(note, deviceToken);
    if (result.failed.length > 0) {
      console.error('[APNS] Échec:', result.failed[0].response);
      return { success: false, error: result.failed[0].response };
    }
    return { success: true };
  } catch (err) {
    console.error('[APNS] Erreur:', err.message);
    return { success: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Envoi FCM (Android) — délégué à fcmService (Firebase Admin SDK V1)
// ---------------------------------------------------------------------------
async function sendFCM(deviceToken, titre, message) {
  return fcmService.sendPushNotification(deviceToken, titre, message);
}

// ---------------------------------------------------------------------------
// Dispatch vers le bon provider selon la plateforme
// ---------------------------------------------------------------------------
async function sendToDevice(deviceToken, platform, titre, message) {
  if (!deviceToken) return { success: false, error: 'Pas de device token' };

  if (platform === 'ios') return sendAPNS(deviceToken, titre, message);
  if (platform === 'android') return sendFCM(deviceToken, titre, message);

  // Plateforme inconnue → on tente APNS par défaut (simulation)
  return sendAPNS(deviceToken, titre, message);
}

// ---------------------------------------------------------------------------
// Récupérer les clients ciblés
// ---------------------------------------------------------------------------
async function getTargetedClients(commercantId, cible) {
  let query = supabase
    .from('clients')
    .select('id, device_token, platform, statut')
    .eq('commercant_id', commercantId)
    .not('device_token', 'is', null); // uniquement ceux avec un token

  if (cible === 'actifs') {
    query = query.eq('statut', 'actif');
  } else if (cible === 'dormants') {
    query = query.eq('statut', 'dormant');
  }
  // cible === 'tous' → pas de filtre statut supplémentaire

  const { data, error } = await query;
  if (error) throw new Error(`Erreur récupération clients : ${error.message}`);
  return data || [];
}

// ---------------------------------------------------------------------------
// Envoi principal
// ---------------------------------------------------------------------------
/**
 * Envoie une notification push à tous les clients ciblés d'un commerçant.
 *
 * @param {string} commercantId  UUID du commerçant
 * @param {string} titre         Titre de la notification
 * @param {string} message       Corps du message
 * @param {string} cible         'tous' | 'actifs' | 'dormants'
 * @returns {{ totalCible: number, totalEnvoyes: number, simulation: boolean }}
 */
async function sendPushNotification(commercantId, titre, message, cible = 'tous') {
  const clients = await getTargetedClients(commercantId, cible);

  if (clients.length === 0) {
    return { totalCible: 0, totalEnvoyes: 0, simulation: !APNS_ENABLED && !FCM_ENABLED };
  }

  const results = await Promise.allSettled(
    clients.map(client => sendToDevice(client.device_token, client.platform, titre, message))
  );

  const totalEnvoyes = results.filter(
    r => r.status === 'fulfilled' && r.value.success
  ).length;

  const simulation = !APNS_ENABLED && !FCM_ENABLED;

  console.log(
    `[NOTIFICATIONS] ${simulation ? 'SIMULATION ' : ''}Envoi terminé : ${totalEnvoyes}/${clients.length} (cible: ${cible})`
  );

  return { totalCible: clients.length, totalEnvoyes, simulation };
}

// ---------------------------------------------------------------------------
// Tracking ouverture
// ---------------------------------------------------------------------------
/**
 * Incrémente le compteur total_ouverts d'une notification.
 * Appelé via webhook GET/POST /api/notifications/open/:id
 *
 * @param {string} notificationId UUID de la notification
 */
async function trackNotificationOpen(notificationId) {
  // Use RPC for atomic increment to avoid race conditions
  const { data, error } = await supabase.rpc('increment_notification_open', {
    notif_id: notificationId,
  });

  if (error) {
    // Fallback: read-then-write (less safe but works without RPC)
    const { data: notif, error: fetchError } = await supabase
      .from('notifications')
      .select('total_ouverts')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notif) throw new Error('Notification introuvable');

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ total_ouverts: notif.total_ouverts + 1 })
      .eq('id', notificationId);

    if (updateError) throw new Error(`Erreur tracking : ${updateError.message}`);

    return { total_ouverts: notif.total_ouverts + 1 };
  }

  return { total_ouverts: data };
}

module.exports = {
  sendPushNotification,
  trackNotificationOpen,
  APNS_ENABLED,
  FCM_ENABLED
};
