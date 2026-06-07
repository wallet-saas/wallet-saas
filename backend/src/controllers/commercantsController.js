const { supabase } = require('../config/supabase');

// GET - Récupérer tous les commerçants (sans les mots de passe)
exports.getAllCommercants = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('commercants')
      .select('id, email, nom_enseigne, telephone, adresse, ville, code_postal, template_metier, abonnement_statut, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error('Erreur getAllCommercants:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET - Récupérer un commerçant par ID (sans le mot de passe)
exports.getCommercantById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('commercants')
      .select('id, email, nom_enseigne, telephone, adresse, ville, code_postal, template_metier, module_fidelite, module_avis_google, module_geolocalisation, module_menu_jour, module_offres_flash, abonnement_statut, created_at')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Commerçant non trouvé'
      });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Erreur getCommercantById:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET /api/commercants/me — Récupérer le commerçant connecté
exports.getMe = async (req, res) => {
  try {
    const { id } = req.commercant;
    const { data, error } = await supabase
      .from('commercants')
      .select('id, email, nom_enseigne, telephone, adresse, ville, code_postal, template_metier, template_type, module_fidelite, module_avis_google, module_geolocalisation, module_menu_jour, module_offres_flash, abonnement_statut, wallet_class_configured, carte_programme_nom, carte_recompense_description, carte_couleur_primaire, carte_couleur_secondaire, carte_logo_url, points_recompense, points_par_visite, delai_notif_avis_minutes, rayon_geoloc_metres, qr_code_install_url, created_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Commerçant introuvable.' });
    }

    res.json({ success: true, data: { commercant: data } });
  } catch (error) {
    console.error('Erreur getMe:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/commercants/me — Alias pour update (le frontend appelle PUT /me)
exports.updateMe = async (req, res) => {
  // Delegate to updateCommercant
  return exports.updateCommercant(req, res);
};

// POST - Créer un nouveau commerçant (utilise authController.register à la place)
exports.createCommercant = async (req, res) => {
  res.status(400).json({
    success: false,
    error: 'Utilisez POST /api/auth/register pour créer un compte commerçant'
  });
};

// PUT /api/commercants/update — Mise à jour des paramètres du commerçant connecté
exports.updateCommercant = async (req, res) => {
  try {
    const allowedFields = [
      'nom_enseigne', 'telephone', 'adresse', 'ville', 'code_postal',
      'carte_couleur_primaire', 'carte_couleur_secondaire', 'carte_logo_url',
      // accept both aliases
      'couleur_primaire', 'couleur_secondaire', 'logo_url',
      'points_par_visite', 'points_recompense', 'points_requis_recompense',
      'module_avis_google', 'module_geolocalisation', 'module_menu_jour', 'module_offres_flash',
      // accept frontend aliases
      'module_avis', 'module_geoloc', 'module_menus', 'module_offres',
      'delai_notif_avis_minutes', 'delai_avis_minutes',
      'rayon_geoloc_metres', 'latitude', 'longitude',
      'google_place_url',
    ];

    // Build payload with only allowed fields, mapping aliases to backend names
    const payload = {};
    const body = req.body;

    allowedFields.forEach(f => {
      if (body[f] !== undefined) payload[f] = body[f];
    });

    // Map frontend aliases → backend column names
    // IMPORTANT: use !== undefined (not truthy) so that false values are preserved
    if (payload.couleur_primaire !== undefined)   { payload.carte_couleur_primaire = payload.couleur_primaire; delete payload.couleur_primaire; }
    if (payload.couleur_secondaire !== undefined) { payload.carte_couleur_secondaire = payload.couleur_secondaire; delete payload.couleur_secondaire; }
    if (payload.logo_url !== undefined)           { payload.carte_logo_url = payload.logo_url; delete payload.logo_url; }
    if (payload.module_avis !== undefined)        { payload.module_avis_google = payload.module_avis; delete payload.module_avis; }
    if (payload.module_geoloc !== undefined)      { payload.module_geolocalisation = payload.module_geoloc; delete payload.module_geoloc; }
    if (payload.module_menus !== undefined)       { payload.module_menu_jour = payload.module_menus; delete payload.module_menus; }
    if (payload.module_offres !== undefined)      { payload.module_offres_flash = payload.module_offres; delete payload.module_offres; }
    if (payload.delai_avis_minutes !== undefined) { payload.delai_notif_avis_minutes = payload.delai_avis_minutes; delete payload.delai_avis_minutes; }
    if (payload.points_requis_recompense !== undefined) { payload.points_recompense = payload.points_requis_recompense; delete payload.points_requis_recompense; }

    const { data, error } = await supabase
      .from('commercants')
      .update(payload)
      .eq('id', req.commercant.id)
      .select('id, email, nom_enseigne, telephone, adresse, ville, code_postal, carte_couleur_primaire, carte_couleur_secondaire, carte_logo_url, points_par_visite, points_recompense, module_avis_google, module_geolocalisation, module_menu_jour, module_offres_flash, delai_notif_avis_minutes, rayon_geoloc_metres, latitude, longitude, google_place_url, abonnement_statut, created_at')
      .single();

    if (error) throw error;

    res.json({ success: true, data: { commercant: data } });
  } catch (error) {
    console.error('Erreur updateCommercant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/commercants/qr-code — URL d'installation QR unique du commerçant
exports.getQrCode = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('commercants')
      .select('id, qr_code_install_url, nom_enseigne')
      .eq('id', req.commercant.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Commerçant introuvable.' });
    }

    // Generate the URL on the fly if not yet stored (for existing accounts)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const installUrl = data.qr_code_install_url || `${frontendUrl}/install/${data.id}`;

    // Persist it if it was missing
    if (!data.qr_code_install_url) {
      await supabase
        .from('commercants')
        .update({ qr_code_install_url: installUrl })
        .eq('id', data.id);
    }

    res.json({
      success: true,
      data: {
        install_url: installUrl,
        nom_enseigne: data.nom_enseigne,
      }
    });
  } catch (error) {
    console.error('Erreur getQrCode:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
