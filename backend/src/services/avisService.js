const { supabase } = require('../config/supabase');
const { generateReviewResponse } = require('./anthropicService');

// Seuil de satisfaction : >= 4 → Google, < 4 → formulaire privé
const SEUIL_SATISFACTION = 4;

// ---------------------------------------------------------------------------
// Envoi d'une demande d'avis à un client via sa carte
// ---------------------------------------------------------------------------
/**
 * Envoie UNE SEULE notification push vers la page Google du commerce.
 * La notification n'est envoyée que si avis_notif_sent = false sur la carte.
 * Après envoi, avis_notif_sent est mis à true pour ne plus renvoyer.
 *
 * @param {string} carteId       UUID de la carte (table cartes)
 * @param {number} delaiMinutes  Délai avant envoi (0 = immédiat), uses commercant default if undefined
 */
async function sendReviewRequest(carteId, delaiMinutes) {
  // Récupérer la carte + le commerçant + les champs nécessaires
  const { data: carte, error: carteError } = await supabase
    .from('cartes')
    .select(`
      id,
      pass_serial_number,
      avis_notif_sent,
      commercant_id,
      commercants (
        nom_enseigne,
        google_place_url,
        module_avis_google,
        delai_notif_avis_minutes
      )
    `)
    .eq('id', carteId)
    .single();

  if (carteError || !carte) throw new Error('Carte introuvable.');
  if (!carte.commercants.module_avis_google) throw new Error('Module avis Google désactivé pour ce commerçant.');
  if (!carte.commercants.google_place_url) {
    console.log(`[AVIS] Aucune URL Google configurée pour le commerçant de la carte ${carteId} — notification ignorée.`);
    return { success: false, reason: 'no_google_url' };
  }

  const delai = delaiMinutes ?? carte.commercants.delai_notif_avis_minutes ?? 60;
  const nomEnseigne = carte.commercants.nom_enseigne;
  const googleUrl = carte.commercants.google_place_url;

  const doSend = async () => {
    // Re-vérifier que la notification n'a pas déjà été envoyée
    // (important pour les envois différés : entre la planification et l'envoi,
    //  une autre demande aurait pu être traitée)
    const { data: carteCheck } = await supabase
      .from('cartes')
      .select('avis_notif_sent')
      .eq('id', carteId)
      .single();

    if (carteCheck?.avis_notif_sent) {
      console.log(`[AVIS] Notification déjà envoyée pour la carte ${carteId} — ignoré.`);
      return { success: false, reason: 'already_sent' };
    }

    // Chercher le client lié à cette carte pour son device_token
    const { data: client } = await supabase
      .from('clients')
      .select('id, device_token, platform')
      .eq('carte_id', carteId)
      .maybeSingle();

    if (!client?.device_token) {
      console.log(`[AVIS] Pas de device_token pour la carte ${carteId} — notification non envoyée.`);
      return { success: false, reason: 'no_device_token' };
    }

    const titre = `Comment s'est passée votre visite ?`;
    const message = `Chez ${nomEnseigne} — Donnez votre avis sur Google ⭐`;

    // Enregistrer la notification en DB (avec le lien Google direct comme URL d'action)
    const { data: notif } = await supabase
      .from('notifications')
      .insert([{
        commercant_id: carte.commercant_id,
        titre,
        message: `${message}\n${googleUrl}`,
        type: 'push',
        cible: 'tous',
        total_envoyes: 1,
        envoyee: true
      }])
      .select()
      .single();

    // Marquer la notification comme envoyée pour cette carte
    // → ne sera plus jamais renvoyée
    await supabase
      .from('cartes')
      .update({ avis_notif_sent: true })
      .eq('id', carteId);

    console.log(`[AVIS] Demande d'avis envoyée → carte ${carteId} | url Google: ${googleUrl}`);
    return { success: true, googleUrl, notificationId: notif?.id };
  };

  if (delai > 0) {
    // Envoi différé (in-memory — pour prod: utiliser une file de tâches BullMQ/pg_cron)
    console.log(`[AVIS] Demande d'avis programmée dans ${delai} minute(s) pour carte ${carteId}`);
    setTimeout(doSend, delai * 60 * 1000);
    return { success: true, scheduled: true, delaiMinutes: delai };
  }

  return doSend();
}

// ---------------------------------------------------------------------------
// Traitement d'un avis soumis via le formulaire client (accès web direct)
// ---------------------------------------------------------------------------
/**
 * Enregistre un avis soumis par le client depuis le formulaire web.
 * Retourne l'URL de redirection (Google ou message de remerciement).
 *
 * @param {string} carteId    UUID de la carte (identifie anonymement le client)
 * @param {number} note       Note 1-5
 * @param {string} contenu    Texte de l'avis (optionnel)
 */
