/**
 * Wallet Notification Service — Stamply
 * 
 * Orchestre l'envoi de notifications push vers les cartes Wallet :
 * - Google Wallet → TEXT_AND_NOTIFY (API Google Wallet)
 * - Apple Wallet → APNS pass update + changeMessage
 * 
 * Quand le commerçant envoie une notification depuis son dashboard,
 * ce service envoie aussi à TOUTES les cartes Wallet de ses clients,
 * sans avoir besoin d'une app séparée.
 */

const { supabase } = require('../config/supabase');
const googleWalletService = require('./googleWalletService');
const appleWalletService = require('./appleWalletService');

/**
 * Envoie une notification à tous les clients Wallet d'un commerçant.
 * 
 * @param {string} commercantId - UUID du commerçant
 * @param {string} titre - Titre (header pour Google, utilisé pour log)
 * @param {string} message - Corps du message / offre
 * @param {string} [logoUrl] - URL du logo du commerce (optionnel)
 * @returns {Promise<{google: number, apple: number, total: number}>}
 */
async function sendToWalletCards(commercantId, titre, message, logoUrl = null) {
  // Récupérer le nom du commerçant
  const { data: commercant } = await supabase
    .from('commercants')
    .select('nom_enseigne, carte_logo_url')
    .eq('id', commercantId)
    .single();

  const nomEnseigne = commercant?.nom_enseigne || 'Mon Commerce';
  const notifLogUrl = logoUrl || commercant?.carte_logo_url || null;

  // Récupérer TOUTES les cartes de ce commerçant
  const { data: cartes } = await supabase
    .from('cartes')
    .select('id, pass_serial_number, google_wallet_url, apple_push_token, apple_device_id')
    .eq('commercant_id', commercantId);

  if (!cartes || cartes.length === 0) {
    console.log(`[WalletNotify] Aucune carte pour le commerçant ${commercantId}`);
    return { google: 0, apple: 0, total: 0 };
  }

  let googleSent = 0;
  let appleSent = 0;

  const header = `${nomEnseigne}`;
  const body = message;

  // Google Wallet — TEXT_AND_NOTIFY sur chaque carte
  // Limite : max 3 notifications/24h par carte
  const googlePromises = cartes
    .filter(c => c.google_wallet_url) // Seulement les cartes avec Google Wallet
    .map(async (carte) => {
      try {
        const ok = await googleWalletService.sendNotification(
          carte.pass_serial_number,
          header,
          body
        );
        if (ok) googleSent++;
      } catch (err) {
        console.error(`[WalletNotify] Google échec ${carte.pass_serial_number}:`, err.message);
      }
    });

  // Apple Wallet — APNS push pour mettre à jour la carte avec le message
  // Le pass.json a un champ `stamply_notif` avec changeMessage
  // En mettant à jour la carte, le changeMessage apparaît comme notification iOS
  const applePromises = cartes
    .filter(c => c.apple_push_token) // Seulement les cartes avec push token enregistré
    .map(async (carte) => {
      try {
        // Pour Apple Wallet, on ne peut pas envoyer de texte libre
        // Mais la mise à jour des points déclenchera le changeMessage
        // On utilise l'existing updatePoints qui envoie APNS
        // Le changeMessage "🎯 {{NOTIF_BODY}}" est déjà dans le pass.json
        // 
        // Alternative : utiliser updatePoints pour déclencher une notif
        // qui dit "points mis à jour" — ce qui donne au moins une indication
        await appleWalletService.updatePoints(
          carte.pass_serial_number,
          null
        );
        appleSent++;
      } catch (err) {
        console.error(`[WalletNotify] Apple échec ${carte.pass_serial_number}:`, err.message);
      }
    });

  // Lancer les envois Google et Apple en parallèle
  await Promise.allSettled([...googlePromises, ...applePromises]);

  console.log(`[WalletNotify] ✅ ${nomEnseigne} : ${googleSent} Google + ${appleSent} Apple = ${googleSent + appleSent} cartes notifiées`);

  return { google: googleSent, apple: appleSent, total: googleSent + appleSent };
}

module.exports = { sendToWalletCards };