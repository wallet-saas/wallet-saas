/**
 * dashboardStatsService — statistiques de la page d'accueil du commerçant.
 *
 * Ces six fonctions étaient importées par le contrôleur analytics mais
 * n'existaient nulle part : chaque appel levait « getOverview is not a
 * function » et la page d'accueil restait vide. Elles sont ici implémentées
 * en lisant uniquement les tables réelles — aucune donnée simulée.
 */

const { supabase } = require('../config/supabase');

/** Renvoie la liste des jours (YYYY-MM-DD) des N derniers jours, ordre croissant. */
function derniersJours(nb) {
  const jours = [];
  for (let i = nb - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    jours.push(d.toISOString().slice(0, 10));
  }
  return jours;
}

/**
 * Vue d'ensemble : cartes installées, visites, notifications, clients dormants.
 * C'est le premier écran que voit le commerçant — tout doit être exact.
 */
async function getOverview(commercantId) {
  const maintenant = Date.now();
  const ilSemaine = new Date(maintenant - 7 * 24 * 60 * 60 * 1000).toISOString();
  const ilMois = new Date(maintenant - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [cartes, visites, notifications] = await Promise.all([
    supabase.from('cartes')
      .select('id, created_at, last_visit_at')
      .eq('commercant_id', commercantId),
    supabase.from('visites')
      .select('id, created_at')
      .eq('commercant_id', commercantId),
    supabase.from('notifications')
      .select('id, total_envoyes')
      .eq('commercant_id', commercantId),
  ]);

  const lignesCartes = cartes.data || [];
  const lignesVisites = visites.data || [];
  const lignesNotifs = notifications.data || [];

  // Dormant : aucune visite depuis plus de 30 jours (ou jamais venu depuis
  // l'installation de sa carte il y a plus de 30 jours)
  const seuil = new Date(maintenant - 30 * 24 * 60 * 60 * 1000);
  const clientsDormants = lignesCartes.filter(c => {
    const reference = c.last_visit_at || c.created_at;
    return reference && new Date(reference) < seuil;
  }).length;

  return {
    totalCartes: lignesCartes.length,
    totalVisites: lignesVisites.length,
    totalNotifications: lignesNotifs.reduce((s, n) => s + (n.total_envoyes || 0), 0),
    clientsDormants,
    cartesInstalleesCetteSemaine: lignesCartes.filter(c => c.created_at >= ilSemaine).length,
    visitesLastMonth: lignesVisites.filter(v => v.created_at >= ilMois).length,
  };
}

/**
 * Deux séries pour les graphiques d'accueil :
 *  - timeSeries    : cumul des cartes installées, jour par jour
 *  - visitesParJour: nombre de passages en caisse par jour
 */
async function getCardsEvolution(commercantId, jours = 30) {
  const debut = new Date();
  debut.setHours(0, 0, 0, 0);
  debut.setDate(debut.getDate() - (jours - 1));

  const [cartes, visites] = await Promise.all([
    supabase.from('cartes')
      .select('created_at')
      .eq('commercant_id', commercantId)
      .order('created_at', { ascending: true }),
    supabase.from('visites')
      .select('created_at')
      .eq('commercant_id', commercantId)
      .gte('created_at', debut.toISOString()),
  ]);

  const lignesCartes = cartes.data || [];
  const lignesVisites = visites.data || [];
  const liste = derniersJours(jours);

  // Cartes déjà installées avant la fenêtre : le cumul part de ce socle
  let cumul = lignesCartes.filter(c => c.created_at < debut.toISOString()).length;

  const parJourCartes = {};
  for (const c of lignesCartes) {
    const j = String(c.created_at).slice(0, 10);
    parJourCartes[j] = (parJourCartes[j] || 0) + 1;
  }

  const parJourVisites = {};
  for (const v of lignesVisites) {
    const j = String(v.created_at).slice(0, 10);
    parJourVisites[j] = (parJourVisites[j] || 0) + 1;
  }

  const timeSeries = liste.map(date => {
    cumul += parJourCartes[date] || 0;
    return { date, nouvelles: parJourCartes[date] || 0, cumul };
  });

  const visitesParJour = liste.map(date => ({
    date,
    count: parJourVisites[date] || 0,
  }));

  return { timeSeries, visitesParJour, jours };
}

/** Historique et volumétrie des notifications envoyées. */
async function getNotificationsStats(commercantId) {
  const { data } = await supabase
    .from('notifications')
    .select('id, titre, message, type, cible, total_envoyes, created_at')
    .eq('commercant_id', commercantId)
    .order('created_at', { ascending: false })
    .limit(50);

  const lignes = data || [];
  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  return {
    total: lignes.length,
    totalEnvoyes: lignes.reduce((s, n) => s + (n.total_envoyes || 0), 0),
    ceMois: lignes.filter(n => new Date(n.created_at) >= debutMois).length,
    dernieres: lignes.slice(0, 10),
  };
}

/** Clients sans visite depuis plus de N jours, les plus anciens d'abord. */
async function getClientsDormants(commercantId, jours = 30) {
  const seuil = new Date(Date.now() - jours * 24 * 60 * 60 * 1000);

  const { data } = await supabase
    .from('cartes')
    .select('id, pass_serial_number, points, client_nom, client_email, last_visit_at, created_at')
    .eq('commercant_id', commercantId);

  const clients = (data || [])
    .map(c => {
      const reference = c.last_visit_at || c.created_at;
      if (!reference || new Date(reference) >= seuil) return null;
      const joursInactif = Math.floor((Date.now() - new Date(reference).getTime()) / 86400000);
      return {
        id: c.id,
        statut: 'dormant',
        derniere_visite: c.last_visit_at,
        jours_inactif: joursInactif,
        carte: {
          pass_serial_number: c.pass_serial_number,
          points: c.points || 0,
          client_nom: c.client_nom,
          client_email: c.client_email,
        },
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.jours_inactif - a.jours_inactif);

  return { clients, total: clients.length };
}

/** Répartition des avis collectés et note moyenne. */
async function getAvisStats(commercantId) {
  const { data } = await supabase
    .from('avis')
    .select('note, source, created_at')
    .eq('commercant_id', commercantId);

  const lignes = data || [];
  const repartition = [1, 2, 3, 4, 5].map(note => ({
    note,
    nombre: lignes.filter(a => a.note === note).length,
  }));

  const total = lignes.length;
  const somme = lignes.reduce((s, a) => s + (a.note || 0), 0);

  return {
    total,
    noteMoyenne: total ? Math.round((somme / total) * 10) / 10 : 0,
    versGoogle: lignes.filter(a => a.source === 'google').length,
    feedbackInterne: lignes.filter(a => a.source !== 'google').length,
    repartition,
  };
}

/** Offres flash créées et envoyées. */
async function getOffresStats(commercantId) {
  const { data } = await supabase
    .from('offres')
    .select('id, titre, active, date_fin, created_at')
    .eq('commercant_id', commercantId)
    .order('created_at', { ascending: false })
    .limit(50);

  const lignes = data || [];
  const maintenant = new Date();

  return {
    total: lignes.length,
    actives: lignes.filter(o => o.active && (!o.date_fin || new Date(o.date_fin) > maintenant)).length,
    expirees: lignes.filter(o => o.date_fin && new Date(o.date_fin) <= maintenant).length,
    dernieres: lignes.slice(0, 10),
  };
}

module.exports = {
  getOverview,
  getCardsEvolution,
  getNotificationsStats,
  getClientsDormants,
  getAvisStats,
  getOffresStats,
};
