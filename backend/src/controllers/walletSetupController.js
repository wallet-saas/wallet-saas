const { supabase } = require('../config/supabase');
const googleWalletService = require('../services/googleWalletService');

// Re-use column detection from commercantsController
let existingColumns = null;
async function detectColumns() {
  try {
    const { data, error } = await supabase.from('commercants').select('*').limit(1).single();
    if (!error && data) existingColumns = new Set(Object.keys(data));
  } catch {}
}
detectColumns();
setInterval(detectColumns, 60000);

function filterExisting(payload) {
  if (!existingColumns) return payload;
  const filtered = {};
  for (const [key, value] of Object.entries(payload)) {
    if (existingColumns.has(key)) filtered[key] = value;
  }
  return filtered;
}

const WALLET_TEMPLATES = {
  boulangerie: { label: 'Boulangerie', couleur: '#8B4513', programme: 'Carte Fidelite Boulangerie', recompense: '1 pain offert a 10 points', points: 10 },
  coiffeur:    { label: 'Coiffeur',    couleur: '#9B59B6', programme: 'Carte Fidelite Salon',        recompense: '1 coupe offerte a 5 points',   points: 5  },
  restaurant:  { label: 'Restaurant',  couleur: '#E74C3C', programme: 'Carte Fidelite Restaurant',   recompense: '1 dessert offert a 10 points', points: 10 },
  kine:        { label: 'Kine',        couleur: '#3498DB', programme: 'Carte Fidelite Cabinet',      recompense: '1 seance offerte a 10 points', points: 10 },
  garagiste:   { label: 'Garagiste',   couleur: '#2C3E50', programme: 'Carte Fidelite Garage',       recompense: '1 vidange offerte a 5 points', points: 5  },
};

const TEMPLATE_LOGOS = {
  boulangerie: 'https://placehold.co/200x200/D97706/ffffff?text=B',
  coiffeur: 'https://placehold.co/200x200/7C3AED/ffffff?text=C',
  restaurant: 'https://placehold.co/200x200/DC2626/ffffff?text=R',
  kine: 'https://placehold.co/200x200/059669/ffffff?text=K',
  garagiste: 'https://placehold.co/200x200/374151/ffffff?text=G',
};

/**
 * Determine l'URL du logo final selon les regles de priorite.
 * Utilise des URLs externes (placehold.co) pour eviter les boucles de redirection.
 */
function resolveLogo(template_type, logo_url_body, commercantId) {
  if (logo_url_body && logo_url_body.startsWith('http')) {
    return logo_url_body;
  }
  if (template_type && TEMPLATE_LOGOS[template_type]) {
    return TEMPLATE_LOGOS[template_type];
  }
  return 'https://placehold.co/200x200/6366f1/ffffff?text=S';
}

