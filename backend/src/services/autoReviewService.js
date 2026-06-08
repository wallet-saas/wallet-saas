const { supabase } = require('../config/supabase');

/**
 * Planifie une notification d'avis automatique après un scan
 * Appelé par le scan controller après chaque scan réussi
 * 
 * @param {string} carteId - UUID de la carte scannée
 * @param {string} commercantId - UUID du commerçant
 * @param {number} points - Points actuels du client
 */
const scheduleReviewNotification = async (carteId, commercantId, points) => {
  try {
    // Récupérer les paramètres du commerçant
    const { data: commercant } = await supabase
      .from('commercants')
      .select('module_avis_google, delai_notif_avis_minutes, google_place_url, google_place_id, nom_enseigne')
      .eq('id', commercantId)
      .single();

    if (!commercant?.module_avis_google) return null;
    if (!commercant?.google_place_url && !commercant?.google_place_id) return null;

    const delaiMinutes = commercant.delai_notif_avis_minutes || 60; // défaut 60 min

    // Vérifier si une notification a déjà été envoyée pour cette carte
    const { data: carte } = await supabase
      .from('cartes')
      .select('avis_notif_sent, avis_notif_scheduled_at')
      .eq('id', carteId)
      .single();

    if (carte?.avis_notif_sent) return null; // déjà envoyée

    // Programmer la notification
    const scheduledAt = new Date(Date.now() + delaiMinutes * 60 * 1000).toISOString();

    await supabase
      .from('cartes')
      .update({
        avis_notif_scheduled_at: scheduledAt,
        avis_notif_delai_minutes: delaiMinutes,
      })
      .eq('id', carteId);

    // Planifier l'envoi (in-memory pour V1 — en prod: BullMQ/pg_cron)
    setTimeout(async () => {
      await sendReviewNotification(carteId, commercantId, commercant);
    }, delaiMinutes * 60 * 1000);

    console.log(`[AUTO-AVIS] Notification programmée dans ${delaiMinutes}min pour carte ${carteId}`);
    return { scheduled: true, delaiMinutes, scheduledAt };
  } catch (err) {
    console.error('[AUTO-AVIS] Erreur programmation:', err.message);
    return null;
  }
};

/**
 * Envoie la notification d'avis au client
 */
const sendReviewNotification = async (carteId, commercantId, commercant) => {
  try {
    // Re-vérifier que la notification n'a pas déjà été envoyée
    const { data: carte } = await supabase
      .from('cartes')
      .select('avis_notif_sent')
      .eq('id', carteId)
      .single();

    if (carte?.avis_notif_sent) return;

    // Trouver le client lié à cette carte
    const { data: client } = await supabase
      .from('clients')
      .select('id, device_token, platform')
      .eq('carte_id', carteId)
      .maybeSingle();

    if (!client?.device_token) {
      console.log(`[AUTO-AVIS] Pas de device_token pour carte ${carteId}`);
      return;
    }

    // Construire le lien vers le formulaire d'avis
    const avisFormUrl = `${process.env.FRONTEND_URL || 'https://stamply-gamma.vercel.app'}/avis/${carteId}`;

    const titre = `Comment s'est passée votre visite ?`;
    const message = `Chez ${commercant.nom_enseigne} — Donnez votre avis ⭐`;

    // Enregistrer la notification
    await supabase
      .from('notifications')
      .insert([{
        commercant_id: commercantId,
        titre,
        message,
        type: 'push',
        cible: 'tous',
        total_envoyes: 1,
        envoyee: true,
        action_url: avisFormUrl,
      }]);

    // Marquer comme envoyée
    await supabase
      .from('cartes')
      .update({ avis_notif_sent: true })
      .eq('id', carteId);

    // TODO: Envoyer via FCM si configuré
    console.log(`[AUTO-AVIS] Notification envoyée → carte ${carteId} | form: ${avisFormUrl}`);
  } catch (err) {
    console.error('[AUTO-AVIS] Erreur envoi:', err.message);
  }
};

/**
 * Récupère les avis internes (feedback négatif) d'un commerçant
 */
