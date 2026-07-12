/**
 * Stamply — Service de Relance Automatique
 * 
 * Gère les relances automatiques pour les clients dormants
 * et les notifications d'anniversaire pour les commerçants.
 */

const { supabase } = require('../config/supabase');
const walletNotificationService = require('./walletNotificationService');

// ─── Relance des clients dormants ──────────────────────────────────────────

async function relanceDormants(commercantId) {
  try {
    // 1️⃣ Vérifier que la relance automatique est activée
    const { data: commercant, error: errComm } = await supabase
      .from('commercants')
      .select('id, nom_enseigne, relance_auto, relance_jours, relance_message')
      .eq('id', commercantId)
      .single();

    if (errComm) throw new Error(`Erreur commerçant : ${errComm.message}`);
    if (!commercant) throw new Error('Commerçant introuvable');

    if (!commercant.relance_auto) {
      console.log(`[Relance] ⏭️  Relance automatique désactivée pour ${commercantId}`);
      return {
        envoye: 0,
        ignore: 0,
        erreurs: [],
        raison: 'Relance automatique désactivée'
      };
    }

    const relanceJours = commercant.relance_jours || 30;
    const message = commercant.relance_message || 'Revenez nous voir ! Profitez de vos tampons et offres spéciales.';

    // 2️⃣ Trouver les cartes dormantes
    const dateSeuil = new Date();
    dateSeuil.setDate(dateSeuil.getDate() - relanceJours);

    const { data: cartesDormantes, error: errCartes } = await supabase
      .from('cartes')
      .select('id, client_nom, pass_serial_number, google_wallet_url, apple_push_token, apple_device_id, last_visit_at')
      .eq('commercant_id', commercantId)
      .lt('last_visit_at', dateSeuil.toISOString())
      .not('last_visit_at', 'is', null);

    if (errCartes) throw new Error(`Erreur cartes dormantes : ${errCartes.message}`);

    if (!cartesDormantes || cartesDormantes.length === 0) {
      console.log(`[Relance] ✅ Aucune carte dormante pour ${commercantId}`);
      return { envoye: 0, ignore: 0, erreurs: [] };
    }

    // 3️⃣ Vérifier la limite : max 1 relance / 7j par carte
    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() - 7);

    const { data: notificationsRecentes, error: errNotif } = await supabase
      .from('notifications')
      .select('id, total_envoyes')
      .eq('commercant_id', commercantId)
      .eq('type', 'relance')
      .gte('created_at', dateLimite.toISOString());

    if (errNotif) {
      console.error(`[Relance] Erreur vérification notifications récentes:`, errNotif.message);
    }

    // Compter combien de cartes ont déjà été relancées cette semaine
    const cartesRelanceesRecentes = notificationsRecentes
      ? notificationsRecentes.reduce((acc, n) => acc + (n.total_envoyes || 0), 0)
      : 0;

    // Filtrer les cartes éligibles (celles qui n'ont pas été relancées depuis 7j)
    // On compare par carte_id stocké dans le message des notifications récentes
    let envoye = 0;
    let ignore = 0;
    const erreurs = [];

    for (const carte of cartesDormantes) {
      try {
        // Vérifier si cette carte a déjà reçu une relance dans les 7 jours
        const { data: notifCarte, error: errCheck } = await supabase
          .from('notifications')
          .select('id')
          .eq('commercant_id', commercantId)
          .eq('type', 'relance')
          .gte('created_at', dateLimite.toISOString())
          .filter('message', 'like', `%${carte.id}%`);

        if (errCheck) {
          console.error(`[Relance] Erreur vérification carte ${carte.id}:`, errCheck.message);
        }

        if (notifCarte && notifCarte.length > 0) {
          // Déjà relancée cette semaine → ignorer
          ignore++;
          continue;
        }

        // Envoyer la notification via walletNotificationService
        const titre = `${commercant.nom_enseigne} vous attend !`;
        const messageComplet = `${message} — Carte: ${carte.client_nom || 'Client'}`;

        await walletNotificationService.sendToWalletCards(
          commercantId,
          titre,
          messageComplet,
          null // logoUrl optionnel
        );

        // Enregistrer la relance
        const { error: errInsert } = await supabase
          .from('notifications')
          .insert([{
            commercant_id: commercantId,
            titre: titre,
            message: `${message} [carte:${carte.id}]`,
            type: 'relance',
            cible: 'dormants',
            total_envoyes: 1,
            envoyee: true
          }]);

        if (errInsert) {
          console.error(`[Relance] Erreur insertion notification:`, errInsert.message);
          erreurs.push(`Erreur enregistrement pour carte ${carte.id}: ${errInsert.message}`);
        }

        envoye++;

      } catch (err) {
        console.error(`[Relance] Erreur carte ${carte.id}:`, err.message);
        erreurs.push(`Carte ${carte.id}: ${err.message}`);
        ignore++;
      }
    }

    console.log(`[Relance] ✅ ${commercant.nom_enseigne} — ${envoye} envoyé, ${ignore} ignoré, ${erreurs.length} erreurs`);
    return { envoye, ignore, erreurs };

  } catch (err) {
    console.error(`[Relance] Erreur relanceDormants:`, err.message);
    throw err;
  }
}

