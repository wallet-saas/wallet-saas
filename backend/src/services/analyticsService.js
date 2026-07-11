/**
 * Stamply — Service Analytics Avancé
 * 
 * Métriques style Whop/Paddle :
 * - MRR (Monthly Recurring Revenue)
 * - Churn rate
 * - LTV (Lifetime Value)
 * - ARPU (Average Revenue Per User)
 * - Courbes d'inscriptions / revenus
 * - Rétention
 * - Projections
 */

const { supabase } = require('../config/supabase');

const PRIX_MENSUEL = 49; // €/mois — prix Stamply

// ─── MRR (Monthly Recurring Revenue) ─────────────────────────────────────────

async function getMRR() {
  const { data: actifs, error } = await supabase
    .from('commercants')
    .select('id, abonnement_statut, whop_subscription_id, created_at')
    .eq('abonnement_statut', 'actif');

  if (error) throw error;

  const count = (actifs || []).length;
  return {
    mrr: count * PRIX_MENSUEL,
    annual_run_rate: count * PRIX_MENSUEL * 12,
    paying_customers: count,
  };
}

// ─── Churn Rate ───────────────────────────────────────────────────────────────

async function getChurnRate() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

  // Commerçants actifs il y a 30j
  const { data: actifs30j } = await supabase
    .from('commercants')
    .select('id, abonnement_statut, updated_at')
    .eq('abonnement_statut', 'actif')
    .gte('updated_at', thirtyDaysAgo.toISOString());

  // Commerçants qui étaient actifs il y a 60j
  const { data: actifs60j } = await supabase
    .from('commercants')
    .select('id, abonnement_statut, updated_at')
    .eq('abonnement_statut', 'actif')
    .gte('updated_at', sixtyDaysAgo.toISOString());

  // Ceux qui ont annulé/suspendu dans les 30 derniers jours
  const { data: churned } = await supabase
    .from('commercants')
    .select('id, abonnement_statut, updated_at')
    .in('abonnement_statut', ['annule', 'suspendu', 'impaye'])
    .gte('updated_at', thirtyDaysAgo.toISOString());

  const previousActifs = (actifs60j || []).length;
  const currentActifs = (actifs30j || []).length;
  const churnedCount = (churned || []).length;

  const churnRate = previousActifs > 0
    ? ((churnedCount / previousActifs) * 100).toFixed(2)
    : 0;

  return {
    churn_rate: parseFloat(churnRate),
    churned_30j: churnedCount,
    previous_actifs: previousActifs,
    current_actifs: currentActifs,
    net_change: currentActifs - previousActifs,
  };
}

// ─── LTV (Lifetime Value) ─────────────────────────────────────────────────────

async function getLTV() {
  const { data: commercants, error } = await supabase
    .from('commercants')
    .select('id, abonnement_statut, created_at, updated_at')
    .in('abonnement_statut', ['actif', 'annule', 'suspendu', 'impaye']);

  if (error) throw error;

  const now = Date.now();
  let totalRevenue = 0;
  let totalCustomers = 0;
  let activeCustomers = 0;
  let durations = [];

  (commercants || []).forEach(c => {
    const created = new Date(c.created_at).getTime();
    const updated = c.updated_at ? new Date(c.updated_at).getTime() : now;
    const durationDays = (updated - created) / (1000 * 60 * 60 * 24);
    const monthsActive = Math.max(1, Math.ceil(durationDays / 30));
    const revenue = monthsActive * PRIX_MENSUEL;

    totalRevenue += revenue;
    totalCustomers++;
    durations.push(durationDays);

    if (c.abonnement_statut === 'actif') activeCustomers++;
  });

  const avgLifetimeMonths = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length / 30
    : 0;

  const ltv = activeCustomers > 0
    ? totalRevenue / activeCustomers
    : 0;

  const avgLifetimeDays = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  return {
    ltv: Math.round(ltv * 100) / 100,
    avg_lifetime_months: Math.round(avgLifetimeMonths * 10) / 10,
    avg_lifetime_days: Math.round(avgLifetimeDays),
    total_revenue_estimated: Math.round(totalRevenue),
    total_customers_ever: totalCustomers,
    active_customers: activeCustomers,
  };
}

// ─── ARPU (Average Revenue Per User) ──────────────────────────────────────────

async function getARPU() {
  const { data: actifs } = await supabase
    .from('commercants')
    .select('id, abonnement_statut')
    .eq('abonnement_statut', 'actif');

  const count = (actifs || []).length;
  const mrr = count * PRIX_MENSUEL;

  return {
    arpu_monthly: count > 0 ? PRIX_MENSUEL : 0,
    arpu_annual: count > 0 ? PRIX_MENSUEL * 12 : 0,
    paying_customers: count,
    mrr,
  };
}

// ─── Courbe d'inscriptions (12 derniers mois) ─────────────────────────────────

async function getSignupHistory() {
  const months = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const monthLabel = monthStart.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

    const { count: total } = await supabase
      .from('commercants')
      .select('id', { count: 'exact', head: true })
      .lt('created_at', monthEnd.toISOString());

    const { count: newSignups } = await supabase
      .from('commercants')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString())
      .lt('created_at', monthEnd.toISOString());

    const { count: actifs } = await supabase
      .from('commercants')
      .select('id', { count: 'exact', head: true })
      .lt('created_at', monthEnd.toISOString())
      .eq('abonnement_statut', 'actif');

    months.push({
      month: monthLabel,
      month_index: 11 - i,
      total: total || 0,
      new_signups: newSignups || 0,
      actifs: actifs || 0,
    });
  }

  return months;
}

// ─── Courbe de revenus (12 derniers mois) ─────────────────────────────────────

