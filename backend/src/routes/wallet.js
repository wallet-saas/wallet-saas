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

    // 1. Certificats
    const certs = {
      signer: !!process.env.APPLE_SIGNER_CERT_BASE64,
      cle: !!process.env.APPLE_SIGNER_KEY_BASE64,
      wwdr: !!process.env.APPLE_WWDR_BASE64,
    };
    ajouter('Certificats Apple présents', certs.signer && certs.cle && certs.wwdr, certs);

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
    }

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
