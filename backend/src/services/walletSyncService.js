/**
 * walletSyncService — Propagation des modifications vers les cartes déjà installées.
 *
 * Quand le commerçant change le design de sa carte ou son programme de fidélité,
 * les cartes déjà dans le Wallet des clients doivent suivre :
 *
 *  • Google Wallet : le design vit dans la LoyaltyClass. La mettre à jour
 *    suffit — toutes les cartes existantes changent instantanément.
 *
 *  • Apple Wallet : le pass est régénéré à la demande par le web service.
 *    Il faut envoyer un push APNS à chaque appareil enregistré pour qu'il
 *    re-télécharge son pass. Le push est silencieux (aucun changeMessage
 *    modifié) : le client voit sa carte se mettre à jour, sans notification.
 *
 * Un verrou en mémoire évite de rejouer la synchronisation à chaque frappe
 * dans le formulaire (l'enregistrement est automatique côté dashboard).
 */

const { supabase } = require('../config/supabase');
const googleWalletService = require('./googleWalletService');
const appleWalletService = require('./appleWalletService');

// Dernière synchronisation par commerçant (anti-rafale)
const dernieresSync = new Map();
const DELAI_ANTI_RAFALE_MS = 60 * 1000;

/** Champs dont la modification doit être répercutée sur les cartes installées. */
const CHAMPS_SYNCHRONISES = [
  'nom_enseigne',
  'carte_type', 'carte_type_config',
  'carte_programme_nom', 'carte_recompense_description',
  'carte_couleur_primaire', 'carte_couleur_secondaire',
  'carte_logo_url', 'carte_background_image_url',
  'carte_text_color', 'carte_text_color_auto', 'carte_font_family',
  'carte_overlay_color', 'carte_overlay_opacity',
  'points_recompense', 'points_par_visite',
  'latitude', 'longitude', 'rayon_geoloc_metres', 'geoloc_message',
  'module_geolocalisation', 'module_avis_google', 'google_place_url',
];

/** Le payload contient-il au moins un champ à répercuter ? */
function necessiteSync(payload = {}) {
  return Object.keys(payload).some(k => CHAMPS_SYNCHRONISES.includes(k));
}

/**
 * Répercute la configuration actuelle du commerçant sur ses cartes installées.
 *
 * @param {string} commercantId
 * @param {object} options
 * @param {boolean} options.force  Ignorer le verrou anti-rafale (changement de programme)
 * @returns {Promise<{google: boolean, applePushes: number, ignore?: boolean}>}
 */
async function syncCommercantCards(commercantId, { force = false } = {}) {
  if (!commercantId) return { google: false, applePushes: 0 };

  const derniere = dernieresSync.get(commercantId) || 0;
  if (!force && Date.now() - derniere < DELAI_ANTI_RAFALE_MS) {
    return { google: false, applePushes: 0, ignore: true };
  }
  dernieresSync.set(commercantId, Date.now());

  const { data: commercant, error } = await supabase
    .from('commercants')
    .select('*')
    .eq('id', commercantId)
    .single();

  if (error || !commercant) {
    console.error(`[WalletSync] Commerçant ${commercantId} introuvable`);
    return { google: false, applePushes: 0 };
  }

  // ── Google : une seule requête met à jour toutes les cartes ──
  let google = false;
  try {
    await googleWalletService.upsertLoyaltyClass(commercant);
    google = true;
  } catch (err) {
    console.error('[WalletSync] Google class non mise à jour:', err.message);
  }

  // ── Apple : un push par appareil enregistré ──
  let applePushes = 0;
  try {
    const { data: cartes } = await supabase
      .from('cartes')
      .select('pass_serial_number, apple_push_token')
      .eq('commercant_id', commercantId)
      .not('apple_push_token', 'is', null);

    for (const carte of cartes || []) {
      try {
        await appleWalletService.notifyPush(carte.pass_serial_number);
        applePushes++;
      } catch (err) {
        console.error(`[WalletSync] Push Apple échoué (${carte.pass_serial_number}):`, err.message);
      }
    }
  } catch (err) {
    console.error('[WalletSync] Lecture des cartes Apple échouée:', err.message);
  }

  console.log(`[WalletSync] ${commercantId} — Google: ${google ? 'à jour' : 'échec'}, ${applePushes} carte(s) Apple rafraîchie(s)`);
  return { google, applePushes };
}

module.exports = { syncCommercantCards, necessiteSync, CHAMPS_SYNCHRONISES };
