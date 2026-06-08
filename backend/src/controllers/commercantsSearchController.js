const { supabase } = require('../config/supabase');

/**
 * Recherche publique de commerçants
 * GET /api/commercants/search?q=...&ville=...&categorie=...
 */
const search = async (req, res) => {
  try {
    const { q, categorie, limit = 20 } = req.query;
    const maxLimit = Math.min(parseInt(limit) || 20, 50);

    let query = supabase
      .from('commercants')
      .select('id, nom_enseigne, template_type, carte_couleur_primaire, carte_programme_nom, points_recompense')
      .eq('wallet_class_configured', true)
      .order('nom_enseigne', { ascending: true })
      .limit(maxLimit);

    if (q && q.trim().length > 0) {
      query = query.ilike('nom_enseigne', `%${q.trim()}%`);
    }

    if (categorie && categorie.trim().length > 0) {
      query = query.eq('template_type', categorie.trim().toLowerCase());
    }

    const { data, error } = await query;

    if (error) {
      console.error('[commercantsSearch] Erreur:', error);
      return res.status(500).json({ success: false, error: 'Erreur lors de la recherche.' });
    }

    res.json({
      success: true,
      count: data?.length || 0,
      data: data || [],
    });
  } catch (err) {
    console.error('[commercantsSearch] Exception:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
};

/**
 * Liste des catégories de commerçants
 * GET /api/commercants/categories
 */
const categories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('commercants')
      .select('template_type')
      .eq('wallet_class_configured', true)
      .not('template_type', 'is', null);

    if (error) {
      return res.status(500).json({ success: false, error: 'Erreur.' });
    }

    const counts = {};
    (data || []).forEach((row) => {
      const cat = row.template_type || 'autre';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const CATEGORY_LABELS = {
      boulangerie: 'Boulangerie',
      coiffeur: 'Coiffeur',
      restaurant: 'Restaurant',
      kine: 'Kinésithérapeute',
      garagiste: 'Garagiste',
    };

    const categories = Object.entries(counts).map(([id, count]) => ({
      id,
      label: CATEGORY_LABELS[id] || id.charAt(0).toUpperCase() + id.slice(1),
      count,
    }));

    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
};

module.exports = { search, categories };
