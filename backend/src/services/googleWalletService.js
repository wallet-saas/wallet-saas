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

// Lire les env vars dynamiquement à chaque appel (pas au require)
// pour éviter les problèmes d'injection tardive des variables Railway.
const WALLET_API = 'https://walletobjects.googleapis.com/walletobjects/v1';
const GOOGLE_WALLET_SAVE_URL = 'https://pay.google.com/gp/v/save';

// Cache du token OAuth2 (valide 1 heure)
let _cachedToken = null;
let _tokenExpiry = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Vérifie si Google Wallet est configuré (lecture dynamique). */
function isConfigured() {
  return !!(process.env.GOOGLE_WALLET_ISSUER_ID && (process.env.GOOGLE_WALLET_KEY_JSON || process.env.GOOGLE_WALLET_KEY_JSON_BASE64 || process.env.GOOGLE_WALLET_KEY_FILE));
}

/**
 * Charge les credentials du compte de service.
 * Priorité 1 : variable d'environnement GOOGLE_WALLET_KEY_JSON (JSON inline)
 * Priorité 2 : variable d'environnement GOOGLE_WALLET_KEY_JSON_BASE64 (JSON encodé en base64 — recommandé pour Render)
 * Priorité 3 : fichier référencé par GOOGLE_WALLET_KEY_FILE (développement local)
 */
function loadCredentials() {
  const KEY_JSON_STRING = process.env.GOOGLE_WALLET_KEY_JSON;
  const KEY_JSON_BASE64 = process.env.GOOGLE_WALLET_KEY_JSON_BASE64;
  const KEY_FILE_PATH = process.env.GOOGLE_WALLET_KEY_FILE;

  let creds = null;

  if (KEY_JSON_STRING) {
    try {
      creds = JSON.parse(KEY_JSON_STRING);
    } catch (e1) {
      try {
        creds = JSON.parse(KEY_JSON_STRING.replace(/\n/g, '\\n'));
      } catch (e2) {
        throw new Error(`[Google Wallet] GOOGLE_WALLET_KEY_JSON invalide — JSON malformé: ${e1.message}`);
      }
    }
  } else if (KEY_JSON_BASE64) {
    try {
      const decoded = Buffer.from(KEY_JSON_BASE64, 'base64').toString('utf8');
      creds = JSON.parse(decoded);
    } catch (e) {
      throw new Error(`[Google Wallet] GOOGLE_WALLET_KEY_JSON_BASE64 invalide — décodage échoué: ${e.message}`);
    }
  } else if (KEY_FILE_PATH) {
    const keyPath = path.resolve(process.cwd(), KEY_FILE_PATH);
    if (!fs.existsSync(keyPath)) {
      throw new Error(`[Google Wallet] Fichier clé introuvable : ${keyPath}`);
    }
    creds = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  } else {
    throw new Error(
      '[Google Wallet] Aucun credential — définir GOOGLE_WALLET_KEY_JSON, GOOGLE_WALLET_KEY_JSON_BASE64 ou GOOGLE_WALLET_KEY_FILE'
    );
  }

  // Fix: ensure private_key has real newlines
  // JSON.parse() already converts \\n to real newlines, but some environments
  // may have double-escaped newlines (\\\\n) or literal backslash-n
  if (creds && creds.private_key) {
    // Check if the key looks wrong (no proper PEM headers with newlines)
    if (!creds.private_key.includes('\n') && creds.private_key.includes('\\n')) {
      creds.private_key = creds.private_key.replace(/\\n/g, '\n');
    }
    // Handle double-escaped: \\n in the parsed string
    if (creds.private_key.includes('\\\\n')) {
      creds.private_key = creds.private_key.replace(/\\\\n/g, '\n');
    }
  }

  return creds;
}

/**
 * Identifiant de la classe (template) pour un commerçant.
 * Format : {ISSUER_ID}.stamply_{commercant_id_sanitized}
 */
