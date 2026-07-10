/**
 * Service Apple Wallet — Stamply
 * 
 * Génération de cartes .pkpass pour Apple Wallet.
 * Utilise les certificats Apple Developer.
 * 
 * Les certificats peuvent venir de :
 *   1. Variables d'environnement APPLE_*_BASE64 (prioritaire — pour Render)
 *   2. Fichiers dans APPLE_CERT_PATH (pour le développement local)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const { supabase } = require('../config/supabase');

const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || '4YVDLJ57J7';
const APPLE_PASS_TYPE_ID = process.env.APPLE_PASS_TYPE_ID || 'pass.com.stamply.4YVDLJ57J7';
const APPLE_CERT_PATH = process.env.APPLE_CERT_PATH || './config/apple-certs';
const FRONTEND_URL = process.env.FRONTEND_URL
  || (process.env.NODE_ENV === 'production' ? 'https://stamply-gamma.vercel.app' : 'http://localhost:3001');
const API_URL = process.env.API_URL
  || (process.env.NODE_ENV === 'production' ? 'https://stamply-backend-gn8z.onrender.com' : 'http://localhost:3000');

const TEMPLATE_DIR = path.join(process.cwd(), APPLE_CERT_PATH, 'StamplyLoyalty.pass');
const CERTS_DIR = path.join(process.cwd(), APPLE_CERT_PATH);

/**
 * Charge un certificat depuis une variable d'env base64 ou depuis un fichier.
 */
function loadCert(envKey, fileName) {
  // 1. Essayer variable d'environnement base64
  const envValue = process.env[envKey];
  if (envValue) {
    try {
      return Buffer.from(envValue, 'base64').toString('utf-8');
    } catch {
      console.warn(`[AppleWallet] Erreur décodage ${envKey}, fallback fichier`);
    }
  }

  // 2. Essayer le fichier
  const filePath = path.join(CERTS_DIR, fileName);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }

  return null;
}

/**
 * Vérifie si Apple Wallet est configuré.
 */
function isConfigured() {
  if (!APPLE_TEAM_ID) return false;

  const signerCert = loadCert('APPLE_SIGNER_CERT_BASE64', 'signerCert.pem');
  const signerKey = loadCert('APPLE_SIGNER_KEY_BASE64', 'signerKey.pem');
  const wwdr = loadCert('APPLE_WWDR_BASE64', 'wwdr.pem');

  return !!(signerCert && signerKey && wwdr);
}

/**
 * Lit et parse le template pass.json.
 */
function getPassTemplate() {
  const templatePath = path.join(TEMPLATE_DIR, 'pass.json');
  if (!fs.existsSync(templatePath)) return null;
  return JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
}

/**
 * Calcule le SHA1 d'un fichier.
 */
function sha1(filePath) {
  return crypto.createHash('sha1').update(fs.readFileSync(filePath)).digest('hex');
}

/**
 * Génère un fichier .pkpass Apple Wallet.
 * 
 * @param {Object} carte       - { pass_serial_number, points }
 * @param {Object} commercant  - { id, nom_enseigne, carte_couleur_primaire, carte_couleur_secondaire, points_recompense, adresse, ville }
 * @returns {string|null}      - URL de téléchargement du .pkpass ou null
 */
