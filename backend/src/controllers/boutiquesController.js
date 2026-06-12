const { supabase } = require('../config/supabase');

/**
 * CRUD Boutiques pour un commerçant
 */

// GET /api/boutiques — Liste des boutiques du commerçant
const listBoutiques = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { data, error } = await supabase
      .from('boutiques')
      .select('*')
      .eq('commercant_id', commercantId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ success: true, count: data?.length || 0, data: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/boutiques/:id — Détail d'une boutique
const getBoutique = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('boutiques')
      .select('*')
      .eq('id', id)
      .eq('commercant_id', commercantId)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Boutique introuvable.' });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/boutiques — Créer une boutique
const createBoutique = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const {
      nom, adresse, ville, code_postal, telephone,
      google_place_url,
      carte_couleur_primaire, carte_couleur_secondaire,
      carte_programme_nom, carte_recompense_description,
      points_recompense, logo_url, template_type,
      module_avis_google, delai_notif_avis_minutes,
    } = req.body;

    if (!nom?.trim()) {
      return res.status(400).json({ success: false, error: 'Le nom de la boutique est requis.' });
    }

    // ── Logique Freemium ──
    // Gratuit : 1 boutique. Pro (Stripe) : illimitées.
    // TODO: quand Stripe sera branché, décommenter la vérification ci-dessous
    // pour limiter les boutiques gratuites à 1.
    /*
    const { data: existingBoutiques, error: countErr } = await supabase
      .from('boutiques')
      .select('id', { count: 'exact' })
      .eq('commercant_id', commercantId)
      .eq('actif', true);

    if (!countErr && existingBoutiques && existingBoutiques.length >= 1) {
      // Vérifier si le commerçant est en plan Pro
      const { data: commercant } = await supabase
        .from('commercants')
        .select('abonnement_statut')
        .eq('id', commercantId)
        .single();

      if (!commercant || commercant.abonnement_statut !== 'actif') {
        return res.status(403).json({
          success: false,
          error: 'Plan gratuit limité à 1 boutique. Passez en Pro pour créer des boutiques supplémentaires.',
          code: 'LIMIT_REACHED'
        });
      }
    }
    */
    // ── Fin logique Freemium (pour l'instant, tout le monde peut créer) ──

    const { data, error } = await supabase
      .from('boutiques')
      .insert([{
        commercant_id: commercantId,
        nom: nom.trim(),
        adresse: adresse?.trim() || null,
        ville: ville?.trim() || null,
        code_postal: code_postal?.trim() || null,
        telephone: telephone?.trim() || null,
        carte_couleur_primaire: carte_couleur_primaire || null,
        carte_couleur_secondaire: carte_couleur_secondaire || '#764ba2',
        carte_programme_nom: carte_programme_nom?.trim() || null,
        carte_recompense_description: carte_recompense_description?.trim() || null,
        points_recompense: points_recompense || 10,
        logo_url: logo_url?.trim() || null,
        template_type: template_type?.trim() || null,
        module_avis_google: typeof module_avis_google === 'boolean' ? module_avis_google : true,
        delai_notif_avis_minutes: delai_notif_avis_minutes || 60,
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/boutiques/:id — Modifier une boutique
const updateBoutique = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { id } = req.params;
    const updateFields = req.body;

    // Vérifier l'appartenance
    const { data: existing } = await supabase
      .from('boutiques')
      .select('id')
      .eq('id', id)
      .eq('commercant_id', commercantId)
      .single();

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Boutique introuvable.' });
    }

    const { data, error } = await supabase
      .from('boutiques')
      .update({ ...updateFields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('commercant_id', commercantId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/boutiques/:id — Désactiver une boutique (soft delete)
const deleteBoutique = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('boutiques')
      .update({ actif: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('commercant_id', commercantId)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Boutique introuvable.' });
    }

    res.json({ success: true, message: 'Boutique désactivée.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/boutiques/:id/stats — Stats par boutique
const getBoutiqueStats = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { id } = req.params;

    // Vérifier l'appartenance
    const { data: boutique } = await supabase
      .from('boutiques')
      .select('id')
      .eq('id', id)
      .eq('commercant_id', commercantId)
      .single();

    if (!boutique) {
      return res.status(404).json({ success: false, error: 'Boutique introuvable.' });
    }

    // Stats parallèles
    const [cartesResult, visitesResult, avisResult, offresResult] = await Promise.all([
      supabase.from('cartes').select('id', { count: 'exact' }).eq('boutique_id', id),
      supabase.from('visites').select('id', { count: 'exact' }).eq('boutique_id', id),
      supabase.from('avis').select('id', { count: 'exact' }).eq('boutique_id', id),
      supabase.from('offres').select('id', { count: 'exact' }).eq('boutique_id', id),
    ]);

    res.json({
      success: true,
      data: {
        totalCartes: cartesResult.count || 0,
        totalVisites: visitesResult.count || 0,
        totalAvis: avisResult.count || 0,
        totalOffres: offresResult.count || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/boutiques/global-stats — Stats globales du commerçant
const getGlobalStats = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;

    const [boutiquesResult, cartesResult, visitesResult, avisResult, notificationsResult] = await Promise.all([
      supabase.from('boutiques').select('id', { count: 'exact' }).eq('commercant_id', commercantId),
      supabase.from('cartes').select('id', { count: 'exact' }).eq('commercant_id', commercantId),
      supabase.from('visites').select('id', { count: 'exact' }).eq('commercant_id', commercantId),
      supabase.from('avis').select('id', { count: 'exact' }).eq('commercant_id', commercantId),
      supabase.from('notifications').select('id', { count: 'exact' }).eq('commercant_id', commercantId),
    ]);

    // Stats par boutique
    const { data: boutiques } = await supabase
      .from('boutiques')
      .select('id, nom, points_recompense')
      .eq('commercant_id', commercantId)
      .eq('actif', true);

    const boutiqueStats = [];
    for (const b of (boutiques || [])) {
      const [c, v] = await Promise.all([
        supabase.from('cartes').select('id', { count: 'exact' }).eq('boutique_id', b.id),
        supabase.from('visites').select('id', { count: 'exact' }).eq('boutique_id', b.id),
      ]);
      boutiqueStats.push({
        id: b.id,
        nom: b.nom,
        pointsRecompense: b.points_recompense,
        totalCartes: c.count || 0,
        totalVisites: v.count || 0,
      });
    }

    res.json({
      success: true,
      data: {
        totalBoutiques: boutiquesResult.count || 0,
        totalCartes: cartesResult.count || 0,
        totalVisites: visitesResult.count || 0,
        totalAvis: avisResult.count || 0,
        totalNotifications: notificationsResult.count || 0,
        boutiques: boutiqueStats,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  listBoutiques,
  getBoutique,
  createBoutique,
  updateBoutique,
  deleteBoutique,
  getBoutiqueStats,
  getGlobalStats,
};