// ─── Notification d'anniversaire ──────────────────────────────────────────

async function anniversaire(commercantId) {
  try {
    // 1️⃣ Vérifier que l'anniversaire automatique est activé
    const { data: commercant, error: errComm } = await supabase
      .from('commercants')
      .select('id, nom_enseigne, anniversaire_auto, anniversaire_message')
      .eq('id', commercantId)
      .single();

    if (errComm) throw new Error(`Erreur commerçant : ${errComm.message}`);
    if (!commercant) throw new Error('Commerçant introuvable');

    if (!commercant.anniversaire_auto) {
      console.log(`[Anniversaire] ⏭️  Anniversaire automatique désactivé pour ${commercantId}`);
      return {
        envoye: 0,
        ignore: 0,
        erreurs: [],
        raison: 'Anniversaire automatique désactivé'
      };
    }

    const templateMessage = commercant.anniversaire_message ||
      "Joyeux anniversaire de la part de {{nom_enseigne}} ! Venez profiter d'une offre spéciale pour votre journée 🎉";

    // 2️⃣ Trouver les clients dont l'anniversaire est aujourd'hui
    const aujourdHui = new Date();
    const mois = String(aujourdHui.getMonth() + 1).padStart(2, '0');
    const jour = String(aujourdHui.getDate()).padStart(2, '0');

    // Chercher dans la table `clients` les date_naissance correspondant à MM-DD
    // et liés à ce commerçant via la table `cartes`
    const { data: cartesDuCommercant, error: errCartes } = await supabase
      .from('cartes')
      .select('id')
      .eq('commercant_id', commercantId);

    if (errCartes) throw new Error(`Erreur cartes : ${errCartes.message}`);

    const carteIds = (cartesDuCommercant || []).map(c => c.id);

    if (carteIds.length === 0) {
      console.log(`[Anniversaire] Aucune carte pour ${commercantId}`);
      return { envoye: 0, ignore: 0, erreurs: [] };
    }

    // Récupérer les clients dont l'anniversaire est aujourd'hui
    // On utilise une comparaison sur EXTRACT(MONTH) et EXTRACT(DAY) via Supabase
    // Supabase ne supporte pas directement EXTRACT sur les filtres, on utilise
    // un range large puis on filtre côté JS
    const { data: tousClients, error: errClients } = await supabase
      .from('clients')
      .select('id, carte_id, nom, email, telephone, date_naissance')
      .in('carte_id', carteIds)
      .not('date_naissance', 'is', null);

    if (errClients) throw new Error(`Erreur clients : ${errClients.message}`);

    // Filtrer ceux dont le MM-DD correspond à aujourd'hui
    const clientsAnniversaire = (tousClients || []).filter(client => {
      if (!client.date_naissance) return false;
      const d = new Date(client.date_naissance);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const j = String(d.getDate()).padStart(2, '0');
      return m === mois && j === jour;
    });

    if (clientsAnniversaire.length === 0) {
      console.log(`[Anniversaire] Aucun anniversaire aujourd'hui pour ${commercantId}`);
      return { envoye: 0, ignore: 0, erreurs: [] };
    }

    // 3️⃣ Envoyer les notifications
    let envoye = 0;
    let ignore = 0;
    const erreurs = [];

    for (const client of clientsAnniversaire) {
      try {
        // Personnaliser le message
        const messagePerso = templateMessage
          .replace('{{nom}}', client.nom || 'Client')
          .replace('{{nom_enseigne}}', commercant.nom_enseigne);

        const titre = `🎂 Joyeux anniversaire ${client.nom || ''}!`.trim();

        // Envoyer via walletNotificationService à toutes les cartes Wallet du commerçant
        // (le message est générique pour le commerce, pas par carte)
        await walletNotificationService.sendToWalletCards(
          commercantId,
          titre,
          messagePerso,
          null
        );

        // Enregistrer dans notifications
        const { error: errInsert } = await supabase
          .from('notifications')
          .insert([{
            commercant_id: commercantId,
            titre: titre,
            message: `${messagePerso} [client:${client.id}]`,
            type: 'anniversaire',
            cible: 'segment',
            total_envoyes: 1,
            envoyee: true
          }]);

        if (errInsert) {
          console.error(`[Anniversaire] Erreur insertion notification:`, errInsert.message);
          erreurs.push(`Erreur enregistrement pour client ${client.id}: ${errInsert.message}`);
        }

        envoye++;

      } catch (err) {
        console.error(`[Anniversaire] Erreur client ${client.id}:`, err.message);
        erreurs.push(`Client ${client.id}: ${err.message}`);
        ignore++;
      }
    }

    console.log(`[Anniversaire] ✅ ${commercant.nom_enseigne} — ${envoye} envoyé, ${ignore} ignoré, ${erreurs.length} erreurs`);
    return { envoye, ignore, erreurs };

  } catch (err) {
    console.error(`[Anniversaire] Erreur anniversaire:`, err.message);
    throw err;
  }
}

module.exports = { relanceDormants, anniversaire };