const getInternalFeedback = async (commercantId, limit = 50, offset = 0) => {
  try {
    const { data, error, count } = await supabase
      .from('avis')
      .select(`
        id,
        note,
        contenu,
        source,
        created_at,
        cartes (
          id,
          pass_serial_number
        )
      `)
      .eq('commercant_id', commercantId)
      .eq('source', 'formulaire_prive')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    return {
      success: true,
      total: count,
      data: data || [],
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Génère le formulaire d'avis client (page HTML)
 * Affiche les étoiles et gère la redirection selon la note
 */
const getReviewFormHTML = async (carteId) => {
  const { data: carte, error } = await supabase
    .from('cartes')
    .select(`
      id,
      pass_serial_number,
      commercants (
        id,
        nom_enseigne,
        carte_couleur_primaire,
        google_place_url,
        google_place_id
      )
    `)
    .eq('id', carteId)
    .single();

  if (error || !carte) {
    return '<h1>Formulaire introuvable</h1>';
  }

  const { nom_enseigne, carte_couleur_primaire, google_place_url, google_place_id } = carte.commercants;
  const color = carte_couleur_primaire || '#5856D6';
  const googleReviewUrl = google_place_url || (google_place_id ? `https://search.google.com/local/writereview?placeid=${google_place_id}` : '');
  const feedbackUrl = `/api/avis/feedback/${carteId}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre avis — ${nom_enseigne}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, ${color} 0%, #764ba2 100%);
      min-height: 100dvh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1.5rem;
    }
    .card {
      background: white;
      border-radius: 24px;
      padding: 2rem;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { font-size: 1.4rem; color: #1c1c1e; margin-bottom: 0.5rem; }
    p  { color: #6c6c70; font-size: 0.95rem; margin-bottom: 1.5rem; }
    .stars { display: flex; justify-content: center; gap: 0.6rem; margin: 1.5rem 0; }
    .star {
      font-size: 2.8rem;
      cursor: pointer;
      transition: transform 0.15s;
      filter: grayscale(1);
      opacity: 0.4;
    }
    .star.active, .star:hover { filter: none; opacity: 1; transform: scale(1.15); }
    textarea {
      width: 100%;
      border: 1px solid #e0e0e6;
      border-radius: 12px;
      padding: 0.8rem;
      font-size: 0.95rem;
      font-family: inherit;
      resize: none;
      height: 100px;
      margin-bottom: 1.2rem;
      color: #1c1c1e;
    }
    textarea::placeholder { color: #c0c0c8; }
    button {
      width: 100%;
      background: ${color};
      color: white;
      border: none;
      padding: 1rem;
      border-radius: 14px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    button:active { opacity: 0.8; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    #merci { display: none; }
    #merci h2 { font-size: 1.6rem; margin: 1rem 0 0.5rem; color: #1c1c1e; }
    .google-btn {
      display: none;
      width: 100%;
      background: #4285F4;
      color: white;
      border: none;
      padding: 1rem;
      border-radius: 14px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 1rem;
      text-decoration: none;
    }
    .feedback-link {
      display: none;
      color: ${color};
      font-weight: 600;
      margin-top: 1rem;
      text-decoration: underline;
    }
  </style>
</head>
<body>
<div class="card">
  <div id="form-view">
    <h1>Comment s'est passée votre visite ?</h1>
    <p>Chez <strong>${nom_enseigne}</strong></p>
    <div class="stars">
      <span class="star" data-v="1">⭐</span>
      <span class="star" data-v="2">⭐</span>
      <span class="star" data-v="3">⭐</span>
      <span class="star" data-v="4">⭐</span>
      <span class="star" data-v="5">⭐</span>
    </div>
    <textarea id="contenu" placeholder="Un commentaire ? (optionnel)"></textarea>
    <button id="submit-btn" disabled>Envoyer mon avis</button>
  </div>
  <div id="merci">
    <div style="font-size:4rem" id="merci-icon">🙏</div>
    <h2 id="merci-title">Merci !</h2>
    <p id="merci-text">Votre avis a été enregistré.</p>
    <a id="google-link" class="google-btn" href="#" target="_blank">
      ⭐ Laisser un avis sur Google
    </a>
    <a id="feedback-link" class="feedback-link" href="#">
      💬 Nous aider à nous améliorer
    </a>
  </div>
</div>
<script>
  let selectedNote = 0;
  const carteId = '${carteId}';
  const googleUrl = '${googleReviewUrl}';
  const feedbackUrl = '${feedbackUrl}';
  const seuil = 4;

  document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => {
      selectedNote = parseInt(star.dataset.v);
      document.querySelectorAll('.star').forEach((s, i) => {
        s.classList.toggle('active', i < selectedNote);
      });
      document.getElementById('submit-btn').disabled = false;
    });
  });

  document.getElementById('submit-btn').addEventListener('click', async () => {
    if (!selectedNote) return;
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Envoi...';

    const res = await fetch('/api/avis/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        carte_id: carteId,
        note: selectedNote,
        contenu: document.getElementById('contenu').value
      })
    });
    const data = await res.json();

    document.getElementById('form-view').style.display = 'none';
    document.getElementById('merci').style.display = 'block';

    if (selectedNote >= seuil && googleUrl) {
      // 4+ étoiles → proposer Google
      document.getElementById('merci-icon').textContent = '🌟';
      document.getElementById('merci-title').textContent = 'Merci pour votre avis !';
      document.getElementById('merci-text').textContent = 'Partagez votre expérience sur Google pour aider d\\'autres clients !';
      const link = document.getElementById('google-link');
      link.href = googleUrl;
      link.style.display = 'block';
    } else if (selectedNote < seuil) {
      // < 4 étoiles → feedback interne
      document.getElementById('merci-icon').textContent = '💬';
      document.getElementById('merci-title').textContent = 'Merci pour votre retour';
      document.getElementById('merci-text').textContent = 'Aidez-nous à nous améliorer — dites-nous ce qui n\\'a pas fonctionné.';
      const link = document.getElementById('feedback-link');
      link.href = feedbackUrl;
      link.style.display = 'inline-block';
    } else {
      document.getElementById('merci-title').textContent = 'Merci !';
      document.getElementById('merci-text').textContent = 'Votre avis a été enregistré.';
    }
  });
</script>
</body>
</html>`;
};

/**
 * Génère le formulaire de feedback interne (pour avis < 4 étoiles)
 */
const getFeedbackFormHTML = async (carteId) => {
  const { data: carte } = await supabase
    .from('cartes')
    .select(`
      id,
      commercants (
        nom_enseigne,
        carte_couleur_primaire
      )
    `)
    .eq('id', carteId)
    .single();

  if (!carte) return '<h1>Formulaire introuvable</h1>';

  const { nom_enseigne, carte_couleur_primaire } = carte.commercants;
  const color = carte_couleur_primaire || '#5856D6';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre retour — ${nom_enseigne}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, ${color} 0%, #764ba2 100%);
      min-height: 100dvh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1.5rem;
    }
    .card {
      background: white;
      border-radius: 24px;
      padding: 2rem;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { font-size: 1.4rem; color: #1c1c1e; margin-bottom: 0.5rem; }
    p  { color: #6c6c70; font-size: 0.95rem; margin-bottom: 1.5rem; }
    textarea {
      width: 100%;
      border: 1px solid #e0e0e6;
      border-radius: 12px;
      padding: 0.8rem;
      font-size: 0.95rem;
      font-family: inherit;
      resize: none;
      height: 120px;
      margin-bottom: 1.2rem;
      color: #1c1c1e;
    }
    textarea::placeholder { color: #c0c0c8; }
    button {
      width: 100%;
      background: ${color};
      color: white;
      border: none;
      padding: 1rem;
      border-radius: 14px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    #merci { display: none; }
    #merci h2 { font-size: 1.6rem; margin: 1rem 0 0.5rem; color: #1c1c1e; }
  </style>
</head>
<body>
<div class="card">
  <div id="form-view">
    <div style="font-size:3rem;margin-bottom:0.5rem">💬</div>
    <h1>Ce qui n'a pas fonctionné ?</h1>
    <p>Chez <strong>${nom_enseigne}</strong> — Votre retour reste privé et nous aide à nous améliorer.</p>
    <textarea id="contenu" placeholder="Décrivez votre expérience (optionnel)"></textarea>
    <button id="submit-btn">Envoyer mon retour</button>
  </div>
  <div id="merci">
    <div style="font-size:4rem">🙏</div>
    <h2>Merci pour votre retour</h2>
    <p>Votre avis est précieux. Nous allons en tenir compte pour améliorer notre service.</p>
  </div>
</div>
<script>
  document.getElementById('submit-btn').addEventListener('click', async () => {
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Envoi...';

    await fetch('/api/avis/feedback/${carteId}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contenu: document.getElementById('contenu').value
      })
    });

    document.getElementById('form-view').style.display = 'none';
    document.getElementById('merci').style.display = 'block';
  });
</script>
</body>
</html>`;
};

module.exports = {
  scheduleReviewNotification,
  sendReviewNotification,
  getInternalFeedback,
  getReviewFormHTML,
  getFeedbackFormHTML,
};
