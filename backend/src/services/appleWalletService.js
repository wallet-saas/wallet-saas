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
const forge = require('node-forge');
const { supabase } = require('../config/supabase');

const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || '4YVDLJ57J7';
const APPLE_PASS_TYPE_ID = process.env.APPLE_PASS_TYPE_ID || 'pass.com.stamply.4YVDLJ57J7';
const APPLE_CERT_PATH = process.env.APPLE_CERT_PATH || './config/apple-certs';
const FRONTEND_URL = process.env.FRONTEND_URL
  || (process.env.NODE_ENV === 'production' ? 'https://stamply-gamma.vercel.app' : 'http://localhost:3001');
const API_URL = process.env.API_URL
  || (process.env.NODE_ENV === 'production' ? 'https://stamply-backend-gn8z.onrender.com' : 'http://localhost:3000');

const APNS_KEY_PATH = process.env.APNS_KEY_PATH || path.join(process.cwd(), APPLE_CERT_PATH, 'apns.pem');
const APNS_TEAM_ID = process.env.APPLE_TEAM_ID || '4YVDLJ57J7';
const APNS_KEY_ID = process.env.APNS_KEY_ID || null;
const APNS_TOPIC = process.env.APPLE_PASS_TYPE_ID || 'pass.com.stamply.4YVDLJ57J7';

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
  if (!isConfigured()) {
    console.log('[AppleWallet] generateSaveUrl: isConfigured() false');
    return null;
  }

  const serialNumber = carte.pass_serial_number;
  console.log(`[AppleWallet] generateSaveUrl: URL dynamique pour ${serialNumber}`);
  // Retourne l'URL de téléchargement — le pkpass est généré à la volée
  // pour contourner le système de fichiers éphémère de Render
  return `${API_URL}/api/wallet/pkpass/${serialNumber}.pkpass`;
}

/**
 * Sert un fichier .pkpass au client — généré à la volée
 * (contourne le système de fichiers éphémère de Render).
 */
