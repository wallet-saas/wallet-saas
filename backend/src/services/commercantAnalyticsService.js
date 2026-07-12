/**
 * Stamply — Service d'Analytics pour le Commerçant
 * 
 * Fournit les métriques du dashboard commerçant :
 * - Cartes, visites, rétention, etc.
 * - Données agrégées sur 30 jours rolling
 */

const { supabase } = require('../config/supabase');

// ─── Dashboard complet ────────────────────────────────────────────────────

async function getDashboard(commercantId) {
  try {
    // 1️⃣ Récupérer les infos du commerçant
    const { data: commercant, error: errComm } = await supabase
      .from('commercants')
      .select('id, nom_enseigne, type_fidelite, relance_auto, anniversaire_auto, points_recompense')
      .eq('id', commercantId)
      .single();

    if (errComm) throw new Error(`Erreur commerçant : ${errComm.message}`);
    if (!commercant) throw new Error('Commerçant introuvable');

    // 2️⃣ Récupérer toutes les cartes du commerçant
    const { data: cartes, error: errCartes } = await supabase
      .from('cartes')
      .select('id, points, last_visit_at, created_at, client_nom, client_email, client_telephone')
      .eq('commercant_id', commercantId);

    if (errCartes) throw new Error(`Erreur cartes : ${errCartes.message}`);

    const totalCartes = (cartes || []).length;

    // 3️⃣ Récupérer les visites des 60 derniers jours (pour avoir du contexte)
    const soixanteJours = new Date();
    soixanteJours.setDate(soixanteJours.getDate() - 60);

    const { data: visites60j, error: errVisites } = await supabase
      .from('visites')
      .select('id, carte_id, created_at')
      .eq('commercant_id', commercantId)
      .gte('created_at', soixanteJours.toISOString());

    if (errVisites) throw new Error(`Erreur visites : ${errVisites.message}`);

    // 4️⃣ Récupérer TOUTES les visites historiques pour chaque carte
    //    (nécessaire pour déterminer "première visite" vs "visite répétée")
    const { data: visitesAll, error: errAllVisites } = await supabase
      .from('visites')
      .select('id, carte_id, created_at')
      .eq('commercant_id', commercantId);

    if (errAllVisites) throw new Error(`Erreur visites historiques : ${errAllVisites.message}`);

    // ─── Calculs ───────────────────────────────────────────────────────

    const maintenant = new Date();
    const trenteJours = new Date(maintenant.getTime() - 30 * 24 * 60 * 60 * 1000);
    const soixanteJoursAgo = new Date(maintenant.getTime() - 60 * 24 * 60 * 60 * 1000);

    // --- Total visites 30j ---
    const visites30j = (visites60j || []).filter(v => new Date(v.created_at) >= trenteJours);
    const totalVisites30j = visites30j.length;

    // --- Nouvelles visites vs visites répétées ---
    // Compter les visites par carte (historique complet)
    const visitesParCarte = {};
    for (const v of visitesAll || []) {
      if (!visitesParCarte[v.carte_id]) visitesParCarte[v.carte_id] = [];
      visitesParCarte[v.carte_id].push(v);
    }

    let nouvellesVisites30j = 0;
    let visitesRepeatees30j = 0;

    for (const v of visites30j) {
      const totalCarte = (visitesParCarte[v.carte_id] || []).length;
      const visitesCarte30j = (visitesParCarte[v.carte_id] || [])
        .filter(x => new Date(x.created_at) >= trenteJours).length;

      if (totalCarte === 1 && visitesCarte30j === 1) {
        // Première visite de cette carte, et c'est dans les 30j
        nouvellesVisites30j++;
      } else if (totalCarte > 1 && visitesCarte30j >= 1) {
        // Visite répétée
        visitesRepeatees30j += visitesCarte30j;
      } else if (totalCarte === 1 && visitesCarte30j > 1) {
        // Cas théorique (plusieurs visites mais total=1?), compter comme nouvelle
        nouvellesVisites30j += visitesCarte30j;
      }
    }

    // Correction : éviter le double-compte pour les cartes avec >1 visites dans les 30j
    // On recalcule par carte
    nouvellesVisites30j = 0;
    visitesRepeatees30j = 0;

    for (const [carteId, visites] of Object.entries(visitesParCarte)) {
      const visitesDans30j = visites.filter(v => new Date(v.created_at) >= trenteJours);
      const nbDans30j = visitesDans30j.length;

      if (nbDans30j === 0) continue;

      const totalCarte = visites.length;

      if (totalCarte === nbDans30j && totalCarte === 1) {
        // 1 seule visite totale, dans les 30j → nouvelle
        nouvellesVisites30j++;
      } else {
        // Visites répétées
        visitesRepeatees30j += nbDans30j;
      }
    }

    // --- Taux de rétention ---
    // % de clients (cartes) qui sont revenus au moins 2x
    const cartesAvecMultiplesVisites = Object.values(visitesParCarte)
      .filter(v => v.length >= 2).length;
    const cartesAvecVisite = Object.keys(visitesParCarte).length;
    const tauxRetention = cartesAvecVisite > 0
      ? Math.round((cartesAvecMultiplesVisites / cartesAvecVisite) * 100)
      : 0;

    // --- Clients actifs / dormants / perdus ---
    let clientsActifs = 0;
    let clientsDormants = 0;
    let clientsPerdus = 0;

    for (const carte of cartes || []) {
      if (!carte.last_visit_at) continue;
      const lastVisit = new Date(carte.last_visit_at);

      if (lastVisit >= trenteJours) {
        clientsActifs++;
      } else if (lastVisit >= soixanteJoursAgo) {
        clientsDormants++;
      } else {
        clientsPerdus++;
      }
    }

    // --- Visites par jour (30 derniers jours) ---
    const visitesParJour = [];
    for (let i = 29; i >= 0; i--) {
      const jour = new Date(maintenant.getTime() - i * 24 * 60 * 60 * 1000);
      const debut = new Date(jour.getFullYear(), jour.getMonth(), jour.getDate());
      const fin = new Date(debut.getTime() + 24 * 60 * 60 * 1000);
      const dateLabel = debut.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

      const count = (visites30j || []).filter(v => {
        const vDate = new Date(v.created_at);
        return vDate >= debut && vDate < fin;
      }).length;

      visitesParJour.push({ date: dateLabel, count });
    }

    // --- Évolution des cartes (cumul sur 30j) ---
    const evolutionCartes = [];
    let cumul = totalCartes;

    // Compter les cartes créées chaque jour (pour soustraire du cumul inversé)
    const cartesParJour = {};
    for (const carte of cartes || []) {
      const created = new Date(carte.created_at);
      const key = created.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      if (!cartesParJour[key]) cartesParJour[key] = 0;
      cartesParJour[key]++;
    }

    // Le total avant 30j
    const cartesAvant30j = (cartes || []).filter(c => new Date(c.created_at) < trenteJours).length;

    for (let i = 29; i >= 0; i--) {
      const jour = new Date(maintenant.getTime() - i * 24 * 60 * 60 * 1000);
      const dateLabel = jour.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

      if (i === 29) {
        cumul = cartesAvant30j + (cartesParJour[dateLabel] || 0);
      } else {
        cumul += (cartesParJour[dateLabel] || 0);
      }

      evolutionCartes.push({ date: dateLabel, cumul });
    }

    // --- Répartition des tampons (points) ---
    const repartitionTampons = [];
    const paliers = [0, 1, 3, 5, 10, 20, 50];
    for (let p = 0; p < paliers.length; p++) {
      const min = paliers[p];
      const max = p < paliers.length - 1 ? paliers[p + 1] : Infinity;
      const count = (cartes || []).filter(c => {
        const pts = c.points || 0;
        return pts >= min && pts < max;
      }).length;

      const label = max === Infinity ? `${min}+` : `${min}-${max - 1}`;
      repartitionTampons.push({ palier: label, count });
    }

    // --- Clients récents (top 20) ---
    const clientsRecents = (cartes || [])
      .filter(c => c.last_visit_at && (c.client_nom || c.client_email || c.client_telephone))
      .sort((a, b) => new Date(b.last_visit_at) - new Date(a.last_visit_at))
      .slice(0, 20)
      .map(c => {
        const totalVisites = (visitesParCarte[c.id] || []).length;
        return {
          nom: c.client_nom || 'Anonyme',
          email: c.client_email || '',
          telephone: c.client_telephone || '',
          derniere_visite: c.last_visit_at,
          total_visites: totalVisites,
          tampons: c.points || 0
        };
      });

    // --- Meilleurs clients (top 5) ---
    const meilleursClients = (cartes || [])
      .filter(c => c.client_nom || c.client_email || c.client_telephone)
      .map(c => {
        const totalVisites = (visitesParCarte[c.id] || []).length;
        return {
          nom: c.client_nom || 'Anonyme',
          total_visites: totalVisites,
          tampons: c.points || 0
        };
      })
      .sort((a, b) => b.total_visites - a.total_visites)
      .slice(0, 5);

    // ─── Assemblage du dashboard ──────────────────────────────────────

    return {
      totalCartes,
      nouvellesVisites30j,
      visitesRepeatees30j,
      totalVisites30j,
      tauxRetention,
      clientsActifs,
      clientsDormants,
      clientsPerdus,
      visitesParJour,
      evolutionCartes,
      repartitionTampons,
      clientsRecents,
      meilleursClients,
      carteFormat: commercant.type_fidelite || 'tampons',
      relanceActive: !!commercant.relance_auto,
      anniversaireActif: !!commercant.anniversaire_auto
    };

  } catch (err) {
    console.error(`[CommercantAnalytics] Erreur getDashboard:`, err.message);
    throw err;
  }
}

module.exports = { getDashboard };
