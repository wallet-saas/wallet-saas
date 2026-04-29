/**
 * fcmService.js — Firebase Admin SDK (FCM V1) pour push notifications Android
 *
 * Prérequis :
 *   npm install firebase-admin
 *
 * Variable d'env requise :
 *   FCM_KEY_JSON  — contenu JSON complet du fichier firebase-adminsdk service account
 *                   (copier-coller le fichier JSON en une seule ligne minifiée)
 *
 * Mode simulation automatique si FCM_KEY_JSON est absent.
 */

// ---------------------------------------------------------------------------
// État interne — initialisation lazy (au premier appel)
// ---------------------------------------------------------------------------
let _adminApp = null;
let _initAttempted = false;

/**
 * Initialise firebase-admin depuis la variable FCM_KEY_JSON.
 * Retourne l'instance admin ou null si la variable est absente/invalide.
 */
function getFirebaseAdmin() {
  if (_initAttempted) return _adminApp;
  _initAttempted = true;

  const raw = process.env.FCM_KEY_JSON;
  if (!raw) {
    console.warn('[FCM] FCM_KEY_JSON absent — mode simulation activé. Les push Android ne seront pas envoyés.');
    return null;
  }

  try {
    const admin = require('firebase-admin');

    // Éviter de réinitialiser si l'app existe déjà (hot-reload, tests)
    if (admin.apps.length > 0) {
      _adminApp = admin;
      return _adminApp;
    }

    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    _adminApp = admin;
    console.log('[FCM] Firebase Admin SDK initialisé avec succès (projet :', serviceAccount.project_id, ')');
    return _adminApp;
  } catch (err) {
    console.error('[FCM] Échec initialisation Firebase Admin SDK :', err.message);
    _adminApp = null;
    return null;
  }
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

/**
 * Envoie une notification push via FCM V1 (Firebase Admin SDK).
 *
 * @param {string} fcmToken   Token FCM du device Android
 * @param {string} title      Titre de la notification
 * @param {string} body       Corps du message
 * @param {Object} [data={}]  Données supplémentaires (key/value strings)
 * @returns {Promise<{ success: boolean, simulated?: boolean, messageId?: string, error?: string }>}
 */
async function sendPushNotification(fcmToken, title, body, data = {}) {
  if (!fcmToken) {
    return { success: false, error: 'Token FCM manquant' };
  }

  const admin = getFirebaseAdmin();

  // Mode simulation
  if (!admin) {
    console.log(`[FCM SIMULATION] → token:${fcmToken.slice(0, 8)}… | "${title}" : "${body}"`);
    return { success: true, simulated: true };
  }

  // Construire le message FCM V1
  const message = {
    token: fcmToken,
    notification: {
      title,
      body
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default'
      }
    }
  };

  // Ajouter les données supplémentaires si présentes
  if (data && Object.keys(data).length > 0) {
    // FCM exige que toutes les valeurs soient des strings
    message.data = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    );
  }

  try {
    const messageId = await admin.messaging().send(message);
    return { success: true, messageId };
  } catch (err) {
    // Tokens invalides/expirés : on log sans faire crasher l'appelant
    console.error('[FCM] Erreur envoi push :', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Indique si le service FCM est en mode réel (true) ou simulation (false).
 * Utile pour les endpoints de status/stats.
 */
function isFCMEnabled() {
  return !!process.env.FCM_KEY_JSON;
}

module.exports = {
  sendPushNotification,
  isFCMEnabled
};
