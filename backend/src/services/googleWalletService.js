/**
 * Service Google Wallet — Stamply
 *
 * Génère et met à jour des cartes de fidélité Google Wallet.
 * Utilise l'API Google Wallet avec un compte de service (service account).
 *
 * ─── Prérequis (configuration manuelle) ───────────────────────────────────
 *  1. Créer un projet Google Cloud → activer "Google Wallet API"
 *  2. Créer un compte de service → télécharger la clé JSON
 *  3. Obtenir l'Issuer ID sur https://pay.google.com/business/console
 *  4. Ajouter dans backend/.env (ou variables Railway) :
 *       GOOGLE_WALLET_ISSUER_ID=3388000000XXXXXXXX
 *
 *       Option A — Railway/production (recommandé) :
 *         GOOGLE_WALLET_KEY_JSON={"type":"service_account","project_id":...}
 *         (collez le contenu du JSON en une seule ligne)
 *
 *       Option B — Développement local :
 *         GOOGLE_WALLET_KEY_FILE=./config/google-wallet-key.json
 *         + placer la clé JSON dans backend/config/google-wallet-key.json
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Si GOOGLE_WALLET_ISSUER_ID et les credentials ne sont pas configurés,
 * toutes les fonctions retournent null (mode simulation — aucun crash).
 */

const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;
const KEY_FILE_PATH = process.env.GOOGLE_WALLET_KEY_FILE;
// GOOGLE_WALLET_KEY_JSON : contenu JSON de la clé de service (pour Railway/prod)
// Prioritaire sur KEY_FILE_PATH. Copier le JSON en une seule ligne dans la variable.
const KEY_JSON_STRING = process.env.GOOGLE_WALLET_KEY_JSON;
const WALLET_API = 'https://walletobjects.googleapis.com/walletobjects/v1';
const GOOGLE_WALLET_SAVE_URL = 'https://pay.google.com/gp/v/save';

// Cache du token OAuth2 (valide 1 heure)
let _cachedToken = null;
let _tokenExpiry = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Vérifie si Google Wallet est configuré. */
function isConfigured() {
  return !!(ISSUER_ID && (KEY_JSON_STRING || KEY_FILE_PATH));
}

/**
 * Charge les credentials du compte de service.
 * Priorité 1 : variable d'environnement GOOGLE_WALLET_KEY_JSON (JSON inline — Railway/prod)
 * Priorité 2 : fichier référencé par GOOGLE_WALLET_KEY_FILE (développement local)
 */