/**
 * Configurer la carte de fidelite Google Wallet (premiere fois)
 * POST /api/wallet/setup
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

    // Build update payload — only include columns that exist in the DB
    const rawPayload = {
      carte_couleur_primaire: couleur_primaire,
      carte_couleur_secondaire: couleur_secondaire || null,
      carte_logo_url: logo_url_final,
      points_recompense,
      carte_programme_nom: programme_nom,
      carte_recompense_description: recompense_description,
      template_type: template_type || null,
    };
    if (layout) rawPayload.carte_layout = layout;
    if (req.body.texte_perso_bas_carte) rawPayload.texte_perso_bas_carte = req.body.texte_perso_bas_carte;
    if (req.body.style_texte) rawPayload.style_texte = req.body.style_texte;
    // Premium card design fields
    if (req.body.card_design) rawPayload.card_design = req.body.card_design;
    if (req.body.carte_background_image_url) rawPayload.carte_background_image_url = req.body.carte_background_image_url;
    if (req.body.carte_logo_url) rawPayload.carte_logo_url = req.body.carte_logo_url;
    if (req.body.carte_font_family) rawPayload.carte_font_family = req.body.carte_font_family;
    if (req.body.carte_text_color) rawPayload.carte_text_color = req.body.carte_text_color;
    if (req.body.carte_text_color_auto !== undefined) rawPayload.carte_text_color_auto = req.body.carte_text_color_auto;
    if (req.body.carte_tier_name) rawPayload.carte_tier_name = req.body.carte_tier_name;
    if (req.body.carte_tier_color) rawPayload.carte_tier_color = req.body.carte_tier_color;
    if (req.body.carte_overlay_opacity !== undefined) rawPayload.carte_overlay_opacity = req.body.carte_overlay_opacity;
    if (req.body.carte_overlay_color) rawPayload.carte_overlay_color = req.body.carte_overlay_color;

    const updateData = filterExisting(rawPayload);

    const { data: updatedCommercant, error: updateError } = await supabase
      .from('commercants')
      .update(updateData)
      .eq('id', commercantId)
      .select('*')
      .single();

    if (updateError || !updatedCommercant) {
      console.error('[walletSetup] Erreur mise a jour Supabase:', updateError);
      return res.status(500).json({ success: false, error: 'Erreur lors de la mise a jour des informations.' });
    }

    // Creer / mettre a jour la LoyaltyClass Google Wallet
    await googleWalletService.upsertLoyaltyClass(updatedCommercant);

    // Marquer la classe comme configuree
    const { error: flagError } = await supabase
      .from('commercants')
      .update({ wallet_class_configured: true })
      .eq('id', commercantId);

    if (flagError) {
      console.error('[walletSetup] Erreur mise a jour wallet_class_configured:', flagError);
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
 * Mettre a jour la carte de fidelite Google Wallet existante
 * PUT /api/wallet/setup
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

    const rawPayload = {
      carte_couleur_primaire: couleur_primaire,
      carte_couleur_secondaire: couleur_secondaire || null,
      carte_logo_url: logo_url_final,
      points_recompense,
      carte_programme_nom: programme_nom,
      carte_recompense_description: recompense_description,
      template_type: template_type || null,
    };
    if (layout) rawPayload.carte_layout = layout;
    if (req.body.texte_perso_bas_carte) rawPayload.texte_perso_bas_carte = req.body.texte_perso_bas_carte;
    if (req.body.style_texte) rawPayload.style_texte = req.body.style_texte;
    // Premium card design fields
    if (req.body.card_design) rawPayload.card_design = req.body.card_design;
    if (req.body.carte_background_image_url) rawPayload.carte_background_image_url = req.body.carte_background_image_url;
    if (req.body.carte_logo_url) rawPayload.carte_logo_url = req.body.carte_logo_url;
    if (req.body.carte_font_family) rawPayload.carte_font_family = req.body.carte_font_family;
    if (req.body.carte_text_color) rawPayload.carte_text_color = req.body.carte_text_color;
    if (req.body.carte_text_color_auto !== undefined) rawPayload.carte_text_color_auto = req.body.carte_text_color_auto;
    if (req.body.carte_tier_name) rawPayload.carte_tier_name = req.body.carte_tier_name;
    if (req.body.carte_tier_color) rawPayload.carte_tier_color = req.body.carte_tier_color;
    if (req.body.carte_overlay_opacity !== undefined) rawPayload.carte_overlay_opacity = req.body.carte_overlay_opacity;
    if (req.body.carte_overlay_color) rawPayload.carte_overlay_color = req.body.carte_overlay_color;

    const updateData = filterExisting(rawPayload);

    const { data: updatedCommercant, error: updateError } = await supabase
      .from('commercants')
      .update(updateData)
      .eq('id', commercantId)
      .select('*')
      .single();

    if (updateError || !updatedCommercant) {
      console.error('[walletSetup] Erreur mise a jour Supabase (PUT):', updateError);
      return res.status(500).json({ success: false, error: 'Erreur lors de la mise a jour des informations.' });
    }

    // Mettre a jour la LoyaltyClass existante
    await googleWalletService.upsertLoyaltyClass(updatedCommercant);

    return res.status(200).json({
      success: true,
      data: { wallet_class_configured: true },
    });
  } catch (error) {
    console.error('[walletSetup] Erreur updateWalletCard:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erreur lors de la mise a jour de la carte.' });
  }
};

module.exports = {
  setupWalletCard,
  updateWalletCard,
};