async function handleReviewSubmission(carteId, note, contenu = '') {
  // Récupérer la carte et son commerçant
  const { data: carte, error } = await supabase
    .from('cartes')
    .select(`
      id,
      commercant_id,
      commercants (
        nom_enseigne,
        google_place_url,
        google_place_id
      )
    `)
    .eq('id', carteId)
    .single();

  if (error || !carte) throw new Error('Carte introuvable.');

  const source = note >= SEUIL_SATISFACTION ? 'google' : 'formulaire_prive';

  // Trouver le client lié à cette carte (si existant)
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('carte_id', carteId)
    .maybeSingle();

  // Enregistrer l'avis en base
  const { data: avis, error: insertError } = await supabase
    .from('avis')
    .insert([{
      commercant_id: carte.commercant_id,
      client_id: client?.id || null,
      source,
      note: parseInt(note),
      contenu: contenu?.trim() || null
    }])
    .select()
    .single();

  if (insertError) throw new Error(`Erreur enregistrement avis : ${insertError.message}`);

  // Construire la réponse selon la note
  // Priorité : google_place_url (URL directe configurée), sinon google_place_id (legacy)
  let redirectUrl = null;
  if (note >= SEUIL_SATISFACTION) {
    if (carte.commercants.google_place_url) {
      redirectUrl = carte.commercants.google_place_url;
    } else if (carte.commercants.google_place_id) {
      redirectUrl = `https://search.google.com/local/writereview?placeid=${carte.commercants.google_place_id}`;
    }
  }

  return {
    avisId: avis.id,
    source,
    redirectUrl, // null = afficher message de remerciement (formulaire privé)
    nomEnseigne: carte.commercants.nom_enseigne
  };
}

// ---------------------------------------------------------------------------
// Templates de réponses pré-remplis (zéro coût, zéro IA)
// ---------------------------------------------------------------------------

/**
 * Remplace les variables dans un template avec les données de l'avis.
 * Variables supportées : {prenom_client}, {nom_commerce}, {note}, {contenu_avis}
 */
function fillTemplate(template, { nom_enseigne = '', note = 0, contenu = '', prenom_client = 'Client' }) {
  return template
    .replace(/\{prenom_client\}/g, prenom_client)
    .replace(/\{nom_commerce\}/g, nom_enseigne)
    .replace(/\{note\}/g, String(note))
    .replace(/\{contenu_avis\}/g, contenu || '(aucun commentaire)');
}

/**
 * Récupère les templates d'un commerçant et les remplit avec les données de l'avis.
 * Retourne un objet { templates: [{ id, nom, texte_rempli }], template_defaut_id }
 */
async function getTemplatesForAvis(avisId) {
  // Récupérer l'avis + les infos du commerçant
  const { data: avis, error } = await supabase
    .from('avis')
    .select(`
      id,
      contenu,
      note,
      commercants (
        nom_enseigne,
        avis_templates
      )
    `)
    .eq('id', avisId)
    .single();

  if (error || !avis) throw new Error('Avis introuvable.');

  const templates = avis.commercants?.avis_templates || [];
  const nom_enseigne = avis.commercants?.nom_enseigne || 'notre commerce';
  const note = avis.note || 0;
  const contenu = avis.contenu || '';

  // Remplir chaque template avec les variables
  const filledTemplates = Array.isArray(templates) ? templates.map(t => ({
    id: t.id,
    nom: t.nom,
    texte_original: t.texte,
    texte_rempli: fillTemplate(t.texte, { nom_enseigne, note, contenu })
  })) : [];

  return {
    templates: filledTemplates,
    nom_enseigne,
    note,
    contenu
  };
}

/**
 * Sauvegarde les templates d'un commerçant dans avis_templates (jsonb).
 * Remplace tous les templates existants.
 */
async function saveTemplates(commercantId, templates) {
  const { error } = await supabase
    .from('commercants')
    .update({ avis_templates: templates })
    .eq('id', commercantId);

  if (error) throw new Error(`Erreur sauvegarde templates: ${error.message}`);
  return true;
}

// ---------------------------------------------------------------------------
// Envoi d'une réponse validée sur Google My Business
// ---------------------------------------------------------------------------
async function sendGoogleResponse(avisId, reponseEnvoyee) {
  const { data: avis, error } = await supabase
    .from('avis')
    .select('id, google_review_id, reponse_validee')
    .eq('id', avisId)
    .single();

  if (error || !avis) throw new Error('Avis introuvable.');

  const GOOGLE_API_ENABLED =
    !!process.env.GOOGLE_CLIENT_ID &&
    !!process.env.GOOGLE_CLIENT_SECRET &&
    !!process.env.GOOGLE_REFRESH_TOKEN;

  if (!GOOGLE_API_ENABLED || !avis.google_review_id) {
    console.log(`[SIMULATION Google] Réponse pour avis ${avisId} : "${reponseEnvoyee}"`);

    await supabase
      .from('avis')
      .update({ reponse_envoyee: reponseEnvoyee, reponse_validee: true })
      .eq('id', avisId);

    return { success: true, simulation: true };
  }

  // --- Mode réel (Google Business Profile API) ---
  const tokenRes = await require('axios').post('https://oauth2.googleapis.com/token', {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    grant_type: 'refresh_token'
  });
  const accessToken = tokenRes.data.access_token;

  await require('axios').put(
    `https://mybusiness.googleapis.com/v4/${avis.google_review_id}/reply`,
    { comment: reponseEnvoyee },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  await supabase
    .from('avis')
    .update({ reponse_envoyee: reponseEnvoyee, reponse_validee: true })
    .eq('id', avisId);

  return { success: true, simulation: false };
}

module.exports = {
  sendReviewRequest,
  handleReviewSubmission,
  getTemplatesForAvis,
  saveTemplates,
  sendGoogleResponse,
  SEUIL_SATISFACTION
};
