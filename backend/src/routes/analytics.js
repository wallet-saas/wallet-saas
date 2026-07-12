/**
 * Stamply — Routes Analytics Admin
 * 
 * API endpoints pour le dashboard analytics avancé :
 * - GET /api/analytics/dashboard → Toutes les métriques
 * - GET /api/analytics/mrr
 * - GET /api/analytics/churn
 * - GET /api/analytics/ltv
 * - GET /api/analytics/arpu
 * - GET /api/analytics/signups
 * - GET /api/analytics/revenue
 * - GET /api/analytics/retention
 * - GET /api/analytics/scans
 * - GET /api/analytics/top-commerçants
 * - GET /api/analytics/projections
 */

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const authMiddleware = require('../middleware/authMiddleware');
const commercantAnalyticsService = require('../services/commercantAnalyticsService');

// ─── GET /api/analytics/dashboard ─────────────────────────────────────────────

router.get('/dashboard', async (req, res) => {
  try {
    const dashboard = await analyticsService.getAnalyticsDashboard();
    res.json({ success: true, data: dashboard });
  } catch (err) {
    console.error('[Analytics] Dashboard error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/analytics/mrr ───────────────────────────────────────────────────

router.get('/mrr', async (req, res) => {
  try {
    const mrr = await analyticsService.getMRR();
    res.json({ success: true, data: mrr });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/analytics/churn ─────────────────────────────────────────────────

router.get('/churn', async (req, res) => {
  try {
    const churn = await analyticsService.getChurnRate();
    res.json({ success: true, data: churn });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/analytics/ltv ───────────────────────────────────────────────────

router.get('/ltv', async (req, res) => {
  try {
    const ltv = await analyticsService.getLTV();
    res.json({ success: true, data: ltv });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/analytics/arpu ──────────────────────────────────────────────────

router.get('/arpu', async (req, res) => {
  try {
    const arpu = await analyticsService.getARPU();
    res.json({ success: true, data: arpu });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/analytics/signups ───────────────────────────────────────────────

router.get('/signups', async (req, res) => {
  try {
    const signups = await analyticsService.getSignupHistory();
    res.json({ success: true, data: signups });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/analytics/revenue ───────────────────────────────────────────────

router.get('/revenue', async (req, res) => {
  try {
    const revenue = await analyticsService.getRevenueHistory();
    res.json({ success: true, data: revenue });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/analytics/retention ─────────────────────────────────────────────

router.get('/retention', async (req, res) => {
  try {
    const retention = await analyticsService.getRetention();
    res.json({ success: true, data: retention });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/analytics/scans ─────────────────────────────────────────────────

router.get('/scans', async (req, res) => {
  try {
    const scans = await analyticsService.getScanStats();
    res.json({ success: true, data: scans });
  } catch (err) {
    res.status(500). json({ success: false, error: err.message });
  }
});

// ─── GET /api/analytics/top-commerçants ───────────────────────────────────────

router.get('/top-commerçants', async (req, res) => {
  try {
    const top = await analyticsService.getTopCommerçants();
    res.json({ success: true, data: top });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/analytics/projections ───────────────────────────────────────────

router.get('/projections', async (req, res) => {
  try {
    const projections = await analyticsService.getProjections();
    res.json({ success: true, data: projections });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/analytics/commercant ────────────────────────────────────────────
// Dashboard analytics pour le commerçant connecté

router.get('/commercant', authMiddleware, async (req, res) => {
  try {
    const commercantId = req.commercant.id;
    const dashboard = await commercantAnalyticsService.getDashboard(commercantId);
    res.json({ success: true, data: dashboard });
  } catch (err) {
    console.error('[Analytics] Dashboard commerçant error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
