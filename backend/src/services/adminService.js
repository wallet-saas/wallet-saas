/**
 * Stamply — Service Admin
 * 
 * Fonctions d'administration pour gérer :
 * - Commerçants (liste, fiche, reset password, suspendre, supprimer)
 * - Abonnements (statut, historique)
 * - Stats globales
 * - Logs admin
 */

const { supabase } = require('../config/supabase');
const bcrypt = require('bcrypt');

// ─── Commerçants ──────────────────────────────────────────────────────────────

async function listCommerçants({ page = 1, limit = 20, search = '', statut = 'all' } = {}) {
  const offset = (page - 1) * limit;

  let query = supabase
    .from('commercants')
    .select('id, email, nom_enseigne, telephone, created_at, stripe_customer_id', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`nom_enseigne.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // Note: filtrage par statut (is_active) fait en JS car la colonne peut ne pas exister encore

  const { data, error, count } = await query;
  if (error) throw error;

  let commerçants = data || [];
  if (statut === 'actif') {
    commerçants = commerçants.filter(c => c.is_active !== false);
  } else if (statut === 'inactif') {
    commerçants = commerçants.filter(c => c.is_active === false);
  }

  return {
    commerçants,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

async function getCommercantDetail(commercantId) {
  const { data, error } = await supabase
    .from('commercants')
    .select('*')
    .eq('id', commercantId)
    .single();

  if (error) throw error;

  // Compter les cartes
  const { count: cartesCount } = await supabase
    .from('cartes')
    .select('id', { count: 'exact', head: true })
    .eq('commercant_id', commercantId);

  // Compter les visites (30j)
  const { count: visites30j } = await supabase
    .from('visites')
    .select('id', { count: 'exact', head: true })
    .eq('commercant_id', commercantId)
    .gte('date_visite', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  // Dernières notifications
  const { data: dernieresNotifs } = await supabase
    .from('notifications')
    .select('id, type, titre, created_at')
    .eq('commercant_id', commercantId)
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    ...data,
    stats: {
      cartes: cartesCount || 0,
      visites_30j: visites30j || 0,
    },
    dernieres_notifications: dernieresNotifs || [],
  };
}

async function resetPassword(commercantId, newPassword) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const { error } = await supabase
    .from('commercants')
    .update({ password: hashedPassword })
    .eq('id', commercantId);

  if (error) throw error;
  return true;
}

async function updateCommercant(commercantId, updates) {
  // Ne pas permettre le mot de passe ici (utiliser resetPassword)
  const { password, ...safeUpdates } = updates;

  const { data, error } = await supabase
    .from('commercants')
    .update(safeUpdates)
    .eq('id', commercantId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function suspendreCommercant(commercantId) {
  const { error } = await supabase
    .from('commercants')
    .update({ is_active: false })
    .eq('id', commercantId);

  if (error) throw error;
  return true;
}

async function reactiverCommercant(commercantId) {
  const { error } = await supabase
    .from('commercants')
    .update({ is_active: true })
    .eq('id', commercantId);

  if (error) throw error;
  return true;
}

async function supprimerCommercant(commercantId) {
  const { error } = await supabase
    .from('commercants')
    .delete()
    .eq('id', commercantId);

  if (error) throw error;
  return true;
}

// ─── Stats globales ───────────────────────────────────────────────────────────

async function getGlobalStats() {
  // Total commerçants
  const { data: tousCommercants, count: totalCommercants } = await supabase
    .from('commercants')
    .select('id', { count: 'exact' });

  // is_active peut ne pas exister encore — tous considérés comme actifs par défaut
  let commercantsActifs = totalCommercants || 0;
  if (tousCommercants && tousCommercants.length > 0 && 'is_active' in tousCommercants[0]) {
    commercantsActifs = tousCommercants.filter(c => c.is_active !== false).length;
  }

  // Inscriptions par mois (6 derniers mois)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: inscriptions } = await supabase
    .from('commercants')
    .select('created_at')
    .gte('created_at', sixMonthsAgo.toISOString());

  const inscriptionsParMois = {};
  (inscriptions || []).forEach(c => {
    const mois = c.created_at.substring(0, 7); // YYYY-MM
    inscriptionsParMois[mois] = (inscriptionsParMois[mois] || 0) + 1;
  });

  // Total cartes
  const { count: totalCartes } = await supabase
    .from('cartes')
    .select('id', { count: 'exact', head: true });

  // Total visites (30j)
  const { count: visites30j } = await supabase
    .from('visites')
    .select('id', { count: 'exact', head: true })
    .gte('date_visite', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  // Commerçants récents (5 derniers)
  const { data: commercantsRecents } = await supabase
    .from('commercants')
    .select('id, email, nom_enseigne, created_at, is_active')
    .order('created_at', { ascending: false })
    .limit(5);

  // Whop stats
  const { count: avecWhop } = await supabase
    .from('commercants')
    .select('id', { count: 'exact', head: true })
    .not('whop_customer_id', 'is', null);

  return {
    commerçants: {
      total: totalCommercants || 0,
      actifs: commercantsActifs || 0,
      inactifs: (totalCommercants || 0) - (commercantsActifs || 0),
      avec_whop: avecWhop || 0,
    },
    inscriptions_par_mois: inscriptionsParMois,
    cartes: totalCartes || 0,
    visites_30j: visites30j || 0,
    commercants_recents: commercantsRecents || [],
  };
}

// ─── Logs admin ───────────────────────────────────────────────────────────────

async function logAdminAction(action, targetType, targetId, details) {
  const { error } = await supabase
    .from('admin_logs')
    .insert({
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });

  if (error) {
    console.error('[Admin] Erreur log:', error.message);
    // Non-fatal
  }
}

async function getAdminLogs({ page = 1, limit = 50 } = {}) {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('admin_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    logs: data || [],
    total: count || 0,
    page,
    limit,
  };
}

// ─── Feedback clients (<4 étoiles) ────────────────────────────────────────────

async function getFeedbacks({ page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('avis')
    .select('id, note, commentaire, created_at, commercant_id, commercants(nom_enseigne)')
    .lt('note', 4)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    feedbacks: data || [],
    total: count || 0,
    page,
    limit,
  };
}

module.exports = {
  listCommerçants,
  getCommercantDetail,
  resetPassword,
  updateCommercant,
  suspendreCommercant,
  reactiverCommercant,
  supprimerCommercant,
  getGlobalStats,
  logAdminAction,
  getAdminLogs,
  getFeedbacks,
};