function loadCredentials() {
  if (KEY_JSON_STRING) {
    try {
      return JSON.parse(KEY_JSON_STRING);
    } catch {
      throw new Error('[Google Wallet] GOOGLE_WALLET_KEY_JSON invalide — JSON malformé');
    }
  }

  if (!KEY_FILE_PATH) {
    throw new Error(
      '[Google Wallet] Aucun credential — définir GOOGLE_WALLET_KEY_JSON ou GOOGLE_WALLET_KEY_FILE'
    );
  }

  const keyPath = path.resolve(process.cwd(), KEY_FILE_PATH);
  if (!fs.existsSync(keyPath)) {
    throw new Error(`[Google Wallet] Fichier clé introuvable : ${keyPath}`);
  }
  return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

/**
 * Identifiant de la classe (template) pour un commerçant.
 * Format : {ISSUER_ID}.stamply_{commercant_id_sanitized}
 */
function getClassId(commercantId) {
  return `${ISSUER_ID}.stamply_${commercantId.replace(/-/g, '_')}`;
}

/**
 * Identifiant de l'objet (carte) pour un client.
 * Format : {ISSUER_ID}.{serial_number_sanitized}
 */
function getObjectId(serialNumber) {
  return `${ISSUER_ID}.${serialNumber.replace(/-/g, '_')}`;
}

// ─── Authentification ─────────────────────────────────────────────────────────

/**
 * Obtient un access token OAuth2 via JWT service account.
 * Le token est mis en cache jusqu'à 60 secondes avant expiration.
 */
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (_cachedToken && _tokenExpiry > now + 60) {
    return _cachedToken;
  }

  const credentials = loadCredentials();
  const jwtPayload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const signedJwt = jwt.sign(jwtPayload, credentials.private_key, { algorithm: 'RS256' });

  const response = await axios.post(
    'https://oauth2.googleapis.com/token',
    `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedJwt}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  _cachedToken = response.data.access_token;
  _tokenExpiry = now + 3600;
  return _cachedToken;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * Crée ou met à jour la LoyaltyClass pour un commerçant.
 * La classe est le template commun à toutes les cartes du commerçant.
 * Appelée une fois à la création du commerçant et lors des mises à jour de paramètres.
 */
async function upsertLoyaltyClass(commercant) {
  if (!isConfigured()) return null;

  const classId = getClassId(commercant.id);
  const token = await getAccessToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const loyaltyClass = {
    id: classId,
    issuerName: 'Stamply',
    programName: commercant.nom_enseigne,
    reviewStatus: 'APPROVED',
    hexBackgroundColor: commercant.carte_couleur_primaire || '#6366f1',
    countryCode: 'FR',
    ...(commercant.carte_logo_url && {
      programLogo: {
        sourceUri: { uri: commercant.carte_logo_url },
        contentDescription: {
          defaultValue: { language: 'fr', value: commercant.nom_enseigne },
        },
      },
    }),
    textModulesData: [
      {
        id: 'reward_threshold',
        header: 'Programme de fidélité',
        body: `Cumulez des points à chaque visite. ${commercant.points_recompense || 10} points = 1 récompense offerte.`,
      },
    ],
  };

  try {
    await axios.get(`${WALLET_API}/loyaltyClass/${classId}`, { headers });
    // Classe existante → mettre à jour
    await axios.put(`${WALLET_API}/loyaltyClass/${classId}`, loyaltyClass, { headers });
    console.log(`[Google Wallet] Classe mise à jour : ${classId}`);
  } catch (e) {
    if (e.response?.status === 404) {
      // Classe inexistante → créer
      await axios.post(`${WALLET_API}/loyaltyClass`, loyaltyClass, { headers });
      console.log(`[Google Wallet] Classe créée : ${classId}`);
    } else {
      throw new Error(
        `[Google Wallet] Erreur upsertLoyaltyClass: ${e.response?.data?.error?.message || e.message}`
      );
    }
  }

  return classId;
}

// ─── URL "Ajouter à Google Wallet" ───────────────────────────────────────────

/**
 * Génère l'URL "Ajouter à Google Wallet" pour une carte.
 *
 * Crée la LoyaltyClass du commerçant si nécessaire, puis signe un JWT
 * contenant la définition de la carte (LoyaltyObject).
 * L'URL retournée est : https://pay.google.com/gp/v/save/{jwt}
 *
 * @param {Object} carte       - { pass_serial_number, points }
 * @param {Object} commercant  - { id, nom_enseigne, carte_couleur_primaire, points_recompense, carte_logo_url }
 * @returns {string|null}      - URL ou null si non configuré / erreur
 */
async function generateSaveUrl(carte, commercant) {
  if (!isConfigured()) {
    console.log(
      '[Google Wallet] Non configuré — manquant:',
      !ISSUER_ID ? 'GOOGLE_WALLET_ISSUER_ID' : '',
      !(KEY_JSON_STRING || KEY_FILE_PATH) ? 'GOOGLE_WALLET_KEY_JSON ou GOOGLE_WALLET_KEY_FILE' : ''
    );
    return null;
  }

  try {
    // S'assurer que la classe du commerçant existe
    await upsertLoyaltyClass(commercant);

    const credentials = loadCredentials();
    const classId = getClassId(commercant.id);
    const objectId = getObjectId(carte.pass_serial_number);

    const loyaltyObject = {
      id: objectId,
      classId,
      state: 'ACTIVE',
      loyaltyPoints: {
        label: 'Points',
        balance: { int: carte.points || 0 },
      },
      barcode: {
        type: 'QR_CODE',
        value: carte.pass_serial_number,
        alternateText: carte.pass_serial_number,
      },
      textModulesData: [
        {
          id: 'next_reward',
          header: 'Prochaine récompense',
          body: `À ${commercant.points_recompense || 10} points`,
        },
      ],
      hexBackgroundColor: commercant.carte_couleur_primaire || '#6366f1',
    };

    // Le JWT est signé avec la clé privée du compte de service
    const jwtPayload = {
      iss: credentials.client_email,
      aud: 'google',
      origins: ['*'],
      typ: 'savetowallet',
      payload: {
        loyaltyObjects: [loyaltyObject],
      },
    };

    const token = jwt.sign(jwtPayload, credentials.private_key, { algorithm: 'RS256' });
    const saveUrl = `${GOOGLE_WALLET_SAVE_URL}/${token}`;

    console.log(`[Google Wallet] URL générée pour carte ${carte.pass_serial_number}`);
    return saveUrl;
  } catch (error) {
    const detail = error.response?.data?.error?.message || error.message;
    console.error('[Google Wallet] Erreur generateSaveUrl:', detail);
    if (error.response?.status === 401) {
      console.error('[Google Wallet] 401 — vérifiez que GOOGLE_WALLET_ISSUER_ID est correct et que le compte de service a les droits sur l\'Issuer ID');
    }
    return null; // Non-fatal : la carte est quand même créée en base
  }
}

// ─── Mise à jour des points ───────────────────────────────────────────────────

/**
 * Met à jour le solde de points d'une carte Google Wallet existante via REST API.
 * La carte dans le Wallet du client se met à jour automatiquement.
 *
 * @param {string} serialNumber - pass_serial_number de la carte
 * @param {number} newPoints    - nouveau solde de points
 */
async function updateLoyaltyObjectPoints(serialNumber, newPoints) {
  if (!isConfigured()) return;

  try {
    const objectId = getObjectId(serialNumber);
    const token = await getAccessToken();

    await axios.patch(
      `${WALLET_API}/loyaltyObject/${objectId}`,
      {
        loyaltyPoints: {
          label: 'Points',
          balance: { int: newPoints },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`[Google Wallet] Points mis à jour → ${serialNumber} : ${newPoints} pts`);
  } catch (error) {
    // Non-fatal : le scan est déjà enregistré en base, l'update du wallet est best-effort
    console.error(
      `[Google Wallet] Erreur updateLoyaltyObjectPoints (${serialNumber}):`,
      error.response?.data?.error?.message || error.message
    );
  }
}

module.exports = {
  isConfigured,
  generateSaveUrl,
  updateLoyaltyObjectPoints,
  upsertLoyaltyClass,
};
