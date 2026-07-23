const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const googleWalletService = require('../services/googleWalletService');
const appleWalletService = require('../services/appleWalletService');

/**
 * GET /api/health
 * Endpoint de diagnostic — vérifie tous les services
 * Public (pas de JWT requis)
 */
router.get('/', async (req, res) => {
  const start = Date.now();
  const report = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    node: process.version,
    services: {},
  };

  // 1. Supabase
  try {
    const { error } = await supabase.from('commercants').select('id').limit(1);
    report.services.supabase = error
      ? { status: 'error', error: error.message }
      : { status: 'ok' };
  } catch (err) {
    report.services.supabase = { status: 'error', error: err.message };
  }

  // 2. Google Wallet
  try {
    const walletConfigured = googleWalletService.isConfigured
      ? googleWalletService.isConfigured()
      : false;
    report.services.google_wallet = {
      status: walletConfigured ? 'ok' : 'simulation',
      configured: walletConfigured,
      mode: walletConfigured ? 'live' : 'simulation (pas de credentials)',
    };
  } catch (err) {
    report.services.google_wallet = { status: 'error', error: err.message };
  }

  // 3. FCM (Firebase)
  report.services.fcm = {
    status: process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
      ? 'configured'
      : 'not_configured',
  };

  // 5. Apple Wallet
  try {
    const awConfigured = appleWalletService.isConfigured();
    report.services.apple_wallet = {
      status: awConfigured ? 'ok' : 'not_configured',
      configured: awConfigured,
      mode: awConfigured ? 'live' : 'pas de certificats',
    };
  } catch (err) {
    report.services.apple_wallet = { status: 'error', error: err.message };
  }

  // Global status
  const hasError = Object.values(report.services).some(
    (s) => s.status === 'error'
  );
  if (hasError) report.status = 'degraded';

  report.response_time_ms = Date.now() - start;

  res.json(report);
});

/**
 * GET /api/health/diagnostics
 * Diagnostic détaillé — pour le dashboard admin
 * Public (pas de JWT — à protéger en prod avec IP whitelist)
 */
router.get('/diagnostics', async (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    env_vars: {
      supabase_url: process.env.SUPABASE_URL ? '✅ configuré' : '❌ manquant',
      supabase_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ configuré' : '❌ manquant',
      jwt_secret: process.env.JWT_SECRET ? '✅ configuré' : '❌ manquant',
      whop_api_key: process.env.WHOP_API_KEY?.startsWith('apik') ? '✅ configuré' : '❌ manquant',
      whop_webhook: process.env.WHOP_WEBHOOK_SECRET ? '✅ configuré' : '❌ manquant',
      whop_product_id: process.env.WHOP_PRODUCT_ID ? '✅ configuré' : '❌ manquant',
      google_wallet_issuer: process.env.GOOGLE_WALLET_ISSUER_ID ? '✅ configuré' : '❌ manquant',
      google_wallet_key: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_WALLET_KEY_JSON || process.env.GOOGLE_WALLET_KEY_JSON_BASE64 || process.env.GOOGLE_WALLET_KEY_FILE
        ? '✅ configuré'
        : '❌ manquant',
      fcm_key: process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || process.env.FIREBASE_SERVICE_ACCOUNT_PATH
        ? '✅ configuré'
        : '❌ manquant',
      apple_pass_type: process.env.APPLE_PASS_TYPE_ID ? '✅ configuré' : '❌ manquant',
      apple_team: process.env.APPLE_TEAM_ID ? '✅ configuré' : '❌ manquant',
      apple_cert: process.env.APPLE_SIGNER_CERT_BASE64 ? '✅ configuré' : '❌ manquant',
      apple_key: process.env.APPLE_SIGNER_KEY_BASE64 ? '✅ configuré' : '❌ manquant',
      apple_wwdr: process.env.APPLE_WWDR_BASE64 ? '✅ configuré' : '❌ manquant',
      cors_origin: process.env.CORS_ORIGIN || 'non défini (accepte tout)',
    },
    memory: {
      used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  };

  res.json(diagnostics);
});

/**
 * GET /api/health/test-apple
 * Teste la génération d'un pass Apple Wallet et retourne l'erreur exacte
 */
router.get('/test-apple', async (req, res) => {
  const result = {
    configured: appleWalletService.isConfigured(),
    pass_type_id: appleWalletService.APPLE_PASS_TYPE_ID || 'N/A',
    generate_test: null,
    error: null,
  };

  // Test generateSaveUrl avec un commerçant factice — MODE DEBUG
  try {
    // MODE DEBUG: on contourne le try/catch interne pour voir l'erreur exacte
    // On modifie la fonction temporairement via un test direct des étapes
    const testCarte = { pass_serial_number: 'test-00000000-0000-0000-0000-000000000000', points: 0 };
    const testCommercant = {
      nom_enseigne: 'Test',
      carte_couleur_primaire: '#6366f1',
      carte_couleur_secondaire: '#a5b4fc',
      points_recompense: 10,
      adresse: '1 rue Test',
      ville: 'Paris',
    };

    // Test étape par étape comme generateSaveUrl mais sans catch
    const serialNumber = testCarte.pass_serial_number;
    const APPLE_CERT_PATH = process.env.APPLE_CERT_PATH || './config/apple-certs';
    const TEMPLATE_DIR = require('path').join(process.cwd(), APPLE_CERT_PATH, 'StamplyLoyalty.pass');
    const tmpDir = require('path').join(process.cwd(), APPLE_CERT_PATH, '.tmp', serialNumber);

    // Step 1
    require('fs').mkdirSync(tmpDir, { recursive: true });
    result.step1_tmpDir = '✅ ok';

    // Step 2: images
    const images = ['icon.png', 'icon@2x.png', 'logo.png', 'logo@2x.png'];
    const missingImages = [];
    for (const img of images) {
      const src = require('path').join(TEMPLATE_DIR, img);
      if (require('fs').existsSync(src)) {
        require('fs').copyFileSync(src, require('path').join(tmpDir, img));
      } else {
        missingImages.push(img);
      }
    }
    result.step2_images = missingImages.length === 0 ? '✅ toutes présentes' : `⚠️ manquantes: ${missingImages.join(', ')}`;

    // Step 3: template
    const templatePath = require('path').join(TEMPLATE_DIR, 'pass.json');
    if (!require('fs').existsSync(templatePath)) throw new Error('Template pass.json introuvable');
    result.step3_template = '✅ chargé';

    // Step 4-5: signature
    const result_sign = appleWalletService.testSignature ? appleWalletService.testSignature() : 'non testé';
    result.step4_signature = result_sign;

    // Step 6: archiver
    const archiver = require('archiver');
    result.step5_archiverType = typeof archiver;
    result.step5_archiverCreate = typeof archiver.create;

    result.all_steps_ok = '✅ Voir logs Render pour les détails';
  } catch (err) {
    result.generate_test = '❌ Erreur';
    result.error = err.message;
  }

  res.json(result);
});

module.exports = router;
