/**
 * Stamply — Routes Admin V2
 * 
 * Authentification par email + mot de passe (login direct)
 * Gestion complète des commerçants et abonnements
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

// ─── Config ────────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@stamply.fr';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2b$10$Y7HlJC62gdlhVD16LlqaB.kD8n/Npo.fODEZtNWJ10OeJXyKwpWvC'; // StamplyAdmin2024!

// ─── Helper: Admin Token ────────────────────────────────────────────────────────

function signAdminToken(email) {
  return jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
}

function verifyAdminToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'admin') return decoded;
    return null;
  } catch {
    return null;
  }
}

// ─── Middleware: Admin Auth (Bearer token) ─────────────────────────────────────

function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyAdminToken(token);
    if (decoded) {
      req.admin = decoded;
      return next();
    }
  }
  return res.status(401).json({ success: false, error: 'Token admin invalide.' });
}

// ─── POST /api/admin/login ─────────────────────────────────────────────────────
// Connexion admin avec email + mot de passe

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email et mot de passe requis.' });
    }

    // Vérifier que l'email correspond à l'admin
    if (email !== ADMIN_EMAIL) {
      return res.status(401).json({ success: false, error: 'Email ou mot de passe incorrect.' });
    }

    // Vérifier le mot de passe
    // Si ADMIN_PASSWORD_HASH est défini, utiliser bcrypt
    // Sinon, vérifier contre ADMIN_PASSWORD (plain text pour dev)
    if (ADMIN_PASSWORD_HASH) {
      const valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
      if (!valid) {
        return res.status(401).json({ success: false, error: 'Email ou mot de passe incorrect.' });
      }
    } else if (password === process.env.ADMIN_PASSWORD) {
      // Mode dev sans hash
    } else {
      return res.status(401).json({ success: false, error: 'Email ou mot de passe incorrect.' });
    }

    const token = signAdminToken(email);
    res.json({ success: true, token, message: 'Connexion admin réussie.' });
  } catch (err) {
    console.error('[Admin] Login error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la connexion.' });
  }
});

// ─── GET /api/admin/stats ──────────────────────────────────────────────────────

router.get('/stats', adminAuth, async (req, res) => {
  try {
    const { count: totalCommercants } = await supabase
      .from('commercants').select('id', { count: 'exact', head: true });

    const { count: actifs } = await supabase
      .from('commercants').select('id', { count: 'exact', head: true })
      .eq('abonnement_statut', 'actif');

    const { count: cartes } = await supabase
      .from('cartes').select('id', { count: 'exact', head: true });

    const { count: boutiques } = await supabase
      .from('boutiques').select('id', { count: 'exact', head: true });

    const { count: visites_30j } = await supabase
      .from('visites').select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    res.json({
      success: true,
      data: {
        commerçants: { total: totalCommercants || 0, actifs: actifs || 0, inactifs: (totalCommercants || 0) - (actifs || 0) },
        cartes: cartes || 0,
        boutiques: boutiques || 0,
        visites_30j: visites_30j || 0,
      }
    });
  } catch (err) {
    console.error('[Admin] Stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/admin/commercants ────────────────────────────────────────────────
// Liste paginée des commerçants avec filtres

router.get('/commercants', adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const statut = req.query.statut; // actif, inactif, past_due, etc.

    let query = supabase
      .from('commercants')
      .select('id, email, nom_enseigne, telephone, adresse, ville, code_postal, abonnement_statut, stripe_customer_id, wallet_class_configured, created_at, updated_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`nom_enseigne.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (statut) {
      query = query.eq('abonnement_statut', statut);
    }

    const { data, error } = await query;

    // Compter le total
    let countQuery = supabase
      .from('commercants')
      .select('id', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`nom_enseigne.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (statut) {
      countQuery = countQuery.eq('abonnement_statut', statut);
    }

    const { count } = await countQuery;

    if (error) throw error;

    res.json({
      success: true,
      data: { commerçants: data || [], total: count || 0, page, totalPages: Math.max(1, Math.ceil((count || 0) / limit)) }
    });
  } catch (err) {
    console.error('[Admin] List commerçants error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/admin/commercants/:id ────────────────────────────────────────────
// Fiche détaillée d'un commerçant

router.get('/commercants/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: commercant, error } = await supabase
      .from('commercants')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !commercant) {
      return res.status(404).json({ success: false, error: 'Commerçant introuvable.' });
    }

    // Stats
    const { count: nbCartes } = await supabase.from('cartes').select('id', { count: 'exact', head: true }).eq('commercant_id', id);
    const { count: nbBoutiques } = await supabase.from('boutiques').select('id', { count: 'exact', head: true }).eq('commercant_id', id);
    const { count: nbVisites30j } = await supabase.from('visites').select('id', { count: 'exact', head: true }).eq('commercant_id', id).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    res.json({
      success: true,
      data: {
        ...commercant,
        stats: { cartes: nbCartes || 0, boutiques: nbBoutiques || 0, visites_30j: nbVisites30j || 0 }
      }
    });
  } catch (err) {
    console.error('[Admin] Get commerçant error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/admin/commercants/:id ────────────────────────────────────────────
// Modifier un commerçant (abonnement, wallet, etc.)

router.put('/commercants/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { abonnement_statut, wallet_class_configured, is_active } = req.body;

    const updates = {};
    if (abonnement_statut !== undefined) updates.abonnement_statut = abonnement_statut;
    if (wallet_class_configured !== undefined) updates.wallet_class_configured = wallet_class_configured;
    if (is_active !== undefined) updates.is_active = is_active;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('commercants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log
    await supabase.from('admin_logs').insert({
      action: 'update_commercant',
      target_id: id,
      details: JSON.stringify(updates),
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('[Admin] Update commerçant error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/admin/commercants/:id/suspendre ─────────────────────────────────

router.post('/commercants/:id/suspendre', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('commercants')
      .update({ abonnement_statut: 'suspendu', is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    await supabase.from('admin_logs').insert({
      action: 'suspendre_commercant',
      target_id: id,
    });

    res.json({ success: true, message: 'Commerçant suspendu.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/admin/commercants/:id/reactiver ─────────────────────────────────

router.post('/commercants/:id/reactiver', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('commercants')
      .update({ abonnement_statut: 'actif', is_active: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    await supabase.from('admin_logs').insert({
      action: 'reactiver_commercant',
      target_id: id,
    });

    res.json({ success: true, message: 'Commerçant réactivé.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/admin/commercants/:id/reset-password ────────────────────────────

router.post('/commercants/:id/reset-password', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, error: 'Mot de passe: 8 caractères minimum.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const { error } = await supabase
      .from('commercants')
      .update({ password: hash, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    await supabase.from('admin_logs').insert({
      action: 'reset_password',
      target_id: id,
    });

    res.json({ success: true, message: 'Mot de passe réinitialisé.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DELETE /api/admin/commercants/:id ─────────────────────────────────────────

router.delete('/commercants/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('commercants')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await supabase.from('admin_logs').insert({
      action: 'supprimer_commercant',
      target_id: id,
    });

    res.json({ success: true, message: 'Commerçant supprimé.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/admin/feedbacks ──────────────────────────────────────────────────

router.get('/feedbacks', adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('avis')
      .select('id, note, contenu, source, created_at, commercant_id, commercants(nom_enseigne)')
      .lte('note', 3)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const { count } = await supabase
      .from('avis')
      .select('id', { count: 'exact', head: true })
      .lte('note', 3);

    res.json({
      success: true,
      data: { feedbacks: data || [], total: count || 0, page, totalPages: Math.max(1, Math.ceil((count || 0) / limit)) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/admin/logs ───────────────────────────────────────────────────────

router.get('/logs', adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const { count } = await supabase
      .from('admin_logs')
      .select('id', { count: 'exact', head: true });

    res.json({
      success: true,
      data: { logs: data || [], total: count || 0, page, totalPages: Math.max(1, Math.ceil((count || 0) / limit)) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/admin/status ─────────────────────────────────────────────────────
// Santé des services externes

router.get('/status', adminAuth, async (req, res) => {
  try {
    const status = {
      google_wallet: { status: 'ok', message: 'API Google Wallet accessible', issuer_id: process.env.GOOGLE_WALLET_ISSUER_ID || 'non configuré' },
      fcm: { status: process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 'ok' : 'not_configured', message: process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 'Push notifications actives' : 'Mode simulation (clé manquante)' },
      stripe: { status: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'live' : 'test', message: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'Stripe live actif' : 'Mode test' },
      apple_wallet: { status: 'not_configured', message: 'Apple Wallet non configuré (certificat requis)' },
      supabase: { status: 'ok', message: 'Connecté' },
      backend: { status: 'ok', message: 'Serveur opérationnel', uptime: process.uptime() },
    };

    // Test rapide Supabase
    try {
      await supabase.from('commercants').select('id').limit(1);
    } catch {
      status.supabase = { status: 'error', message: 'Connexion Supabase échouée' };
    }

    // Test rapide Google Wallet
    try {
      const { google } = require('googleapis');
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY || '{}'),
        scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
      });
      const walletApi = google.walletobjects({ auth, version: 'v1' });
      await walletApi.issuer.get({ issuerId: process.env.GOOGLE_WALLET_ISSUER_ID });
    } catch {
      status.google_wallet = { status: 'error', message: 'API Google Wallet inaccessible (clé invalide?)' };
    }

    res.json({ success: true, data: status });
  } catch (err) {
    console.error('[Admin] Status error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/admin/clients ────────────────────────────────────────────────────
// Liste de tous les clients (cartes installées)

router.get('/clients', adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const commercantId = req.query.commercant_id;

    let query = supabase
      .from('cartes')
      .select('id, commercant_id, pass_type, pass_serial_number, pass_url, qr_code_url, actif, points, google_wallet_url, apple_wallet_url, installed_at, created_at, commercants(id, nom_enseigne)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (commercantId) {
      query = query.eq('commercant_id', commercantId);
    }

    const { data, error } = await query;

    if (error) throw error;

    let clients = data || [];
    if (search) {
      clients = clients.filter(c =>
        c.pass_serial_number?.toLowerCase().includes(search.toLowerCase()) ||
        c.pass_url?.toLowerCase().includes(search.toLowerCase()) ||
        c.commercants?.nom_enseigne?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Compter le total
    let countQuery = supabase.from('cartes').select('id', { count: 'exact', head: true });
    if (commercantId) countQuery = countQuery.eq('commercant_id', commercantId);
    const { count } = await countQuery;

    res.json({
      success: true,
      data: {
        clients: clients.map(c => ({
          id: c.id,
          pass_type: c.pass_type || 'google',
          pass_serial_number: c.pass_serial_number || '',
          pass_url: c.pass_url || '',
          qr_code_url: c.qr_code_url || '',
          actif: c.actif !== false,
          points: c.points || 0,
          google_wallet_url: c.google_wallet_url || '',
          apple_wallet_url: c.apple_wallet_url || '',
          installed: !!c.installed_at,
          commercant_id: c.commercant_id,
          commercant_nom: c.commercants?.nom_enseigne || '',
          created_at: c.created_at,
        })),
        total: count || 0,
        page,
        totalPages: Math.max(1, Math.ceil((count || 0) / limit))
      }
    });
  } catch (err) {
    console.error('[Admin] List clients error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/admin/scans ─────────────────────────────────────────────────────
// Historique des scans

router.get('/scans', adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const commercantId = req.query.commercant_id;

    let query = supabase
      .from('visites')
      .select('id, client_id, commercant_id, boutique_id, created_at, boutiques(nom)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (commercantId) {
      query = query.eq('commercant_id', commercantId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Stats
    const { count: totalScans } = await supabase.from('visites').select('id', { count: 'exact', head: true });
    const { count: scansToday } = await supabase.from('visites').select('id', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]);
    const { count: scansOrphelins } = await supabase.from('visites').select('id', { count: 'exact', head: true }).is('client_id', null);

    res.json({
      success: true,
      data: {
        scans: data || [],
        total: totalScans || 0,
        scans_today: scansToday || 0,
        scans_orphelins: scansOrphelins || 0,
        page,
        totalPages: Math.max(1, Math.ceil((totalScans || 0) / limit))
      }
    });
  } catch (err) {
    console.error('[Admin] List scans error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/admin/notifications/stats ────────────────────────────────────────
// Stats des notifications push

router.get('/notifications/stats', adminAuth, async (req, res) => {
  try {
    const { count: total } = await supabase.from('notifications').select('id', { count: 'exact', head: true });
    const { count: today } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]);
    const { count: pushReels } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('type', 'push').not('fcm_token', null);
    const { count: simulation } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('type', 'simulation');

    // Dernières notifs
    const { data: recentes } = await supabase
      .from('notifications')
      .select('id, type, titre, commercant_id, created_at, commercants(nom_enseigne)')
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      success: true,
      data: {
        total: total || 0,
        today: today || 0,
        push_reels: pushReels || 0,
        simulation: simulation || 0,
        recentes: recentes || [],
        mode: process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 'real' : 'simulation',
      }
    });
  } catch (err) {
    console.error('[Admin] Notifications stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/admin/push-test ────────────────────────────────────────────────
// Envoyer un push test à un commerçant

router.post('/push-test', adminAuth, async (req, res) => {
  try {
    const { commercant_id, titre, message } = req.body;

    if (!commercant_id) {
      return res.status(400).json({ success: false, error: 'commercant_id requis.' });
    }

    // Récupérer le token FCM du commerçant
    const { data: commercant } = await supabase
      .from('commercants')
      .select('fcm_token, nom_enseigne, notif_mode_simulation')
      .eq('id', commercant_id)
      .single();

    if (!commercant) {
      return res.status(404).json({ success: false, error: 'Commerçant introuvable.' });
    }

    if (commercant.notif_mode_simulation || !commercant.fcm_token) {
      return res.json({
        success: true,
        message: 'Mode simulation actif ou aucun token FCM — push non envoyé (simulation).',
        mode: 'simulation'
      });
    }

    // Envoyer via FCM
    const { sendPushToMerchant } = require('../services/notificationService');
    const result = await sendPushToMerchant(
      commercant_id,
      titre || 'Test Admin',
      message || 'Ceci est un test de notification depuis le panel admin.'
    );

    res.json({
      success: true,
      message: 'Push envoyé avec succès.',
      mode: 'real',
      result
    });
  } catch (err) {
    console.error('[Admin] Push test error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/admin/templates ─────────────────────────────────────────────────
// Templates d'avis utilisés

router.get('/templates', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('commercants')
      .select('id, nom_enseigne, avis_templates')
      .not('avis_templates', 'is', null);

    if (error) throw error;

    const templates = (data || []).map(c => ({
      commercant_id: c.id,
      commercant_nom: c.nom_enseigne,
      templates: c.avis_templates || [],
    })).filter(t => t.templates.length > 0);

    res.json({ success: true, data: { templates, total: templates.length } });
  } catch (err) {
    console.error('[Admin] Templates error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/admin/offres ────────────────────────────────────────────────────
// Toutes les offres promotionnelles

router.get('/offres', adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const statut = req.query.statut; // actives, expirees

    let query = supabase
      .from('offres')
      .select('id, titre, description, code_promo, reduction_pct, reduction_montant, date_debut, date_fin, actif, total_envoyes, total_utilises, commercant_id, created_at, commercants(nom_enseigne)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw error;

    let offres = data || [];
    const now = new Date().toISOString();

    if (statut === 'actives') {
      offres = offres.filter(o => o.actif === true && (!o.date_fin || o.date_fin >= now));
    } else if (statut === 'expirees') {
      offres = offres.filter(o => o.actif === false || (o.date_fin && o.date_fin < now));
    }

    const { count } = await supabase.from('offres').select('id', { count: 'exact', head: true });

    res.json({
      success: true,
      data: {
        offres,
        total: count || 0,
        page,
        totalPages: Math.max(1, Math.ceil((count || 0) / limit))
      }
    });
  } catch (err) {
    console.error('[Admin] Offres error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/admin/offres ───────────────────────────────────────────────────
// Créer une offre (admin)

router.post('/offres', adminAuth, async (req, res) => {
  try {
    const { titre, description, code_promo, reduction_pct, reduction_montant, date_debut, date_fin, commercant_id } = req.body;

    if (!titre || !commercant_id) {
      return res.status(400).json({ success: false, error: 'Titre et commercant_id requis.' });
    }

    const { data, error } = await supabase
      .from('offres')
      .insert({
        titre,
        description: description || '',
        code_promo: code_promo || '',
        reduction_pct: reduction_pct || 0,
        reduction_montant: reduction_montant || 0,
        date_debut: date_debut || new Date().toISOString(),
        date_fin: date_fin || null,
        commercant_id,
        actif: true,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('admin_logs').insert({
      action: 'creer_offre',
      target_id: data.id,
      details: JSON.stringify({ titre, commercant_id }),
    });

    res.json({ success: true, data, message: 'Offre créée.' });
  } catch (err) {
    console.error('[Admin] Create offre error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DELETE /api/admin/offres/:id ──────────────────────────────────────────────
// Supprimer une offre

router.delete('/offres/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('offres').delete().eq('id', id);

    if (error) throw error;

    await supabase.from('admin_logs').insert({
      action: 'supprimer_offre',
      target_id: id,
    });

    res.json({ success: true, message: 'Offre supprimée.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/admin/commercants/:id/force-wallet ─────────────────────────────
// Forcer la configuration Google Wallet d'un commerçant

router.post('/commercants/:id/force-wallet', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: commercant } = await supabase
      .from('commercants')
      .select('id, nom_enseigne, wallet_class_configured')
      .eq('id', id)
      .single();

    if (!commercant) {
      return res.status(404).json({ success: false, error: 'Commerçant introuvable.' });
    }

    // Marquer comme configuré
    await supabase
      .from('commercants')
      .update({ wallet_class_configured: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    await supabase.from('admin_logs').insert({
      action: 'force_wallet',
      target_id: id,
      details: JSON.stringify({ nom: commercant.nom_enseigne }),
    });

    res.json({
      success: true,
      message: `Wallet marqué comme configuré pour ${commercant.nom_enseigne}. N'oubliez pas de créer la LoyaltyClass via le dashboard du commerçant.`
    });
  } catch (err) {
    console.error('[Admin] Force wallet error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