function getClassId(commercantId) {
  return `${process.env.GOOGLE_WALLET_ISSUER_ID}.stamply_${commercantId.replace(/-/g, '_')}`;
}

/**
 * Identifiant de l'objet (carte) pour un client.
 * Format : {ISSUER_ID}.{serial_number_sanitized}
 */
function getObjectId(serialNumber) {
  return `${process.env.GOOGLE_WALLET_ISSUER_ID}.${serialNumber.replace(/-/g, '_')}`;
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

  // Use a valid placeholder image URL (Google Wallet requires a real image)
  const DEFAULT_LOGO = 'https://placehold.co/200x200/6366f1/ffffff?text=S';
  const logoUrl = (commercant.carte_logo_url && commercant.carte_logo_url.startsWith('http') && !commercant.carte_logo_url.includes('/api/images/') && !commercant.carte_logo_url.includes('localhost'))
    ? commercant.carte_logo_url
    : DEFAULT_LOGO;
  const programName = commercant.carte_programme_nom || commercant.nom_enseigne;
  const rewardBody = commercant.carte_recompense_description || ('Cumulez des points a chaque visite. ' + (commercant.points_recompense || 10) + ' points = 1 recompense offerte.');
  const bgColor = commercant.carte_couleur_primaire || '#6366f1';

  const baseClass = {
    id: classId,
    issuerName: 'Stamply',
    programName: programName,
    hexBackgroundColor: bgColor,
    countryCode: 'FR',
    programLogo: {
      sourceUri: { uri: logoUrl },
      contentDescription: {
        defaultValue: { language: 'fr-FR', value: programName },
      },
    },
    textModulesData: [
      {
        id: 'reward_threshold',
        header: 'Programme de fidelite',
        body: rewardBody,
      },
    ],
  };

  try {
    const getResp = await axios.get(`${WALLET_API}/loyaltyClass/${classId}`, { headers });
    console.log(`[Google Wallet] Classe trouvee, mise a jour : ${classId}`);
    // Classe existante → mettre à jour AVEC reviewStatus
    await axios.put(`${WALLET_API}/loyaltyClass/${classId}`, { ...baseClass, reviewStatus: 'UNDER_REVIEW' }, { headers });
    console.log(`[Google Wallet] Classe mise a jour : ${classId}`);
  } catch (e) {
    const status = e.response?.status;
    const detail = e.response?.data?.error?.message || e.response?.data?.message || e.message;
    const raw = JSON.stringify(e.response?.data || {});
    console.log(`[Google Wallet] GET/PUT status: ${status}, detail: ${detail}`);
    if (status === 404) {
      // Classe inexistante → créer
      console.log(`[Google Wallet] Classe non trouvee, creation...`);
      try {
        await axios.post(`${WALLET_API}/loyaltyClass`, { ...baseClass, reviewStatus: 'UNDER_REVIEW' }, { headers });
        console.log(`[Google Wallet] Classe creee : ${classId}`);
      } catch (postErr) {
        const postStatus = postErr.response?.status;
        const postDetail = postErr.response?.data?.error?.message || postErr.response?.data?.message || postErr.message;
        const postRaw = JSON.stringify(postErr.response?.data || {});
        console.log(`[Google Wallet] POST failed: ${postStatus} | ${postDetail} | ${postRaw}`);
        throw new Error(`[Google Wallet] POST loyaltyClass HTTP ${postStatus}: ${postDetail} | ${postRaw}`);
      }
    } else {
      throw new Error(`[Google Wallet] upsertLoyaltyClass HTTP ${status}: ${detail} | ${raw}`);
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
    console.warn(
      '[Google Wallet] Non configuré — manquant:',
      !process.env.GOOGLE_WALLET_ISSUER_ID ? 'GOOGLE_WALLET_ISSUER_ID ' : '',
      !(process.env.GOOGLE_WALLET_KEY_JSON || process.env.GOOGLE_WALLET_KEY_FILE) ? 'GOOGLE_WALLET_KEY_JSON' : ''
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

    console.log(`[Google Wallet] generateSaveUrl: upsert OK, signing JWT for ${carte.pass_serial_number}`);
    const token = jwt.sign(jwtPayload, credentials.private_key, { algorithm: 'RS256' });
    const saveUrl = `${GOOGLE_WALLET_SAVE_URL}/${token}`;
    console.log(`[Google Wallet] URL generee pour carte ${carte.pass_serial_number}: ${saveUrl.substring(0, 80)}...`);
    return saveUrl;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data?.error?.message || error.message;
    const raw = JSON.stringify(error.response?.data || {});
    console.error(`[Google Wallet] Erreur generateSaveUrl: HTTP ${status}: ${detail} | ${raw}`);
    const err = new Error(detail);
    err.httpStatus = status;
    err.raw = raw;
    throw err;
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

/**
 * Teste la connexion Google Wallet et retourne un rapport de diagnostic.
 */
async function testConnection() {
  const report = {
    issuer_id_set: !!process.env.GOOGLE_WALLET_ISSUER_ID,
    issuer_id_value: process.env.GOOGLE_WALLET_ISSUER_ID || null,
    key_json_set: !!process.env.GOOGLE_WALLET_KEY_JSON,
    key_json_length: process.env.GOOGLE_WALLET_KEY_JSON?.length || 0,
    key_file_set: !!process.env.GOOGLE_WALLET_KEY_FILE,
    credentials_parsed: false,
    credentials_email: null,
    access_token_ok: false,
    wallet_api_access: false,
    wallet_api_status: null,
    wallet_api_error: null,
    existing_classes: null,
    error: null,
  };

  try {
    const creds = loadCredentials();
    report.credentials_parsed = true;
    report.credentials_email = creds.client_email || null;

    const token = await getAccessToken();
    report.access_token_ok = true;

    // Test accès réel à l'API Wallet pour cet issuer
    const response = await axios.get(
      `${WALLET_API}/loyaltyClass?issuerId=${process.env.GOOGLE_WALLET_ISSUER_ID}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    report.wallet_api_access = true;
    report.wallet_api_status = response.status;
    report.existing_classes = response.data.resources?.length ?? 0;
  } catch (e) {
    const status = e.response?.status;
    const msg = e.response?.data?.error?.message || e.message;
    if (report.access_token_ok) {
      report.wallet_api_access = false;
      report.wallet_api_status = status;
      report.wallet_api_error = msg;
    } else {
      report.error = msg;
    }
  }

  return report;
}

/**
 * Teste la génération d'URL Google Wallet pour une carte de test.
 */
async function testGenerateSaveUrl() {
  const report = {
    success: false,
    step: null,
    error: null,
    saveUrl: null,
    classId: null,
  };

  try {
    const testCommercant = {
      id: '00000000-0000-0000-0000-000000000001',
      nom_enseigne: 'Test',
      carte_couleur_primaire: '#6366f1',
      carte_logo_url: 'https://placehold.co/200x200/6366f1/ffffff?text=S',
      carte_programme_nom: 'Test Programme',
      carte_recompense_description: 'Test recompense',
      points_recompense: 10,
    };
    const testCarte = {
      pass_serial_number: '00000000-0000-0000-0000-000000000001',
      points: 0,
    };

    report.step = 'upsertLoyaltyClass';
    await upsertLoyaltyClass(testCommercant);
    report.classId = getClassId(testCommercant.id);

    report.step = 'generateSaveUrl';
    const saveUrl = await generateSaveUrl(testCarte, testCommercant);
    report.saveUrl = saveUrl ? saveUrl.substring(0, 100) + '...' : null;
    report.success = !!saveUrl;
  } catch (e) {
    report.error = e.message;
    report.step = report.step || 'unknown';
  }

  return report;
}

module.exports = {
  isConfigured,
  generateSaveUrl,
  updateLoyaltyObjectPoints,
  upsertLoyaltyClass,
  testConnection,
  testGenerateSaveUrl,
};