async function servePkpass(req, res) {
  const fileName = req.params.fileName;
  if (!fileName || !fileName.endsWith('.pkpass')) {
    return res.status(404).json({ error: 'Fichier introuvable' });
  }

  const serialNumber = fileName.replace(/\.pkpass$/, '');

  try {
    const { data: carte, error: carteErr } = await supabase
      .from('cartes')
      .select('pass_serial_number, points, visites, commercant_id, apple_auth_token')
      .eq('pass_serial_number', serialNumber)
      .single();

    if (carteErr || !carte) {
      return res.status(404).json({ error: 'Carte introuvable' });
    }

    const { data: commercant, error: commErr } = await supabase
      .from('commercants')
      .select('nom_enseigne, carte_couleur_primaire, carte_couleur_secondaire, points_recompense, adresse, ville, latitude, longitude, carte_logo_url')
      .eq('id', carte.commercant_id)
      .single();

    if (commErr || !commercant) {
      return res.status(404).json({ error: 'Commerce introuvable' });
    }

    console.log(`[AppleWallet] servePkpass: génération du pass ${serialNumber}`);
    const pkpassBuffer = await generatePkpassBuffer(carte, commercant);
    if (!pkpassBuffer) {
      return res.status(500).json({ error: 'Erreur génération du pass' });
    }

    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(pkpassBuffer);
  } catch (error) {
    console.error('[AppleWallet] servePkpass error:', error.message);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Envoie une notification push APNS pour signaler à l'iPhone
 * qu'il doit récupérer le pass mis à jour (qui contient le message).
 * 
 * Contrairement à updatePoints(), cette fonction ne met pas à jour les points —
 * elle envoie juste le signal "content-available" pour que l'iPhone
 * appelle le web service et récupère le pass avec le message de notification.
 * 
 * Le changeMessage "🎯 {{NOTIF_BODY}}" dans pass.json fera apparaître
 * une notification système sur l'iPhone.
 * 
 * @param {string} serialNumber - pass_serial_number de la carte
 */
async function notifyPush(serialNumber) {
  if (!isConfigured()) return;

  try {
    const { data: carte } = await supabase
      .from('cartes')
      .select('apple_push_token')
      .eq('pass_serial_number', serialNumber)
      .single();

    if (!carte || !carte.apple_push_token) {
      console.log(`[AppleWallet] Pas de push token pour ${serialNumber}`);
      return;
    }

    // Utiliser le même certificat que pour signer les passes
    // (Apple permet d'utiliser le cert Pass Type ID pour les push)
    const signerCert = loadCert('APPLE_SIGNER_CERT_BASE64', 'signerCert.pem');
    const signerKey = loadCert('APPLE_SIGNER_KEY_BASE64', 'signerKey.pem');
    const wwdr = loadCert('APPLE_WWDR_BASE64', 'wwdr.pem');

    if (!signerCert || !signerKey) {
      console.log(`[AppleWallet] ⚠️ Certificat signataire manquant — push non envoyé pour ${serialNumber}`);
      return;
    }

    const http2 = require('http2');

    const client = http2.connect('https://api.push.apple.com:443', {
      ca: wwdr || undefined,
      key: signerKey,
      cert: signerCert,
    });

    const payload = JSON.stringify({
      aps: {
        'content-available': 1,
      },
    });

    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${carte.apple_push_token}`,
      'apns-topic': APNS_TOPIC,
      'apns-push-type': 'live',
      'apns-priority': '5',
    });

    req.on('response', (headers) => {
      const status = headers[':status'];
      if (status === 200) {
        console.log(`[AppleWallet] ✅ Push APNS envoyé pour ${serialNumber}`);
      } else {
        console.error(`[AppleWallet] ❌ Push APNS refusé (status ${status})`);
      }
      client.close();
    });

    req.on('error', (err) => {
      console.error('[AppleWallet] ❌ Erreur push APNS:', err.message);
      client.close();
    });

    req.end(payload);
  } catch (error) {
    console.error('[AppleWallet] notifyPush error:', error.message);
  }
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
    // Récupérer le push token stocké
    const { data: carte } = await supabase
      .from('cartes')
      .select('apple_push_token, apple_device_id')
      .eq('pass_serial_number', serialNumber)
      .single();

    if (!carte || !carte.apple_push_token) {
      console.log(`[AppleWallet] Pas de push token pour ${serialNumber} — notification ignorée`);
      return;
    }

    // Utiliser le même certificat que pour signer les passes
    // (Apple permet d'utiliser le cert Pass Type ID pour les push)
    const signerCert = loadCert('APPLE_SIGNER_CERT_BASE64', 'signerCert.pem');
    const signerKey = loadCert('APPLE_SIGNER_KEY_BASE64', 'signerKey.pem');
    const wwdr = loadCert('APPLE_WWDR_BASE64', 'wwdr.pem');

    if (!signerCert || !signerKey) {
      console.log(`[AppleWallet] ⚠️ Certificat signataire manquant — push non envoyé pour ${serialNumber}`);
      return;
    }

    const http2 = require('http2');

    const client = http2.connect('https://api.push.apple.com:443', {
      ca: wwdr || undefined,
      key: signerKey,
      cert: signerCert,
    });

    const payload = JSON.stringify({
      aps: {
        'content-available': 1,
      },
    });

    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${carte.apple_push_token}`,
      'apns-topic': APNS_TOPIC,
      'apns-push-type': 'live',
      'apns-priority': '5',
    });

    req.on('response', (headers) => {
      const status = headers[':status'];
      if (status === 200) {
        console.log(`[AppleWallet] ✅ Push APNS envoyé pour ${serialNumber}`);
      } else {
        console.error(`[AppleWallet] ❌ Push APNS refusé (status ${status})`);
      }
      client.close();
    });

    req.on('error', (err) => {
      console.error('[AppleWallet] ❌ Erreur push APNS:', err.message);
      client.close();
    });

    req.end(payload);
  } catch (error) {
    console.error('[AppleWallet] updatePoints error:', error.message);
  }
}

/**
 * Génère un buffer .pkpass (utilisé par le web service Apple)
 * 
 * @param {Object} carte       - { pass_serial_number, points, visites }
 * @param {Object} commercant  - { nom_enseigne, carte_couleur_primaire, ... }
 * @returns {Buffer|null}
 */
