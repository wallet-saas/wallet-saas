const { supabase } = require('../config/supabase');
const googleWalletService = require('../services/googleWalletService');

const WALLET_TEMPLATES = {
  boulangerie: { label: 'Boulangerie', couleur: '#8B4513', programme: 'Carte Fidélité Boulangerie', recompense: '1 pain offert à 10 points', points: 10 },
  coiffeur:    { label: 'Coiffeur',    couleur: '#9B59B6', programme: 'Carte Fidélité Salon',        recompense: '1 coupe offerte à 5 points',   points: 5  },
  restaurant:  { label: 'Restaurant',  couleur: '#E74C3C', programme: 'Carte Fidélité Restaurant',   recompense: '1 dessert offert à 10 points', points: 10 },
  kine:        { label: 'Kiné',        couleur: '#3498DB', programme: 'Carte Fidélité Cabinet',      recompense: '1 séance offerte à 10 points', points: 10 },
  garagiste:   { label: 'Garagiste',   couleur: '#2C3E50', programme: 'Carte Fidélité Garage',       recompense: '1 vidange offerte à 5 points', points: 5  },
};

const TEMPLATE_LOGOS = {
  boulangerie: 'https://placehold.co/200x200/D97706/ffffff?text=B',
  coiffeur: 'https://placehold.co/200x200/7C3AED/ffffff?text=C',
  restaurant: 'https://placehold.co/200x200/DC2626/ffffff?text=R',
  kine: 'https://placehold.co/200x200/059669/ffffff?text=K',
  garagiste: 'https://placehold.co/200x200/374151/ffffff?text=G',
};

/**
 * Détermine l'URL du logo final selon les règles de priorité.
 * Utilise des URLs externes (placehold.co) pour éviter les boucles de redirection.
 */
function resolveLogo(template_type, logo_url_body, commercantId) {
  // Si un logo custom a été uploadé, utiliser l'URL directement
  if (logo_url_body && logo_url_body.startsWith('http')) {
    return logo_url_body;
  }
  // Utiliser le logo du template ou un placeholder générique
  if (template_type && TEMPLATE_LOGOS[template_type]) {
    return TEMPLATE_LOGOS[template_type];
  }
  return 'https://placehold.co/200x200/6366f1/ffffff?text=S';
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
      couleur_secondaire,
      logo_url,
      points_recompense,
      recompense_description,
      layout,
    } = req.body;

    const logo_url_final = resolveLogo(template_type, logo_url, commercantId);

    // Mettre à jour les infos carte dans Supabase
    // Champs de base (toujours présents)
    const updateData: any = {
      carte_couleur_primaire: couleur_primaire,
      carte_couleur_secondaire: couleur_secondaire || null,
      carte_logo_url: logo_url_final,
      points_recompense,
      carte_programme_nom: programme_nom,
      carte_recompense_description: recompense_description,
      template_type: template_type || null,
    };

    // Champs optionnels — peuvent ne pas exister si le SQL n'a pas été exécuté
    // On les essaie un par un pour ne pas bloquer si la colonne manque
    const optionalFields: Record<string, any> = {};
    if (layout) optionalFields.carte_layout = layout;
    if (req.body.texte_perso_bas_carte) optionalFields.texte_perso_bas_carte = req.body.texte_perso_bas_carte;
    if (req.body.style_texte) optionalFields.style_texte = req.body.style_texte;

    // Essayer d'abord avec tous les champs
    let updateResult = await supabase
      .from('commercants')
      .update({ ...updateData, ...optionalFields })
      .eq('id', commercantId)
      .select('id, nom_enseigne, carte_couleur_primaire, carte_logo_url, points_recompense, carte_programme_nom, carte_recompense_description, template_type')
      .single();

    // Si erreur (colonne inconnue ou autre), réessayer sans les champs optionnels
    if (updateResult.error) {
      const errCode = updateResult.error.code || '';
      const errMsg = updateResult.error.message || '';
      console.warn('[walletSetup] Erreur update (code=' + errCode + '):', errMsg);
      if (errCode === '42703' || errMsg.includes('column') || errMsg.includes('does not exist')) {
        console.warn('[walletSetup] Colonne optionnelle manquante, retry sans champs optionnels');
        updateResult = await supabase
          .from('commercants')
          .update(updateData)
          .eq('id', commercantId)
          .select('id, nom_enseigne, carte_couleur_primaire, carte_logo_url, points_recompense, carte_programme_nom, carte_recompense_description, template_type')
          .single();
      }
    }

    const { data: updatedCommercant, error: updateError } = updateResult;

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
      couleur_secondaire,
      logo_url,
      points_recompense,
      recompense_description,
      layout,
    } = req.body;

    const logo_url_final = resolveLogo(template_type, logo_url, commercantId);

    const updateData: any = {
      carte_couleur_primaire: couleur_primaire,
      carte_couleur_secondaire: couleur_secondaire || null,
      carte_logo_url: logo_url_final,
      points_recompense,
      carte_programme_nom: programme_nom,
      carte_recompense_description: recompense_description,
      template_type: template_type || null,
    };

    const optionalFields: Record<string, any> = {};
    if (layout) optionalFields.carte_layout = layout;
    if (req.body.texte_perso_bas_carte) optionalFields.texte_perso_bas_carte = req.body.texte_perso_bas_carte;
    if (req.body.style_texte) optionalFields.style_texte = req.body.style_texte;

    let updateResult = await supabase
      .from('commercants')
      .update({ ...updateData, ...optionalFields })
      .eq('id', commercantId)
      .select('id, nom_enseigne, carte_couleur_primaire, carte_logo_url, points_recompense, carte_programme_nom, carte_recompense_description, template_type')
      .single();

    if (updateResult.error) {
      const errCode = updateResult.error.code || '';
      const errMsg = updateResult.error.message || '';
      console.warn('[walletSetup] Erreur update PUT (code=' + errCode + '):', errMsg);
      if (errCode === '42703' || errMsg.includes('column') || errMsg.includes('does not exist')) {
        console.warn('[walletSetup] Colonne optionnelle manquante (PUT), retry sans champs optionnels');
        updateResult = await supabase
          .from('commercants')
          .update(updateData)
          .eq('id', commercantId)
          .select('id, nom_enseigne, carte_couleur_primaire, carte_logo_url, points_recompense, carte_programme_nom, carte_recompense_description, template_type')
          .single();
      }
    }

    const { data: updatedCommercant, error: updateError } = updateResult;

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
