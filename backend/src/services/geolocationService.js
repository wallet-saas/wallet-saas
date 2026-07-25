const { supabase } = require('../config/supabase');

/**
 * Calcule la distance en mètres entre deux coordonnées GPS (formule Haversine).
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Rayon Terre en mètres
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Envoi d'une notification de proximité à un client
// ---------------------------------------------------------------------------
/**
 * Envoie une notification push "Vous passez par là ?" au porteur de la carte.
 * Appelé quand un device signale sa position à proximité du commerce.
 *
 * @param {string} carteId       UUID de la carte (identifie le client)
 * @param {string} commercantId  UUID du commerçant
 */
async function sendProximityNotification(carteId, commercantId) {
  // Récupérer les infos du commerçant
  const { data: commercant, error: commError } = await supabase
    .from('commercants')
    .select('nom_enseigne, module_geolocalisation, rayon_geoloc_metres, geoloc_message')
    .eq('id', commercantId)
    .single();

  if (commError || !commercant) throw new Error('Commerçant introuvable.');
  if (!commercant.module_geolocalisation) throw new Error('Module géolocalisation désactivé.');

  // Envoi via la carte Wallet du client — l'ancien canal exigeait un
  // device_token d'application mobile, qui n'existe pas (Stamply fonctionne
  // sans app installée). Le consentement est recueilli à l'installation.
  const titre = commercant.nom_enseigne;
  const message = commercant.geoloc_message?.trim()
    || `Vous passez par là ? 👋 Venez nous voir — votre carte de fidélité vous attend !`;

  const walletNotificationService = require('./walletNotificationService');
  const envoiWallet = await walletNotificationService.sendToWalletCard(carteId, titre, message);
  if (!envoiWallet.google && !envoiWallet.apple) {
    return { success: false, reason: 'no_wallet_channel' };
  }

  // Enregistrer la notification en DB pour stats
  const { data: notif } = await supabase
    .from('notifications')
    .insert([{
      commercant_id: commercantId,
      titre,
      message,
      type: 'push',
      cible: 'geoloc',
      total_envoyes: 1,
      envoyee: true
    }])
    .select()
    .single();

  console.log(`[GEOLOC] Notification proximité → carte ${carteId} | commerce: ${commercant.nom_enseigne}`);

  return {
    success: true,
    notificationId: notif?.id,
    message: `Notification envoyée à ${commercant.nom_enseigne}`
  };
}

// ---------------------------------------------------------------------------
// Vérifier si un client est proche d'un commerce
// ---------------------------------------------------------------------------
/**
 * Reçoit les coordonnées GPS d'un client et vérifie s'il est dans le rayon
 * de détection du commerçant. Si oui, envoie une notification.
 *
 * @param {string} carteId    UUID de la carte
 * @param {number} latitude   Latitude du client
 * @param {number} longitude  Longitude du client
 */
// Fréquence anti-spam : délai minimum entre deux notifications de proximité
// pour une même carte. Réglable par le commerçant (geoloc_frequence_jours),
// 3 jours par défaut — un client qui passe 3 fois dans la journée n'est
// notifié qu'une seule fois.
const GEOLOC_FREQUENCE_DEFAUT_JOURS = 3;

async function checkProximityAndNotify(carteId, latitude, longitude) {
  // Récupérer la carte + le commerçant + last_geoloc_notif_at pour le cooldown
  const { data: carte, error } = await supabase
    .from('cartes')
    .select(`
      id,
      commercant_id,
      last_geoloc_notif_at,
      commercants (
        nom_enseigne,
        latitude,
        longitude,
        rayon_geoloc_metres,
        module_geolocalisation,
        geoloc_frequence_jours
      )
    `)
    .eq('id', carteId)
    .single();

  if (error || !carte) throw new Error('Carte introuvable.');
  if (!carte.commercants.module_geolocalisation) {
    return { triggered: false, reason: 'module_disabled' };
  }

  const { latitude: lat_c, longitude: lon_c, rayon_geoloc_metres } = carte.commercants;

  if (!lat_c || !lon_c) {
    return { triggered: false, reason: 'no_commerce_location' };
  }

  const distance = haversineDistance(latitude, longitude, lat_c, lon_c);
  const rayon = rayon_geoloc_metres || 200;

  if (distance > rayon) {
    return { triggered: false, distance: Math.round(distance), rayon };
  }

  // Fréquence anti-spam configurée par le commerçant
  const frequenceJours = carte.commercants.geoloc_frequence_jours || GEOLOC_FREQUENCE_DEFAUT_JOURS;
  const cooldownMs = frequenceJours * 24 * 60 * 60 * 1000;
  if (carte.last_geoloc_notif_at) {
    const elapsed = Date.now() - new Date(carte.last_geoloc_notif_at).getTime();
    if (elapsed < cooldownMs) {
      const heuresRestantes = Math.ceil((cooldownMs - elapsed) / (60 * 60 * 1000));
      console.log(`[GEOLOC] Fréquence ${frequenceJours}j — carte ${carteId} : encore ${heuresRestantes}h avant la prochaine notif.`);
      return { triggered: false, reason: 'cooldown', frequenceJours, heuresRestantes, distance: Math.round(distance), rayon };
    }
  }

  // Client dans le rayon ET cooldown expiré → envoyer la notification
  const result = await sendProximityNotification(carteId, carte.commercant_id);

  // Mettre à jour le timestamp de dernière notification
  await supabase
    .from('cartes')
    .update({ last_geoloc_notif_at: new Date().toISOString() })
    .eq('id', carteId);

  return { triggered: true, distance: Math.round(distance), rayon, ...result };
}

// ---------------------------------------------------------------------------
// Statistiques géolocalisation
// ---------------------------------------------------------------------------
/**
 * Calcule le taux de conversion géoloc (notifications proximité → visites dans les 2h).
 *
 * @param {string} commercantId UUID du commerçant
 */
async function getGeolocationStats(commercantId) {
  // Notifications de type 'geoloc' envoyées
  const { data: notifsGeoloc, error: notifError } = await supabase
    .from('notifications')
    .select('id, created_at, total_envoyes, total_ouverts')
    .eq('commercant_id', commercantId)
    .eq('cible', 'geoloc');

  if (notifError) throw new Error('Erreur récupération stats géoloc.');

  // Visites de source 'geoloc'
  const { data: visitesGeoloc, error: visiteError } = await supabase
    .from('visites')
    .select('id, created_at')
    .eq('commercant_id', commercantId)
    .eq('source', 'geoloc');

  if (visiteError) throw new Error('Erreur récupération visites géoloc.');

  const totalNotifications = notifsGeoloc.reduce((s, n) => s + (n.total_envoyes || 0), 0);
  const totalConversions = visitesGeoloc?.length || 0;
  const tauxConversion = totalNotifications > 0
    ? Math.round((totalConversions / totalNotifications) * 100 * 10) / 10
    : 0;

  return {
    totalNotificationsGeoloc: totalNotifications,
    totalConversions,
    tauxConversion // en %
  };
}

module.exports = {
  sendProximityNotification,
  checkProximityAndNotify,
  getGeolocationStats,
  haversineDistance
};