async function getRevenueHistory() {
  const months = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const monthLabel = monthStart.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

    // Commerçants actifs à la fin du mois
    const { data: actifs } = await supabase
      .from('commercants')
      .select('id, created_at')
      .lt('created_at', monthEnd.toISOString())
      .eq('abonnement_statut', 'actif');

    const count = (actifs || []).length;
    const revenue = count * PRIX_MENSUEL;

    months.push({
      month: monthLabel,
      month_index: 11 - i,
      revenue,
      paying_customers: count,
    });
  }

  return months;
}

// ─── Rétention (cohortes) ─────────────────────────────────────────────────────

async function getRetention() {
  const now = new Date();
  const cohorts = [];

  for (let i = 5; i >= 0; i--) {
    const cohortStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const cohortEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const cohortLabel = cohortStart.toLocaleDateString('fr-FR', { month: 'short' });

    // Inscrits ce mois-là
    const { count: signed } = await supabase
      .from('commercants')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', cohortStart.toISOString())
      .lt('created_at', cohortEnd.toISOString());

    // Parmi eux, encore actifs aujourd'hui
    const { count: retained } = await supabase
      .from('commercants')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', cohortStart.toISOString())
      .lt('created_at', cohortEnd.toISOString())
      .eq('abonnement_statut', 'actif');

    cohorts.push({
      month: cohortLabel,
      signed: signed || 0,
      retained: retained || 0,
      retention_rate: signed > 0 ? Math.round((retained / signed) * 100) : 0,
    });
  }

  return cohorts;
}

// ─── Stats des scans (engagement) ─────────────────────────────────────────────

async function getScanStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const { count: total7j } = await supabase
    .from('visites')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString());

  const { count: total30j } = await supabase
    .from('visites')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());

  // Scans par jour (30 derniers jours)
  const daily = [];
  for (let i = 29; i >= 0; i--) {
    const dayStart = new Date(now - i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const dayLabel = dayStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

    const { count } = await supabase
      .from('visites')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', dayStart.toISOString())
      .lt('created_at', dayEnd.toISOString());

    daily.push({ day: dayLabel, scans: count || 0 });
  }

  return {
    scans_7j: total7j || 0,
    scans_30j: total30j || 0,
    avg_per_day_30j: total30j ? Math.round(total30j / 30) : 0,
    daily,
  };
}

// ─── Top commerçants par engagement ───────────────────────────────────────────

async function getTopCommerçants() {
  // Récupérer les commerçants actifs
  const { data, error } = await supabase
    .from('commercants')
    .select('id, nom_enseigne, abonnement_statut, created_at')
    .eq('abonnement_statut', 'actif')
    .limit(50);

  if (error) throw error;

  // Pour chaque commerçant, compter les visites et cartes
  const commerçants = [];
  for (const c of (data || [])) {
    const { count: nbCartes } = await supabase
      .from('cartes').select('id', { count: 'exact', head: true })
      .eq('commercant_id', c.id);
    
    const { count: nbVisites } = await supabase
      .from('visites').select('id', { count: 'exact', head: true })
      .eq('commercant_id', c.id);

    commerçants.push({
      id: c.id,
      nom: c.nom_enseigne,
      statut: c.abonnement_statut,
      cartes: nbCartes || 0,
      visites: nbVisites || 0,
      inscrit_le: c.created_at,
    });
  }

  // Trier par visites décroissantes et prendre top 10
  commerçants.sort((a, b) => b.visites - a.visites);
  return commerçants.slice(0, 10);
}

// ─── Projections ──────────────────────────────────────────────────────────────

async function getProjections() {
  const mrrData = await getMRR();
  const churnData = await getChurnRate();
  const ltvData = await getLTV();

  const currentMRR = mrrData.mrr;
  const churnRate = churnData.churn_rate / 100;
  const growthRate = 0.10; // Hypothèse 10% croissance mensuelle

  const projections = [];
  let projectedMRR = currentMRR;
  let projectedCustomers = mrrData.paying_customers;

  for (let i = 1; i <= 12; i++) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() + i);
    const monthLabel = monthDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });

    const newCustomers = Math.ceil(projectedCustomers * growthRate);
    const lostCustomers = Math.ceil(projectedCustomers * churnRate);
    projectedCustomers += newCustomers - lostCustomers;
    projectedMRR = projectedCustomers * PRIX_MENSUEL;

    projections.push({
      month: monthLabel,
      month_index: i,
      projected_mrr: projectedMRR,
      projected_customers: projectedCustomers,
      new_customers: newCustomers,
      lost_customers: lostCustomers,
    });
  }

  return {
    current_mrr: currentMRR,
    current_customers: mrrData.paying_customers,
    churn_rate: churnData.churn_rate,
    growth_assumption: Math.round(growthRate * 100),
    ltv: ltvData.ltv,
    projections,
  };
}

// ─── Dashboard complet ────────────────────────────────────────────────────────

async function getAnalyticsDashboard() {
  const [mrr, churn, ltv, arpu, signups, revenue, retention, scans, topCommercants, projections] = await Promise.all([
    getMRR(),
    getChurnRate(),
    getLTV(),
    getARPU(),
    getSignupHistory(),
    getRevenueHistory(),
    getRetention(),
    getScanStats(),
    getTopCommerçants(),
    getProjections(),
  ]);

  return {
    mrr,
    churn,
    ltv,
    arpu,
    signups,
    revenue,
    retention,
    scans,
    top_commercants: topCommercants,
    projections,
    price_monthly: PRIX_MENSUEL,
    generated_at: new Date().toISOString(),
  };
}

module.exports = {
  getMRR,
  getChurnRate,
  getLTV,
  getARPU,
  getSignupHistory,
  getRevenueHistory,
  getRetention,
  getScanStats,
  getTopCommerçants,
  getProjections,
  getAnalyticsDashboard,
};