async function generatePkpassBuffer(carte, commercant) {
  if (!isConfigured()) return null;

  const serialNumber = carte.pass_serial_number;
  const tmpDir = path.join(process.cwd(), APPLE_CERT_PATH, '.tmp', `ws-${serialNumber}`);

  try {
    fs.mkdirSync(tmpDir, { recursive: true });

    // Copier les images du template
    const images = ['icon.png', 'icon@2x.png', 'logo.png', 'logo@2x.png'];
    for (const img of images) {
      const src = path.join(TEMPLATE_DIR, img);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(tmpDir, img));
      }
    }

    // Générer pass.json
    const template = getPassTemplate();
    if (!template) throw new Error('Template pass.json introuvable');

    // Chercher si un message de notification est stocké pour cette carte
    let notifMessage = '';
    try {
      const { data: carteDb } = await supabase
        .from('cartes')
        .select('last_notif_message')
        .eq('pass_serial_number', serialNumber)
        .single();
      if (carteDb?.last_notif_message) {
        notifMessage = `🎯 ${carteDb.last_notif_message}`;
      }
    } catch (_) {
      // Non bloquant
    }

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
        .replace(/\{\{AUTH_TOKEN\}\}/g, '')
        .replace(/\{\{NOTIF_BODY\}\}/g, notifMessage)
    );

    // Ajouter les données de géolocalisation si disponibles
    if (commercant.latitude && commercant.longitude) {
      passData.locations = [{
        latitude: parseFloat(commercant.latitude),
        longitude: parseFloat(commercant.longitude),
        relevantText: 'Vous êtes à proximité ! 🎉',
      }];
    }

    fs.writeFileSync(path.join(tmpDir, 'pass.json'), JSON.stringify(passData, null, 2));

    // Manifest.json
    const manifest = {};
    const files = fs.readdirSync(tmpDir).filter(f => f !== 'manifest.json');
    files.sort().forEach(f => {
      manifest[f] = sha1(path.join(tmpDir, f));
    });
    fs.writeFileSync(path.join(tmpDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    // Signature
    const signerCertPem = loadCert('APPLE_SIGNER_CERT_BASE64', 'signerCert.pem');
    const signerKeyPem = loadCert('APPLE_SIGNER_KEY_BASE64', 'signerKey.pem');
    if (!signerCertPem || !signerKeyPem) throw new Error('Certificats manquants');

    // Générer une signature PKCS#7 (CMS) détachée — exigé par Apple Wallet
    const wwdrPem = loadCert('APPLE_WWDR_BASE64', 'wwdr.pem');
    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(JSON.stringify(manifest));
    p7.addCertificate(forge.pki.certificateFromPem(signerCertPem));
    if (wwdrPem) p7.addCertificate(forge.pki.certificateFromPem(wwdrPem));
    p7.addSigner({
      key: forge.pki.privateKeyFromPem(signerKeyPem),
      certificate: forge.pki.certificateFromPem(signerCertPem),
      digestAlgorithm: forge.pki.oids.sha256,
    });
    p7.sign({ detached: true });
    const signature = Buffer.from(forge.asn1.toDer(p7.toAsn1()).getBytes(), 'binary');
    fs.writeFileSync(path.join(tmpDir, 'signature'), signature);

    // Zipper
    const pkpassPath = path.join(process.cwd(), APPLE_CERT_PATH, '.tmp', `ws-${serialNumber}.pkpass`);
    const output = fs.createWriteStream(pkpassPath);
    const archive = new archiver.ZipArchive({ zlib: { level: 9 } });

    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);

      const orderedFiles = ['pass.json', ...images, 'manifest.json', 'signature'];
      for (const f of orderedFiles) {
        const fp = path.join(tmpDir, f);
        if (fs.existsSync(fp)) {
          archive.file(fp, { name: f });
        }
      }
      archive.finalize();
    });

    // Lire le buffer
    const buffer = fs.readFileSync(pkpassPath);

    // Nettoyer
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(pkpassPath, { recursive: true, force: true });

    return buffer;
  } catch (error) {
    console.error('[AppleWallet] generatePkpassBuffer error:', error.message);
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    return null;
  }
}

module.exports = {
  APPLE_PASS_TYPE_ID,
  isConfigured,
  generateSaveUrl,
  servePkpass,
  updatePoints,
  notifyPush,
  generatePkpassBuffer,
};