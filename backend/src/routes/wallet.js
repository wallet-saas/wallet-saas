const express = require('express');
const router = express.Router();
const {
  generateWalletCard,
  getInstallPage,
  downloadPass,
  getCommercantCards,
  generateCardForClient
} = require('../controllers/walletController');
const authMiddleware = require('../middleware/authMiddleware');

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
 * @route   GET /api/wallet/cards
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

module.exports = router;
