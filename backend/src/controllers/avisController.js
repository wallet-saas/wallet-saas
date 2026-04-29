const { supabase } = require('../config/supabase');
const {
  sendReviewRequest,
  handleReviewSubmission,
  generateAIResponse,
  sendGoogleResponse,
  SEUIL_SATISFACTION
} = require('../services/avisService');

// ---------------------------------------------------------------------------
// POST /api/avis/request
// Déclencher une demande d'avis pour une carte donnée
// ---------------------------------------------------------------------------
const requestAvis = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { carte_id, delai_minutes } = req.body;

    if (!carte_id) {
      return res.status(400).json({ success: false, error: 'carte_id requis.' });
    }

    // Vérifier que la carte appartient bien à ce commerçant
    const { data: carte } = await supabase
      .from('cartes')
      .select('id')
      .eq('id', carte_id)
      .eq('commercant_id', commercantId)
      .single();

    if (!carte) {
      return res.status(404).json({ success: false, error: 'Carte introuvable ou non autorisée.' });
    }

    const result = await sendReviewRequest(carte_id, delai_minutes ?? undefined);

    return res.status(200).json({ success: true, data: result });

  } catch (error) {
    console.error('Erreur requestAvis:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/avis/list
// Liste des avis reçus par le commerçant
// ---------------------------------------------------------------------------
const listAvis = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { source, note_min, note_max, repondu, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('avis')
      .select('*', { count: 'exact' })
      .eq('commercant_id', commercantId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (source) query = query.eq('source', source);
    if (note_min) query = query.gte('note', parseInt(note_min));
    if (note_max) query = query.lte('note', parseInt(note_max));
    if (repondu === 'true') query = query.eq('reponse_validee', true);
    if (repondu === 'false') query = query.eq('reponse_validee', false);

    const { data: avis, error, count } = await query;

    if (error) {
      return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des avis.' });
    }

    // Stats rapides
    const notesMoyenne = avis.length > 0
      ? Math.round((avis.reduce((s, a) => s + (a.note || 0), 0) / avis.length) * 10) / 10
      : null;

    return res.status(200).json({
      success: true,
      total: count,
      count: avis.length,
      notesMoyenne,
      data: { avis }
    });

  } catch (error) {
    console.error('Erreur listAvis:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des avis.' });
  }
};

// ---------------------------------------------------------------------------
// POST /api/avis/suggest-response
// Générer une réponse IA pour un avis
// ---------------------------------------------------------------------------
const suggestResponse = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { avis_id } = req.body;

    if (!avis_id) {
      return res.status(400).json({ success: false, error: 'avis_id requis.' });
    }

    // Vérifier que l'avis appartient à ce commerçant
    const { data: avis } = await supabase
      .from('avis')
      .select('id')
      .eq('id', avis_id)
      .eq('commercant_id', commercantId)
      .single();

    if (!avis) {
      return res.status(404).json({ success: false, error: 'Avis introuvable ou non autorisé.' });
    }

    const result = await generateAIResponse(avis_id);

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Erreur suggestResponse:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/avis/send-response
// Valider et envoyer la réponse sur Google My Business
// ---------------------------------------------------------------------------
const sendResponse = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { avis_id, reponse } = req.body;

    if (!avis_id || !reponse?.trim()) {
      return res.status(400).json({ success: false, error: 'avis_id et reponse requis.' });
    }

    // Vérifier appartenance
    const { data: avis } = await supabase
      .from('avis')
      .select('id')
      .eq('id', avis_id)
      .eq('commercant_id', commercantId)
      .single();

    if (!avis) {
      return res.status(404).json({ success: false, error: 'Avis introuvable ou non autorisé.' });
    }

    const result = await sendGoogleResponse(avis_id, reponse.trim());

    return res.status(200).json({
      success: true,
      simulation: result.simulation,
      message: result.simulation
        ? 'Réponse enregistrée (mode simulation — configurez Google API pour envoyer sur Google).'
        : 'Réponse envoyée sur Google My Business.',
      data: result
    });

  } catch (error) {
    console.error('Erreur sendResponse:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/avis/form/:carteId  (PUBLIC)
// Formulaire d'avis client (page HTML)
// ---------------------------------------------------------------------------
const getAvisForm = async (req, res) => {
  try {
    const { carteId } = req.params;

    const { data: carte, error } = await supabase
      .from('cartes')
      .select(`
        id,
        commercants (
          nom_enseigne,
          carte_couleur_primaire,
          google_place_id
        )
      `)
      .eq('id', carteId)
      .single();

    if (error || !carte) {
      return res.status(404).send('<h1>Formulaire introuvable</h1>');
    }

    const { nom_enseigne, carte_couleur_primaire, google_place_id } = carte.commercants;
    const color = carte_couleur_primaire || '#5856D6';
    const submitUrl = `/api/avis/submit`;

    res.send(`<!DOCTYPE html>
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
      max-width: 400px;
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
    <div style="font-size:4rem">🙏</div>
    <h2 id="merci-title">Merci !</h2>
    <p id="merci-text">Votre avis a été enregistré.</p>
    <a id="google-link" href="#" style="display:none;margin-top:1rem;display:block;color:${color};font-weight:600">
      ⭐ Laisser un avis sur Google
    </a>
  </div>
</div>
<script>
  let selectedNote = 0;
  const carteId = '${carteId}';
  const googlePlaceId = '${google_place_id || ''}';
  const seuil = ${SEUIL_SATISFACTION};

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

    const res = await fetch('${submitUrl}', {
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

    if (selectedNote >= seuil && googlePlaceId) {
      document.getElementById('merci-title').textContent = 'Merci pour votre avis 🌟';
      document.getElementById('merci-text').textContent = 'Partagez votre expérience sur Google pour aider d\\'autres clients !';
      const link = document.getElementById('google-link');
      link.href = 'https://search.google.com/local/writereview?placeid=' + googlePlaceId;
      link.style.display = 'block';
    } else {
      document.getElementById('merci-title').textContent = 'Merci pour votre retour';
      document.getElementById('merci-text').textContent = 'Votre avis nous aide à nous améliorer. À bientôt !';
    }
  });
</script>
</body>
</html>`);

  } catch (error) {
    console.error('Erreur getAvisForm:', error);
    res.status(500).send('<h1>Erreur</h1>');
  }
};

// ---------------------------------------------------------------------------
// POST /api/avis/submit  (PUBLIC)
// Soumission du formulaire avis par le client
// ---------------------------------------------------------------------------
const submitAvis = async (req, res) => {
  try {
    const { carte_id, note, contenu } = req.body;

    if (!carte_id || !note) {
      return res.status(400).json({ success: false, error: 'carte_id et note requis.' });
    }
    if (note < 1 || note > 5) {
      return res.status(400).json({ success: false, error: 'Note invalide (1-5).' });
    }

    const result = await handleReviewSubmission(carte_id, parseInt(note), contenu);

    return res.status(201).json({ success: true, data: result });

  } catch (error) {
    console.error('Erreur submitAvis:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  requestAvis,
  listAvis,
  suggestResponse,
  sendResponse,
  getAvisForm,
  submitAvis
};
