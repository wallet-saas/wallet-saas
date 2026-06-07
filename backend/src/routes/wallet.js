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
const authMiddleware = require('../middleware/authMiddleware');
const { walletSetupValidation, handleValidationErrors } = require('../middleware/validation');

/**
 * @route   POST /api/wallet/setup
 * @desc    Configurer la LoyaltyClass Google Wallet (onboarding commerçant)
 * @access  Private (nécessite token JWT commerçant)
 */
router.post('/setup', authMiddleware, walletSetupValidation, handleValidationErrors, setupWalletCard);

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
