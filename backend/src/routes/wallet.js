const express = require('express');
const router = express.Router();
const {
  generateWalletCard,
  getInstallPage,
  downloadPass,
  getCommercantCards,
  generateCardForClient,
} = require('../controllers/walletController');
const { setupWalletCard, updateWalletCard } = require('../controllers/walletSetupController');
const googleWalletService = require('../services/googleWalletService');
const appleWalletService = require('../services/appleWalletService');
const authMiddleware = require('../middleware/authMiddleware');
const { requireCommercant } = authMiddleware;
const { walletSetupValidation, handleValidationErrors } = require('../middleware/validation');

/**
 * @route   POST /api/wallet/setup
 * @desc    Configurer la LoyaltyClass Google Wallet (onboarding commerçant)
 * @access  Private (nécessite token JWT commerçant)
 */
router.post('/setup', authMiddleware, requireCommercant, walletSetupValidation, handleValidationErrors, setupWalletCard);

/**
 * @route   PUT /api/wallet/setup
 * @desc    Mettre à jour la LoyaltyClass Google Wallet existante
 * @access  Private (nécessite token JWT commerçant)
 */
router.put('/setup', authMiddleware, walletSetupValidation, handleValidationErrors, updateWalletCard);

/**
 * @route   POST /api/wallet/generate
 * @desc    Générer une nouvelle carte wallet
 * @access  Private (nécessite token JWT commerçant)
 */
router.post('/generate', authMiddleware, generateWalletCard);

/**
 * @route   GET /api/wallet/install/:serial
 * @desc    Page web pour installer une carte wallet (affiche QR code)
 * @access  Public
 */
router.get('/install/:serial', getInstallPage);

/**
 * @route   GET /api/wallet/download/:serial
 * @desc    Télécharger le fichier .pkpass
 * @access  Public
 */
router.get('/download/:serial', downloadPass);

/**
 * @route   GET /api/wallet/pkpass/:fileName
 * @desc    Servir le fichier .pkpass pour Apple Wallet
 * @access  Public
 */
/**
 * GET /api/wallet/diag/:serial
 * Diagnostic de la chaîne Apple Wallet, étape par étape. Permet de savoir
 * précisément où la génération échoue sans avoir à lire les logs du serveur.
 * Ne renvoie aucun secret : uniquement des présences et des tailles.
 */
