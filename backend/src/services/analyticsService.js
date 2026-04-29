const { supabase } = require('../config/supabase');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Retourne une date ISO il y a N jours */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Groupe un tableau d'items par date (YYYY-MM-DD) à partir d'un champ timestamp */
function groupByDay(items, dateField) {
  return items.reduce((acc, item) => {
    const day = item[dateField]?.slice(0, 10);
    if (!day) return acc;
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
}

/** Convertit un objet { 'YYYY-MM-DD': count } en tableau trié pour graphe */
function toTimeSeries(grouped) {
  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

// ---------------------------------------------------------------------------
// Vue d'ensemble globale
// ---------------------------------------------------------------------------
async function getOverview(commercantId) {
  const [
    { count: totalCartes },
    { count: totalVisites },
    { data: notifications },
    { data: clientsDormants }
  ] = await Promise.all([
    supabase.from('cartes').select('*', { count: 'exact', head: true }).eq('commercant_id', commercantId),
    supabase.from('visites').select('*', { count: 'exact', head: true }).eq('commercant_id', commercantId),
    supabase.from('notifications').select('total_envoyes, total_ouverts').eq('commercant_id', commercantId),
    supabase.from('clients').select('id').eq('commercant_id', commercantId).eq('statut', 'dormant')
  ]);

  const totalNotificationsEnvoyees = (notifications || []).reduce((s, n) => s + (n.total_envoyes || 0), 0);
  const totalNotificationsOuvertes = (notifications || []).reduce((s, n) => s + (n.total_ouverts || 0), 0);
  const tauxOuvertureGlobal = totalNotificationsEnvoyees > 0
    ? Math.round((totalNotificationsOuvertes / totalNotificationsEnvoyees) * 100 * 10) / 10
    : 0;

  // Visites des 30 derniers jours
  const { count: visitesRecentes } = await supabase
    .from('visites')
    .select('*', { count: 'exact', head: true })
    .eq('commercant_id', commercantId)
    .gte('created_at', daysAgo(30));

  // Cartes installées cette semaine
  const { count: cartesRecentes } = await supabase
    .from('cartes')
    .select('*', { count: 'exact', head: true })
    .eq('commercant_id', commercantId)
    .gte('created_at', daysAgo(7));

  return {
    totalCartes: totalCartes || 0,
    cartesInstalleesCetteSemaine: cartesRecentes || 0,
    visitesLastMonth: visitesRecentes || 0,
    totalNotifications: totalNotificationsEnvoyees,
    clientsDormants: clientsDormants?.length || 0,
    tauxOuverture: tauxOuvertureGlobal
  };
}

// ---------------------------------------------------------------------------
// Évolution des cartes installées (courbe)
// ---------------------------------------------------------------------------
async function getCardsEvolution(commercantId, jours = 30) {
  const since = daysAgo(jours);

  const [
    { data: cartes, error: cartesError },
    { data: visites, error: visitesError }
  ] = await Promise.all([
    supabase
      .from('cartes')
      .select('created_at')
      .eq('commercant_id', commercantId)
      .gte('created_at', since)
      .order('created_at', { ascending: true }),
    supabase
      .from('visites')
      .select('created_at')
      .eq('commercant_id', commercantId)
      .gte('created_at', since)
      .order('created_at', { ascending: true })
  ]);

  if (cartesError) throw new Error('Erreur récupération cartes.');

  const grouped = groupByDay(cartes, 'created_at');
  const timeSeries = toTimeSeries(grouped);

  // Cumulatif
  let cumul = 0;
  const timeSeriesCumulatif = timeSeries.map(({ date, count }) => {
    cumul += count;
    return { date, count, cumul };
  });

  // Visites par jour
  const visitesGrouped = groupByDay(visites || [], 'created_at');
  const visitesParJour = toTimeSeries(visitesGrouped);

  return {
    periode_jours: jours,
    total_periode: cartes.length,
    timeSeries: timeSeriesCumulatif,
    visitesParJour
  };
}

// ---------------------------------------------------------------------------
// Statistiques notifications
// ---------------------------------------------------------------------------
async function getNotificationsStats(commercantId) {
  const { data: notifs, error } = await supabase
    .from('notifications')
    .select('id, titre, cible, total_envoyes, total_ouverts, created_at, envoyee')
    .eq('commercant_id', commercantId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw new Error('Erreur récupération notifications.');

  const totalEnvoyes = notifs.reduce((s, n) => s + (n.total_envoyes || 0), 0);
  const totalOuverts = notifs.reduce((s, n) => s + (n.total_ouverts || 0), 0);

  return {
    totalNotifications: notifs.length,
    totalEnvoyes,
    totalOuverts,
    tauxOuverture: totalEnvoyes > 0
      ? Math.round((totalOuverts / totalEnvoyes) * 100 * 10) / 10
      : 0,
    dernieres: notifs.slice(0, 5).map(n => ({
      id: n.id,
      titre: n.titre,
      cible: n.cible,
      totalEnvoyes: n.total_envoyes,
      tauxOuverture: n.total_envoyes > 0
        ? Math.round((n.total_ouverts / n.total_envoyes) * 100)
        : 0,
      date: n.created_at
    }))
  };
}

// ---------------------------------------------------------------------------
// Clients dormants (pas vus depuis N jours)
// ---------------------------------------------------------------------------
async function getClientsDormants(commercantId, joursSeuil = 30) {
  const seuil = daysAgo(joursSeuil);

  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, carte_id, derniere_visite, nombre_visites, statut, created_at')
    .eq('commercant_id', commercantId)
    .or(`derniere_visite.lt.${seuil},derniere_visite.is.null`)
    .order('derniere_visite', { ascending: true, nullsFirst: true });

  if (error) throw new Error('Erreur récupération clients dormants.');

  const now = new Date();
  const clientsAvecInactivite = (clients || []).map(c => {
    const joursInactif = c.derniere_visite
      ? Math.floor((now - new Date(c.derniere_visite)) / (1000 * 60 * 60 * 24))
      : null;
    return { ...c, jours_inactif: joursInactif };
  });

  return {
    seuil_jours: joursSeuil,
    total: clientsAvecInactivite.length,
    clients: clientsAvecInactivite
  };
}

// ---------------------------------------------------------------------------
// Stats avis Google
// ---------------------------------------------------------------------------
async function getAvisStats(commercantId) {
  const { data: avis, error } = await supabase
    .from('avis')
    .select('id, note, source, reponse_validee, created_at')
    .eq('commercant_id', commercantId);

  if (error) throw new Error('Erreur récupération avis.');

  const total = avis.length;
  const notes = avis.filter(a => a.note !== null).map(a => a.note);
  const moyenneNote = notes.length > 0
    ? Math.round((notes.reduce((s, n) => s + n, 0) / notes.length) * 10) / 10
    : null;

  const parNote = [1, 2, 3, 4, 5].map(n => ({
    note: n,
    count: avis.filter(a => a.note === n).length
  }));

  const repondus = avis.filter(a => a.reponse_validee).length;

  const parSource = {
    google: avis.filter(a => a.source === 'google').length,
    formulaire_prive: avis.filter(a => a.source === 'formulaire_prive').length
  };

  return {
    total,
    moyenneNote,
    parNote,
    repondus,
    tauxReponse: total > 0 ? Math.round((repondus / total) * 100) : 0,
    parSource
  };
}

// ---------------------------------------------------------------------------
// Performance offres flash
// ---------------------------------------------------------------------------
async function getOffresStats(commercantId) {
  const { data: offres, error } = await supabase
    .from('offres')
    .select('id, titre, total_envoyes, total_utilises, actif, date_fin, created_at')
    .eq('commercant_id', commercantId)
    .order('created_at', { ascending: false });

  if (error) {
    // Table peut ne pas exister encore
    if (error.code === '42P01') return { erreur: 'Table offres non créée', offres: [] };
    throw new Error('Erreur récupération offres.');
  }

  const now = new Date();
  const offresAvecStats = (offres || []).map(o => ({
    ...o,
    tauxUtilisation: o.total_envoyes > 0
      ? Math.round((o.total_utilises / o.total_envoyes) * 100 * 10) / 10
      : 0,
    expiree: o.date_fin ? new Date(o.date_fin) < now : false
  }));

  const totalEnvoyes = offresAvecStats.reduce((s, o) => s + (o.total_envoyes || 0), 0);
  const totalUtilises = offresAvecStats.reduce((s, o) => s + (o.total_utilises || 0), 0);

  return {
    total: offresAvecStats.length,
    totalEnvoyes,
    totalUtilises,
    tauxGlobal: totalEnvoyes > 0 ? Math.round((totalUtilises / totalEnvoyes) * 100 * 10) / 10 : 0,
    offres: offresAvecStats
  };
}

module.exports = {
  getOverview,
  getCardsEvolution,
  getNotificationsStats,
  getClientsDormants,
  getAvisStats,
  getOffresStats
};
