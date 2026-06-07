/**
 * Service Apple Wallet — Stamply
 *
 * Structure prête, en attente des certificats Apple.
 * Le service retourne null sans crasher tant que les certificats ne sont pas configurés.
 *
 * ─── Pour activer Apple Wallet ────────────────────────────────────────────────
 *  1. Acheter un compte Apple Developer : https://developer.apple.com (99$/an)
 *  2. Créer un Pass Type ID : pass.com.stamply.loyalty
 *  3. Générer les certificats depuis le portail Apple Developer :
 *       - signerCert.pem   (certificate for the pass type)
 *       - signerKey.pem    (private key)
 *       - wwdr.pem         (Apple Worldwide Developer Relations cert)
 *  4. Placer les fichiers dans backend/config/apple-certs/
 *  5. Ajouter dans backend/.env :
 *       APPLE_TEAM_ID=XXXXXXXXXX
 *       APPLE_PASS_TYPE_ID=pass.com.stamply.loyalty
 *       APPLE_CERT_PATH=./config/apple-certs
 *  6. Activer le code ci-dessous (chercher les commentaires TODO)
 * ──────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');

const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;
const APPLE_PASS_TYPE_ID = process.env.APPLE_PASS_TYPE_ID;
const APPLE_CERT_PATH = process.env.APPLE_CERT_PATH;

/** Vérifie si Apple Wallet est configuré (variables d'env + fichiers certs présents). */
function isConfigured() {
  if (!APPLE_TEAM_ID || !APPLE_PASS_TYPE_ID || !APPLE_CERT_PATH) return false;

  const certPath = path.resolve(process.cwd(), APPLE_CERT_PATH);
  return (
    fs.existsSync(path.join(certPath, 'signerCert.pem')) &&
    fs.existsSync(path.join(certPath, 'signerKey.pem')) &&
    fs.existsSync(path.join(certPath, 'wwdr.pem'))
  );
}

/**
 * Génère un fichier .pkpass Apple Wallet et retourne une URL d'installation.
 *
 * TODO : Activer quand les certificats Apple sont disponibles.
 *
 * @param {Object} carte       - { pass_serial_number, points }
 * @param {Object} commercant  - { id, nom_enseigne, carte_couleur_primaire, points_recompense, carte_logo_url }
 * @returns {string|null}      - URL d'installation ou null si non configuré
 */
async function generateSaveUrl(carte, commercant) {
  if (!isConfigured()) {
    // TODO: Implémenter avec passkit-generator une fois les certificats disponibles
    // Exemple d'implémentation :
    //
    // const { PKPass } = require('passkit-generator');
    // const certPath = path.resolve(process.cwd(), APPLE_CERT_PATH);
    //
    // const pass = await PKPass.from({
    //   model: path.join(certPath, 'StamplyLoyalty.pass'),
    //   certificates: {
    //     wwdr: fs.readFileSync(path.join(certPath, 'wwdr.pem')),
    //     signerCert: fs.readFileSync(path.join(certPath, 'signerCert.pem')),
    //     signerKey: fs.readFileSync(path.join(certPath, 'signerKey.pem')),
    //   },
    // }, {
    //   serialNumber: carte.pass_serial_number,
    //   organizationName: commercant.nom_enseigne,
    //   description: `Carte de fidélité ${commercant.nom_enseigne}`,
    //   backgroundColor: commercant.carte_couleur_primaire || '#6366f1',
    // });
    //
    // const buffer = pass.getAsBuffer();
    // // Stocker le buffer et retourner l'URL de téléchargement
    return null;
  }

  // TODO: Implémentation active (déclencher quand isConfigured() === true)
  return null;
}

/**
 * Envoie une notification push APNS pour forcer la mise à jour d'une carte Apple Wallet.
 *
 * TODO : Activer quand les certificats APNS sont disponibles.
 *
 * @param {string} serialNumber - pass_serial_number de la carte
 * @param {number} newPoints    - nouveau solde de points
 */
async function updatePoints(serialNumber, newPoints) {
  if (!isConfigured()) {
    // TODO: Envoyer push notification APNS via le endpoint /api/wallet/passes/update
    return;
  }

  // TODO: Implémenter la mise à jour Apple Wallet via APNS
}

module.exports = {
  isConfigured,
  generateSaveUrl,
  updatePoints,
};
