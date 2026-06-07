const axios = require('axios');

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001'; // Rapide + économique pour la génération de réponses

/**
 * Génère une réponse professionnelle à un avis Google via l'API Anthropic.
 *
 * @param {string} avisContenu   Texte de l'avis client
 * @param {number} note          Note donnée (1-5)
 * @param {string} nomEnseigne   Nom du commerce (pour personnaliser la réponse)
 * @returns {Promise<string>}    Texte de la réponse suggérée
 */
async function generateReviewResponse(avisContenu, note, nomEnseigne) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[ANTHROPIC] ANTHROPIC_API_KEY manquant — réponse de démonstration retournée.');
    return getDemoResponse(note, nomEnseigne);
  }

  const tonalite = note >= 4
    ? 'chaleureux, reconnaissant et enthousiaste'
    : note === 3
      ? 'compréhensif, professionnel et constructif'
      : 'empathique, sincèrement désolé et orienté solution';

  const prompt = `Tu es le responsable de "${nomEnseigne}", un commerce local français.
Un client a laissé cet avis Google (note: ${note}/5) :

"${avisContenu || '(pas de commentaire écrit)'}"

Rédige une réponse ${tonalite} en français (2-3 phrases maximum).
- Remercie le client pour son avis
- Adresse le point principal de l'avis
- Invite-le à revenir (si note >= 3)
- Sois naturel, humain, pas trop formel
- Commence directement la réponse, sans formule générique d'introduction`;

  const response = await axios.post(
    ANTHROPIC_API_URL,
    {
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    },
    {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      timeout: 15000
    }
  );

  return response.data.content[0].text.trim();
}

/**
 * Réponse de démonstration quand l'API key n'est pas configurée.
 */
function getDemoResponse(note, nomEnseigne) {
  if (note >= 4) {
    return `Merci beaucoup pour ce retour positif ! Toute l'équipe de ${nomEnseigne} est ravie de vous avoir accueilli. Nous vous attendons très bientôt ! 😊`;
  }
  if (note === 3) {
    return `Merci pour votre retour. Chez ${nomEnseigne}, nous prenons tous les avis très au sérieux et travaillons à améliorer continuellement notre service. N'hésitez pas à revenir nous voir !`;
  }
  return `Nous sommes vraiment désolés pour cette expérience chez ${nomEnseigne}. Nous vous invitons à nous contacter directement pour que nous puissions arranger les choses. Votre satisfaction est notre priorité.`;
}

module.exports = { generateReviewResponse };