router.get('/diag/:serial', async (req, res) => {
  const etapes = [];
  const ajouter = (nom, ok, detail) => etapes.push({ etape: nom, ok, detail });

  try {
    const { supabase } = require('../config/supabase');
    const serial = (req.params.serial || '').replace(/\.pkpass$/, '');

    // 1. Certificats : présence ET validité réelle. C'est le maillon que le
    // diagnostic ne vérifiait pas — un pass parfaitement formé mais mal signé
    // est refusé par iOS avec le même message que s'il ne se téléchargeait pas.
    const forge = require('node-forge');
    const certs = {
      signer: !!process.env.APPLE_SIGNER_CERT_BASE64,
      cle: !!process.env.APPLE_SIGNER_KEY_BASE64,
      wwdr: !!process.env.APPLE_WWDR_BASE64,
    };
    ajouter('Certificats fournis', certs.signer && certs.cle && certs.wwdr, certs);

    const enPem = (variable) => {
      const brut = process.env[variable];
      if (!brut) return null;
      const texte = brut.includes('BEGIN')
        ? brut
        : Buffer.from(brut, 'base64').toString('utf8');
      return texte.includes('BEGIN') ? texte : null;
    };

    let certSigner = null;
    try {
      const pem = enPem('APPLE_SIGNER_CERT_BASE64');
      certSigner = pem ? forge.pki.certificateFromPem(pem) : null;
      ajouter('Certificat de signature lisible', !!certSigner,
              certSigner ? 'format PEM valide' : 'illisible ou format inattendu');
    } catch (e) {
      ajouter('Certificat de signature lisible', false, e.message);
    }

    if (certSigner) {
      // a. Le Pass Type ID du certificat doit correspondre à celui du pass
      const sujet = certSigner.subject.attributes
        .map(a => `${a.shortName || a.name}=${a.value}`).join(', ');
      const uid = certSigner.subject.getField('UID')?.value
        || (sujet.match(/pass\.[\w.]+/) || [])[0] || null;
      const passTypeAttendu = process.env.APPLE_PASS_TYPE_ID || 'pass.com.stamply.4YVDLJ57J7';
      ajouter('Pass Type ID du certificat', uid === passTypeAttendu,
              `certificat : ${uid || 'introuvable'} | attendu : ${passTypeAttendu}`);

      // b. Le Team ID
      const ou = certSigner.subject.getField('OU')?.value || null;
      const teamAttendu = process.env.APPLE_TEAM_ID || '4YVDLJ57J7';
      ajouter('Team ID du certificat', ou === teamAttendu,
              `certificat : ${ou || 'introuvable'} | attendu : ${teamAttendu}`);

      // c. Validité dans le temps
      const maintenant = new Date();
      const debut = certSigner.validity.notBefore;
      const fin = certSigner.validity.notAfter;
      const valide = maintenant >= debut && maintenant <= fin;
      ajouter('Certificat non expiré', valide,
              `valable du ${debut.toISOString().slice(0,10)} au ${fin.toISOString().slice(0,10)}`);

      // d. Émis par Apple
      const emetteur = certSigner.issuer.attributes
        .map(a => a.value).join(' ');
      ajouter('Émis par Apple', /Apple/i.test(emetteur), emetteur);

      // e. La clé privée correspond-elle au certificat ?
      try {
        const pemCle = enPem('APPLE_SIGNER_KEY_BASE64');
        const cle = forge.pki.privateKeyFromPem(pemCle);
        const correspond = cle.n && certSigner.publicKey.n &&
                           cle.n.toString(16) === certSigner.publicKey.n.toString(16);
        ajouter('Clé privée associée au certificat', !!correspond,
                correspond ? 'la paire correspond' : 'LA CLÉ NE CORRESPOND PAS AU CERTIFICAT');
      } catch (e) {
        ajouter('Clé privée associée au certificat', false, e.message);
      }
    }

    // f. Le certificat WWDR d'Apple
    try {
      const pemWwdr = enPem('APPLE_WWDR_BASE64');
      const wwdr = pemWwdr ? forge.pki.certificateFromPem(pemWwdr) : null;
      if (wwdr) {
        const finWwdr = wwdr.validity.notAfter;
        const valideWwdr = new Date() <= finWwdr;
        const nomWwdr = wwdr.subject.getField('CN')?.value || '';
        ajouter('Certificat WWDR valide', valideWwdr,
                `${nomWwdr} — expire le ${finWwdr.toISOString().slice(0,10)}` +
                (valideWwdr ? '' : ' ⚠️ EXPIRÉ : télécharger le WWDR G4 sur le site Apple'));
      } else {
        ajouter('Certificat WWDR valide', false, 'illisible');
      }
    } catch (e) {
      ajouter('Certificat WWDR valide', false, e.message);
    }

    // 2. La carte existe
    const { data: carte, error: errCarte } = await supabase
      .from('cartes').select('*').eq('pass_serial_number', serial).single();
    ajouter('Carte trouvée en base', !!carte, errCarte?.message || (carte ? `id ${carte.id}` : 'aucune ligne'));
    if (!carte) return res.json({ success: false, etapes });

    // 3. Colonnes attendues sur la carte
    const attenduesCarte = ['points', 'visites', 'solde', 'total_depense', 'statut_palier',
                            'coupon_utilise', 'apple_auth_token', 'commercant_id'];
    const manquantesCarte = attenduesCarte.filter(c => !(c in carte));
    ajouter('Colonnes de la table cartes', manquantesCarte.length === 0,
            manquantesCarte.length ? `MANQUANTES : ${manquantesCarte.join(', ')}` : 'toutes présentes');

    // 4. Le commerçant existe
    const { data: commercant, error: errComm } = await supabase
      .from('commercants').select('*').eq('id', carte.commercant_id).single();
    ajouter('Commerçant trouvé', !!commercant, errComm?.message || commercant?.nom_enseigne);
    if (!commercant) return res.json({ success: false, etapes });

    // 5. Colonnes attendues sur le commerçant
    const attenduesComm = ['carte_type', 'carte_type_config', 'carte_logo_url',
                           'carte_background_image_url', 'module_geolocalisation',
                           'rayon_geoloc_metres', 'geoloc_message', 'module_avis_google'];
    const manquantesComm = attenduesComm.filter(c => !(c in commercant));
    ajouter('Colonnes de la table commercants', manquantesComm.length === 0,
            manquantesComm.length ? `MANQUANTES : ${manquantesComm.join(', ')}` : 'toutes présentes');

    // 6. Jeton d'authentification du pass
    const token = carte.apple_auth_token || '';
    ajouter('Jeton du pass (≥16 caractères)', token.length >= 16,
            token ? `${token.length} caractères` : 'absent — sera généré à la volée');

    // 7. Génération réelle
    const appleWalletService = require('../services/appleWalletService');
    let buffer = null;
    let erreurGeneration = null;
    try {
      buffer = await appleWalletService.generatePkpassBuffer(carte, commercant);
    } catch (e) {
      erreurGeneration = e.message;
    }
    ajouter('Génération du fichier .pkpass', !!buffer,
            buffer ? `${buffer.length} octets` : (erreurGeneration || 'buffer vide'));

    // 8. Archive valide
    if (buffer) {
      ajouter('Archive ZIP valide', buffer.slice(0, 2).toString() === 'PK',
              buffer.slice(0, 2).toString());

      // 9. Contenu du pass — c'est ici que se voient les images manquantes.
      // iOS refuse un pass sans icon.png et affiche « Safari ne peut pas
      // télécharger ce fichier », alors que le fichier est pourtant produit.
      try {
        // Parcours des en-têtes locaux du ZIP : signature PK\x03\x04, puis la
        // longueur du nom à l'octet 26 et le nom lui-même à l'octet 30.
        const noms = [];
        for (let i = 0; i < buffer.length - 30; i++) {
          if (buffer[i] === 0x50 && buffer[i + 1] === 0x4b &&
              buffer[i + 2] === 0x03 && buffer[i + 3] === 0x04) {
            const longueur = buffer.readUInt16LE(i + 26);
            if (longueur > 0 && longueur < 64) {
              const nom = buffer.slice(i + 30, i + 30 + longueur).toString('utf8');
              if (/^[\w@.\-]+$/.test(nom) && !noms.includes(nom)) noms.push(nom);
            }
          }
        }
        const requis = ['icon.png', 'icon@2x.png', 'pass.json', 'manifest.json', 'signature'];
        const manquants = requis.filter(f => !noms.some(n => n.startsWith(f.split('.')[0])));
        ajouter('Fichiers présents dans le pass', manquants.length === 0,
                `contient : ${noms.join(', ') || '(illisible)'}` +
                (manquants.length ? ` — MANQUENT : ${manquants.join(', ')}` : ''));
      } catch (e) {
        ajouter('Fichiers présents dans le pass', false, e.message);
      }
    }

    // 9 bis. Dimensions des images et contenu de pass.json — c'est ce qu'iOS
    // examine pour accepter ou refuser. Une icône aux mauvaises dimensions ou
    // un champ invalide suffit à faire rejeter un pass parfaitement signé.
    if (buffer) {
      try {
        const AdmZip = require('adm-zip');
        const zip = new AdmZip(buffer);
        const entrees = zip.getEntries();

        // Dimensions des PNG : Apple impose 29x29 pour icon.png et 58x58 pour
        // icon@2x.png. Un pass dont l'icône est hors format est rejeté par iOS.
        const dimensions = {};
        const attendu = { 'icon.png': [29, 29], 'icon@2x.png': [58, 58], 'icon@3x.png': [87, 87] };
        let iconesOk = true;
        for (const e of entrees.filter(x => x.entryName.endsWith('.png'))) {
          const png = e.getData();
          if (png.length > 24 && png.slice(1, 4).toString() === 'PNG') {
            const l = png.readUInt32BE(16);
            const h = png.readUInt32BE(20);
            dimensions[e.entryName] = `${l}x${h}`;
            if (attendu[e.entryName] && (l !== attendu[e.entryName][0] || h !== attendu[e.entryName][1])) {
              dimensions[e.entryName] += ` ⚠️ attendu ${attendu[e.entryName][0]}x${attendu[e.entryName][1]}`;
              iconesOk = false;
            }
          } else {
            dimensions[e.entryName] = 'PNG INVALIDE';
            iconesOk = false;
          }
        }
        ajouter('Dimensions des images', iconesOk, dimensions);

        // Contenu de pass.json : c'est ce qu'iOS valide en premier.
        const entreePass = entrees.find(e => e.entryName === 'pass.json');
        if (entreePass) {
          const contenu = JSON.parse(entreePass.getData().toString('utf8'));
          const typeDeCarte = Object.keys(contenu).find(k =>
            ['storeCard', 'coupon', 'eventTicket', 'boardingPass', 'generic'].includes(k));

          const problemes = [];
          if (contenu.formatVersion !== 1) problemes.push('formatVersion doit valoir 1');
          if (!contenu.serialNumber) problemes.push('serialNumber manquant');
          if (!contenu.organizationName) problemes.push('organizationName manquant');
          if (!contenu.description) problemes.push('description manquante');
          if (!contenu.passTypeIdentifier) problemes.push('passTypeIdentifier manquant');
          if (!contenu.teamIdentifier) problemes.push('teamIdentifier manquant');
          if (!typeDeCarte) problemes.push('aucun type de carte (storeCard, coupon…)');
          if (contenu.webServiceURL && !contenu.authenticationToken) problemes.push('webServiceURL sans authenticationToken');
          if (contenu.webServiceURL && !/^https:\/\//.test(contenu.webServiceURL)) problemes.push('webServiceURL doit être en HTTPS');
          if (contenu.authenticationToken && contenu.authenticationToken.length < 16) problemes.push('authenticationToken trop court');
          if (contenu.maxDistance !== undefined && (!contenu.locations || !contenu.locations.length)) problemes.push('maxDistance sans locations');
          if (Array.isArray(contenu.locations) && contenu.locations.length === 0) problemes.push('locations est un tableau vide — le retirer');
          if (contenu.relevantDate && isNaN(Date.parse(contenu.relevantDate))) problemes.push('relevantDate mal formée');

          // Les champs vides ou non textuels sont une cause fréquente de rejet
          const champs = typeDeCarte ? (contenu[typeDeCarte] || {}) : {};
          for (const zone of ['headerFields', 'primaryFields', 'secondaryFields', 'auxiliaryFields', 'backFields']) {
            for (const champ of (champs[zone] || [])) {
              if (champ.value === undefined || champ.value === null) {
                problemes.push(`${zone}/${champ.key} : valeur absente`);
              }
              if (champ.changeMessage && !String(champ.changeMessage).includes('%@')) {
                problemes.push(`${zone}/${champ.key} : changeMessage sans %@`);
              }
            }
          }

          ajouter('Structure de pass.json', problemes.length === 0,
                  problemes.length ? { problemes } : {
                    type: typeDeCarte,
                    passTypeIdentifier: contenu.passTypeIdentifier,
                    teamIdentifier: contenu.teamIdentifier,
                    webServiceURL: contenu.webServiceURL || '(aucun)',
                    locations: Array.isArray(contenu.locations) ? contenu.locations.length : 'absent',
                    maxDistance: contenu.maxDistance ?? '(aucun)',
                  });
        } else {
          ajouter('Structure de pass.json', false, 'pass.json absent de l\'archive');
        }

        // Le manifeste doit décrire exactement les fichiers présents
        const entreeManifest = entrees.find(e => e.entryName === 'manifest.json');
        if (entreeManifest) {
          const manifest = JSON.parse(entreeManifest.getData().toString('utf8'));
          const dansArchive = entrees.map(e => e.entryName)
            .filter(n => n !== 'manifest.json' && n !== 'signature');
          const manquants = Object.keys(manifest).filter(f => !dansArchive.includes(f));
          const nonListes = dansArchive.filter(f => !(f in manifest));
          ajouter('Manifeste cohérent', manquants.length === 0 && nonListes.length === 0,
                  manquants.length || nonListes.length
                    ? { annonces_absents: manquants, presents_non_annonces: nonListes }
                    : `${Object.keys(manifest).length} fichiers correctement référencés`);
        }
      } catch (e) {
        ajouter('Analyse du contenu du pass', false, e.message);
      }
    }

    // 10. Le transport lui-même : on interroge notre propre route comme le
    // ferait Safari, et on rapporte les en-têtes reçus. C'est la seule étape
    // qui teste la chaîne complète, proxy de l'hébergeur inclus.
    try {
      const base = process.env.API_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;
      const url = `${base}/api/wallet/pkpass/${encodeURIComponent(serial)}.pkpass`;
      const reponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1',
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': (process.env.FRONTEND_URL || '') + '/',
        },
        redirect: 'manual',
      });
      const corps = Buffer.from(await reponse.arrayBuffer());
      const entetes = {
        statut: reponse.status,
        'content-type': reponse.headers.get('content-type'),
        'content-length': reponse.headers.get('content-length'),
        'content-encoding': reponse.headers.get('content-encoding'),
        'cross-origin-resource-policy': reponse.headers.get('cross-origin-resource-policy'),
        'octets_recus': corps.length,
        'debut': corps.slice(0, 2).toString(),
      };
      const transportOk = reponse.status === 200
        && reponse.headers.get('content-type') === 'application/vnd.apple.pkpass'
        && corps.slice(0, 2).toString() === 'PK'
        && corps.length > 1000;
      ajouter('Téléchargement via HTTP (comme Safari)', transportOk, entetes);
    } catch (e) {
      ajouter('Téléchargement via HTTP (comme Safari)', false, e.message);
    }

    // 11. L'adresse vers laquelle pointe réellement le bouton
    ajouter("Lien du bouton « Ajouter à Apple Wallet »",
            !!carte.apple_wallet_url && carte.apple_wallet_url.includes('/api/wallet/pkpass/'),
            carte.apple_wallet_url || 'AUCUNE URL ENREGISTRÉE');

    const tout = etapes.every(e => e.ok);
    return res.json({
      success: tout,
      resume: tout
        ? "Tout est bon : le fichier se génère correctement."
        : "Une étape échoue — voir le premier « ok: false » ci-dessous.",
      etapes,
    });
  } catch (err) {
    ajouter('Erreur inattendue', false, err.message);
    return res.status(500).json({ success: false, etapes });
  }
});

router.get('/pkpass/:fileName', async (req, res, next) => {
  try {
    await appleWalletService.servePkpass(req, res);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/wallet/cartes
 * @desc    Récupérer toutes les cartes générées par le commerçant
 * @access  Private (nécessite token JWT commerçant)
 */
router.get('/cartes', authMiddleware, getCommercantCards);

/**
 * @route   POST /api/wallet/generate-for/:commercantId
 * @desc    Générer une carte pour un client (page d'installation publique)
 * @access  Public
 */
router.post('/generate-for/:commercantId', generateCardForClient);

/**
 * @route   GET /api/wallet/test-google
 * @desc    Diagnostic Google Wallet (env vars, credentials, access token)
 * @access  Public (temporaire — à supprimer en prod)
 */
router.get('/test-google', async (req, res) => {
  const report = await googleWalletService.testConnection();
  res.json(report);
});

/**
 * @route   GET /api/wallet/test-save-url
 * @desc    Test génération URL Google Wallet complète
 * @access  Public (temporaire — à supprimer en prod)
 */
router.get('/test-save-url', async (req, res) => {
  const report = await googleWalletService.testGenerateSaveUrl();
  res.json(report);
});

module.exports = router;
