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
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || null; // bcrypt hash

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
      .select('id, note, commentaire, source, created_at, commercant_id, commercants(nom_enseigne)')
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

module.exports = router;
