/**
 * Stamply — Service QR Code Dynamique
 * 
 * Génère des QR codes uniques et sécurisés pour chaque client.
 * 
 * Format du QR code :
 * {
 *   v: "2",                    // version
 *   cid: "<carte_id>",         // ID de la carte
 *   ts: "<timestamp>",         // timestamp de génération (ms)
 *   sig: "<hmac_signature>"    // signature HMAC pour vérification
 * }
 * 
 * Sécurité :
 * - Le QR code expire après 5 minutes (configurable)
 * - Signature HMAC empêche la falsification
 * - Chaque QR code est unique (timestamp + carte_id)
 * - Rate limiting côté scan (30 secondes entre deux scans)
 */

const crypto = require('crypto');

// Clé secrète pour la signature HMAC
// En production, utiliser une variable d'environnement
const QR_SECRET = process.env.QR_SECRET || 'stamply-qr-secret-2026';

// Durée de validité du QR code (ms) — 5 minutes par défaut
const QR_VALIDITY_MS = parseInt(process.env.QR_VALIDITY_MS) || 5 * 60 * 1000;

/**
 * Générer un QR code dynamique pour une carte
 * @param {string} carteId - UUID de la carte
 * @param {string} passSerialNumber - Numéro de série du pass
 * @returns {object} { qrData, qrString, expiresAt }
 */
function generateDynamicQR(carteId, passSerialNumber) {
  const timestamp = Date.now();
  const expiresAt = timestamp + QR_VALIDITY_MS;

  // Données du QR code
  const qrData = {
    v: '2',
    cid: carteId,
    sn: passSerialNumber,
    ts: timestamp,
  };

  // Signature HMAC pour vérification
  const payload = `${qrData.v}:${qrData.cid}:${qrData.sn}:${qrData.ts}`;
  const sig = crypto
    .createHmac('sha256', QR_SECRET)
    .update(payload)
    .digest('base64url')
    .substring(0, 16); // 16 chars suffisent pour la vérification

  qrData.sig = sig;

  // String encodé (compact, URL-safe)
  const qrString = Buffer.from(JSON.stringify(qrData)).toString('base64url');

  return {
    qrData,
    qrString,
    expiresAt: new Date(expiresAt).toISOString(),
    validitySeconds: QR_VALIDITY_MS / 1000,
  };
}

/**
 * Vérifier et décoder un QR code scanné
 * @param {string} qrString - Le string du QR code (base64url)
 * @returns {object} { valid, carteId, passSerialNumber, error, expired }
 */
function verifyDynamicQR(qrString) {
  try {
    // Décoder le QR string
    let qrData;
    try {
      const decoded = Buffer.from(qrString, 'base64url').toString('utf-8');
      qrData = JSON.parse(decoded);
    } catch {
      return { valid: false, error: 'QR code invalide (format incorrect)' };
    }

    // Vérifier la version
    if (qrData.v !== '2') {
      return { valid: false, error: 'Version QR code non supportée' };
    }

    // Vérifier les champs requis
    if (!qrData.cid || !qrData.sn || !qrData.ts || !qrData.sig) {
      return { valid: false, error: 'QR code incomplet' };
    }

    // Vérifier l'expiration
    const now = Date.now();
    const qrTimestamp = parseInt(qrData.ts);
    if (isNaN(qrTimestamp) || now - qrTimestamp > QR_VALIDITY_MS) {
      return {
        valid: false,
        expired: true,
        error: 'QR code expiré. Veuillez le régénérer.',
        carteId: qrData.cid,
        passSerialNumber: qrData.sn,
      };
    }

    // Vérifier la signature HMAC
    const payload = `${qrData.v}:${qrData.cid}:${qrData.sn}:${qrData.ts}`;
    const expectedSig = crypto
      .createHmac('sha256', QR_SECRET)
      .update(payload)
      .digest('base64url')
      .substring(0, 16);

    if (qrData.sig !== expectedSig) {
      return { valid: false, error: 'QR code invalide (signature incorrecte)' };
    }

    return {
      valid: true,
      carteId: qrData.cid,
      passSerialNumber: qrData.sn,
      timestamp: new Date(qrTimestamp).toISOString(),
      expired: false,
    };
  } catch (err) {
    console.error('[QR] Verify error:', err);
    return { valid: false, error: 'Erreur lors de la vérification' };
  }
}

/**
 * Générer un QR code statique (fallback, compatible avec l'ancien système)
 * Utilisé pour les cartes qui n'ont pas encore le QR dynamique
 */
function generateStaticQR(passSerialNumber) {
  return {
    qrString: passSerialNumber,
    type: 'static',
  };
}

module.exports = {
  generateDynamicQR,
  verifyDynamicQR,
  generateStaticQR,
  QR_VALIDITY_MS,
};
