const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const googleWalletService = require('../services/googleWalletService');

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

  // 3. Stripe
  report.services.stripe = {
    status: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured',
    mode: process.env.STRIPE_SECRET_KEY ? 'ready' : 'needs STRIPE_SECRET_KEY',
  };

  // 4. FCM (Firebase)
  report.services.fcm = {
    status: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
      ? 'configured'
      : 'not_configured',
  };

  // 5. Apple Wallet
  report.services.apple_wallet = {
    status: process.env.APPLE_PASS_TYPE_IDENTIFIER && process.env.APPLE_TEAM_IDENTIFIER
      ? 'configured'
      : 'not_configured',
  };

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
      stripe_secret: process.env.STRIPE_SECRET_KEY ? '✅ configuré' : '❌ manquant',
      stripe_publishable: process.env.STRIPE_PUBLISHABLE_KEY ? '✅ configuré' : '❌ manquant',
      stripe_price_id: process.env.STRIPE_PRICE_ID ? '✅ configuré' : '❌ manquant',
      stripe_webhook: process.env.STRIPE_WEBHOOK_SECRET ? '✅ configuré' : '❌ manquant',
      google_wallet_issuer: process.env.GOOGLE_WALLET_ISSUER_ID ? '✅ configuré' : '❌ manquant',
      google_wallet_key: process.env.GOOGLE_WALLET_KEY_JSON || process.env.GOOGLE_WALLET_KEY_JSON_BASE64 || process.env.GOOGLE_WALLET_KEY_FILE
        ? '✅ configuré'
        : '❌ manquant',
      fcm_key: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || process.env.FIREBASE_SERVICE_ACCOUNT_PATH
        ? '✅ configuré'
        : '❌ manquant',
      apple_pass_type: process.env.APPLE_PASS_TYPE_IDENTIFIER ? '✅ configuré' : '❌ manquant',
      apple_team: process.env.APPLE_TEAM_IDENTIFIER ? '✅ configuré' : '❌ manquant',
      cors_origin: process.env.CORS_ORIGIN || 'non défini (accepte tout)',
    },
    memory: {
      used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  };

  res.json(diagnostics);
});

module.exports = router;
