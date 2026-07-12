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

  // --- Apple Wallet ---
  // 1. D'abord, stocker le message de notification dans la carte
  //    pour que le web service Apple Wallet puisse l'injecter dans le pass
  // 2. Puis envoyer APNS push pour que l'iPhone demande la mise à jour
  //    (le changeMessage "🎯 {{NOTIF_BODY}}" s'affichera automatiquement)
  const appleCarteIds = cartes
    .filter(c => c.apple_push_token)
    .map(c => c.id);

  if (appleCarteIds.length > 0) {
    // Stocker le message pour TOUTES les cartes Apple en une requête
    await supabase
      .from('cartes')
      .update({
        last_notif_titre: titre,
        last_notif_message: message,
        last_notif_sent_at: new Date().toISOString(),
      })
      .in('id', appleCarteIds)
      .catch(err => {
        console.error(`[WalletNotify] Erreur stockage message Apple:`, err.message);
      });
  }

  // Envoyer APNS à chaque carte (ne fait rien si pas de cert APNS)
  const applePromises = cartes
    .filter(c => c.apple_push_token)
    .map(async (carte) => {
      try {
        await appleWalletService.notifyPush(carte.pass_serial_number);
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