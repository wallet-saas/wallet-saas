const { supabase } = require('../config/supabase');
const googleWalletService = require('../services/googleWalletService');

const WALLET_TEMPLATES = {
  boulangerie: { label: 'Boulangerie', couleur: '#8B4513', programme: 'Carte Fidélité Boulangerie', recompense: '1 pain offert à 10 points', points: 10 },
  coiffeur:    { label: 'Coiffeur',    couleur: '#9B59B6', programme: 'Carte Fidélité Salon',        recompense: '1 coupe offerte à 5 points',   points: 5  },
  restaurant:  { label: 'Restaurant',  couleur: '#E74C3C', programme: 'Carte Fidélité Restaurant',   recompense: '1 dessert offert à 10 points', points: 10 },
  kine:        { label: 'Kiné',        couleur: '#3498DB', programme: 'Carte Fidélité Cabinet',      recompense: '1 séance offerte à 10 points', points: 10 },
  garagiste:   { label: 'Garagiste',   couleur: '#2C3E50', programme: 'Carte Fidélité Garage',       recompense: '1 vidange offerte à 5 points', points: 5  },
};

/**
 * Détermine l'URL du logo final selon les règles de priorité.
 * Utilise le backend comme source de vérité pour les logos.
 */
function resolveLogo(template_type, logo_url_body, commercantId) {
  const base = process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
  // Si un logo custom a été uploadé, utiliser l'URL directement
  if (logo_url_body && logo_url_body.startsWith('http')) {
    return logo_url_body;
  }
  // Si on a un commercantId, utiliser l'endpoint images qui gère les fallbacks
  if (commercantId) {
    return `${base}/api/images/${commercantId}`;
  }
  // Fallback sur les templates statiques
  if (template_type && WALLET_TEMPLATES[template_type]) {
    return `${base}/logos/${template_type}.png`;
  }
  return `${base}/logo.png`;
}

/**
 * Configurer la carte de fidélité Google Wallet (première fois)
 * POST /api/wallet/setup
 * Protégé par authMiddleware
 */
const setupWalletCard = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const {
      template_type,
      programme_nom,
      couleur_primaire,
      logo_url,
      points_recompense,
      recompense_description,
    } = req.body;

    const logo_url_final = resolveLogo(template_type, logo_url, commercantId);

    // Mettre à jour les infos carte dans Supabase
    const { data: updatedCommercant, error: updateError } = await supabase
      .from('commercants')
      .update({
        carte_couleur_primaire: couleur_primaire,
        carte_logo_url: logo_url_final,
        points_recompense,
        carte_programme_nom: programme_nom,
        carte_recompense_description: recompense_description,
        template_type: template_type || null,
      })
      .eq('id', commercantId)
      .select('id, nom_enseigne, carte_couleur_primaire, carte_logo_url, points_recompense, carte_programme_nom, carte_recompense_description, template_type')
      .single();

    if (updateError || !updatedCommercant) {
      console.error('[walletSetup] Erreur mise à jour Supabase:', updateError);
      return res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour des informations.' });
    }

    // Créer / mettre à jour la LoyaltyClass Google Wallet
    await googleWalletService.upsertLoyaltyClass(updatedCommercant);

    // Marquer la classe comme configurée
    const { error: flagError } = await supabase
      .from('commercants')
      .update({ wallet_class_configured: true })
      .eq('id', commercantId);

    if (flagError) {
      console.error('[walletSetup] Erreur mise à jour wallet_class_configured:', flagError);
      // Non bloquant : la classe est créée, on continue
    }

    return res.status(200).json({
      success: true,
      data: { wallet_class_configured: true },
    });
  } catch (error) {
    console.error('[walletSetup] Erreur setupWalletCard:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erreur lors de la configuration de la carte.' });
  }
};

/**
 * Mettre à jour la carte de fidélité Google Wallet existante
 * PUT /api/wallet/setup
 * Protégé par authMiddleware
 */
const updateWalletCard = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const {
      template_type,
      programme_nom,
      couleur_primaire,
      logo_url,
      points_recompense,
      recompense_description,
    } = req.body;

    const logo_url_final = resolveLogo(template_type, logo_url, commercantId);

    // Mettre à jour les infos carte dans Supabase
    const { data: updatedCommercant, error: updateError } = await supabase
      .from('commercants')
      .update({
        carte_couleur_primaire: couleur_primaire,
        carte_logo_url: logo_url_final,
        points_recompense,
        carte_programme_nom: programme_nom,
        carte_recompense_description: recompense_description,
        template_type: template_type || null,
      })
      .eq('id', commercantId)
      .select('id, nom_enseigne, carte_couleur_primaire, carte_logo_url, points_recompense, carte_programme_nom, carte_recompense_description, template_type')
      .single();

    if (updateError || !updatedCommercant) {
      console.error('[walletSetup] Erreur mise à jour Supabase (PUT):', updateError);
      return res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour des informations.' });
    }

    // Mettre à jour la LoyaltyClass existante (upsert gère create vs update)
    await googleWalletService.upsertLoyaltyClass(updatedCommercant);

    return res.status(200).json({
      success: true,
      data: { wallet_class_configured: true },
    });
  } catch (error) {
    console.error('[walletSetup] Erreur updateWalletCard:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erreur lors de la mise à jour de la carte.' });
  }
};

module.exports = {
  setupWalletCard,
  updateWalletCard,
};