async function generateSaveUrl(carte, commercant) {
  if (!isConfigured()) return null;

  const serialNumber = carte.pass_serial_number;
  const tmpDir = path.join(process.cwd(), APPLE_CERT_PATH, '.tmp', serialNumber);

  try {
    // 1. Créer le dossier temporaire
    fs.mkdirSync(tmpDir, { recursive: true });

    // 2. Copier les images du template
    const images = ['icon.png', 'icon@2x.png', 'logo.png', 'logo@2x.png'];
    for (const img of images) {
      const src = path.join(TEMPLATE_DIR, img);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(tmpDir, img));
      }
    }

    // 3. Générer pass.json personnalisé
    const template = getPassTemplate();
    if (!template) throw new Error('Template pass.json introuvable');

    const passData = JSON.parse(
      JSON.stringify(template)
        .replace(/\{\{SERIAL_NUMBER\}\}/g, serialNumber)
        .replace(/\{\{TEAM_IDENTIFIER\}\}/g, APPLE_TEAM_ID)
        .replace(/\{\{ORGANIZATION_NAME\}\}/g, commercant.nom_enseigne || 'Mon Commerce')
        .replace(/\{\{BACKGROUND_COLOR\}\}/g, commercant.carte_couleur_primaire || '#6366f1')
        .replace(/\{\{FOREGROUND_COLOR\}\}/g, commercant.carte_couleur_secondaire || '#ffffff')
        .replace(/\{\{LABEL_COLOR\}\}/g, commercant.carte_couleur_secondaire || '#ffffff')
        .replace(/\{\{POINTS\}\}/g, String(carte.points || 0))
        .replace(/\{\{POINTS_REWARD\}\}/g, String(commercant.points_recompense || 10))
        .replace(/\{\{VISITS\}\}/g, String(carte.visites || 0))
        .replace(/\{\{ADDRESS\}\}/g, [commercant.adresse, commercant.ville].filter(Boolean).join(', ') || '')
        .replace(/\{\{RELEVANT_DATE\}\}/g, new Date().toISOString())
    );

    fs.writeFileSync(path.join(tmpDir, 'pass.json'), JSON.stringify(passData, null, 2));

    // 4. Générer manifest.json (SHA1 de tous les fichiers)
    const manifest = {};
    const files = fs.readdirSync(tmpDir).filter(f => f !== 'manifest.json');
    files.sort().forEach(f => {
      manifest[f] = sha1(path.join(tmpDir, f));
    });
    fs.writeFileSync(path.join(tmpDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    // 5. Signer le manifest avec les certificats Apple → signature
    const signerCertPem = loadCert('APPLE_SIGNER_CERT_BASE64', 'signerCert.pem');
    const signerKeyPem = loadCert('APPLE_SIGNER_KEY_BASE64', 'signerKey.pem');
    const wwdrPem = loadCert('APPLE_WWDR_BASE64', 'wwdr.pem');

    if (!signerCertPem || !signerKeyPem || !wwdrPem) {
      throw new Error('Certificats Apple manquants');
    }

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(JSON.stringify(manifest));
    const signature = sign.sign({ key: signerKeyPem, cert: signerCertPem, passphrase: '' }, 'DER');
    fs.writeFileSync(path.join(tmpDir, 'signature'), signature);

    // 6. Zipper en .pkpass
    const pkpassPath = path.join(process.cwd(), APPLE_CERT_PATH, '.tmp', `${serialNumber}.pkpass`);
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(pkpassPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);

      // Ajouter les fichiers dans l'ordre (important pour Apple Wallet)
      const orderedFiles = ['pass.json', ...images, 'manifest.json', 'signature'];
      for (const f of orderedFiles) {
        const fp = path.join(tmpDir, f);
        if (fs.existsSync(fp)) {
          archive.file(fp, { name: f });
        }
      }
      archive.finalize();
    });

    // 7. Upload vers Supabase Storage ou retourner un chemin local
    const fileName = `${serialNumber}.pkpass`;
    const publicUrl = `${API_URL}/api/wallet/pkpass/${fileName}`;

    // Nettoyer le dossier temporaire
    fs.rmSync(tmpDir, { recursive: true, force: true });

    return publicUrl;
  } catch (error) {
    console.error('[AppleWallet] generateSaveUrl error:', error.message);
    // Nettoyer en cas d'erreur
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    return null;
  }
}

/**
 * Sert un fichier .pkpass au client.
 */
function servePkpass(req, res) {
  const fileName = req.params.fileName;
  if (!fileName || !fileName.endsWith('.pkpass')) {
    return res.status(404).json({ error: 'Fichier introuvable' });
  }

  const filePath = path.join(CERTS_DIR, '.tmp', fileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier expiré ou introuvable' });
  }

  res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.sendFile(filePath);
}

/**
 * Envoie une notification push APNS pour mettre à jour une carte Apple Wallet.
 * 
 * @param {string} serialNumber - pass_serial_number de la carte
 * @param {number} newPoints    - nouveau solde de points
 */
async function updatePoints(serialNumber, newPoints) {
  if (!isConfigured()) return;

  try {
    // Pour APNS, il faut un certificat Apple Push Services distinct
    // Format: POST https://api.push.apple.com/3/device/{deviceToken}
    // La première fois, on stocke le deviceToken dans la table cartes
    // TODO: implémenter APNS avec le certificat push
    
    console.log(`[AppleWallet] Mise à jour points ${serialNumber} → ${newPoints} (APNS à implémenter)`);
  } catch (error) {
    console.error('[AppleWallet] updatePoints error:', error.message);
  }
}

module.exports = {
  isConfigured,
  generateSaveUrl,
  servePkpass,
  updatePoints,
};