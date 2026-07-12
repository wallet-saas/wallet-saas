const { supabase } = require('../config/supabase');

// ─── Column existence cache ───────────────────────────────────────────────────
// On startup, detect which columns actually exist in the commercants table.
// This avoids "column does not exist" errors from Supabase's schema cache.
let existingColumns = null;

// Columns that should exist — will be auto-created if missing (on Render with DATABASE_URL)
const REQUIRED_COLUMNS = [
  { name: 'carte_layout', type: 'TEXT', default: "'classic'" },
  { name: 'card_design', type: 'TEXT', default: "NULL" },
  { name: 'carte_background_image_url', type: 'TEXT', default: "NULL" },
  { name: 'carte_font_family', type: 'TEXT', default: "'sans'" },
  { name: 'carte_text_color', type: 'TEXT', default: "'#FFFFFF'" },
  { name: 'carte_text_color_auto', type: 'BOOLEAN', default: "true" },
  { name: 'carte_tier_name', type: 'TEXT', default: "'Gold'" },
  { name: 'carte_tier_color', type: 'TEXT', default: "'#FFD700'" },
  { name: 'carte_overlay_opacity', type: 'INTEGER', default: "40" },
  { name: 'carte_overlay_color', type: 'TEXT', default: "'#000000'" },
];

async function ensureColumns() {
  const hasDbUrl = !!process.env.DATABASE_URL;
  console.log(`[commercantsController] ensureColumns: DATABASE_URL=${hasDbUrl ? 'set' : 'NOT SET'}`);
  if (!hasDbUrl) {
    console.warn('[commercantsController] Skipping ensureColumns — no DATABASE_URL');
    return;
  }
  try {
    const { Client } = require('pg');
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log('[commercantsController] Connected to PostgreSQL');
    for (const col of REQUIRED_COLUMNS) {
      try {
        await client.query(`ALTER TABLE commercants ADD COLUMN IF NOT EXISTS ${col.name} ${col.type} DEFAULT ${col.default};`);
        console.log(`[commercantsController] ✅ Ensured column: ${col.name}`);
      } catch (e) {
        console.warn(`[commercantsController] ❌ Could not add column ${col.name}: ${e.message}`);
      }
    }
    await client.end();
  } catch (e) {
    console.error('[commercantsController] ensureColumns FAILED:', e.message);
  }
}

async function detectExistingColumns() {
  try {
    const { data, error } = await supabase.from('commercants').select('*').limit(1).single();
    if (error || !data) {
      console.warn('[commercantsController] Could not detect columns:', error?.message);
      return null;
    }
    existingColumns = new Set(Object.keys(data));
    console.log(`[commercantsController] Detected ${existingColumns.size} columns in commercants table`);
    // Log missing expected columns
    const expected = [
      'module_notifications', 'notif_max_par_jour', 'notif_heure_debut', 'notif_heure_fin', 'notif_template_defaut', 'notif_mode_simulation',
      'avis_seuil_reponse', 'avis_template_auto', 'avis_reponse_auto',
      'menu_categories', 'menu_devise', 'menu_afficher_prix',
      'offres_duree_defaut', 'offres_limite_client', 'offres_notif_auto', 'offres_code_auto',
      'geoloc_message', 'geoloc_heure_debut', 'geoloc_heure_fin',
      'auto_review_message', 'auto_review_seuil_etoiles', 'auto_review_alerte_email',
      'module_boutiques', 'boutique_defaut_id',
      'texte_perso_bas_carte', 'style_texte', 'carte_layout',
      // Premium card design
      'card_design', 'carte_background_image_url', 'carte_font_family',
      'carte_text_color', 'carte_text_color_auto', 'carte_tier_name',
      'carte_tier_color', 'carte_overlay_opacity', 'carte_overlay_color',
    ];
    const missing = expected.filter(c => !existingColumns.has(c));
    if (missing.length > 0) {
      console.warn(`[commercantsController] Missing columns (${missing.length}): ${missing.join(', ')}`);
    }
    return existingColumns;
  } catch (e) {
    console.error('[commercantsController] Error detecting columns:', e.message);
    return null;
  }
}

// Run detection on module load
ensureColumns().then(() => {
  detectExistingColumns();
  // Re-detect every 60 seconds in case columns are added externally
  setInterval(detectExistingColumns, 60000);
});

function filterExisting(payload) {
  if (!existingColumns) return payload;
  const filtered = {};
  for (const [key, value] of Object.entries(payload)) {
    if (existingColumns.has(key)) {
      filtered[key] = value;
    } else {
      console.warn(`[commercantsController] Skipping missing column: ${key}`);
    }
  }
  return filtered;
}

function buildSelectList() {
  if (!existingColumns) {
    // Fallback: use a safe subset of known columns
    return 'id, email, nom_enseigne, telephone, adresse, ville, code_postal, template_metier, template_type, module_fidelite, module_avis_google, module_geolocalisation, module_menu_jour, module_offres_flash, abonnement_statut, wallet_class_configured, carte_programme_nom, carte_recompense_description, carte_couleur_primaire, carte_couleur_secondaire, carte_logo_url, points_recompense, points_par_visite, delai_notif_avis_minutes, rayon_geoloc_metres, latitude, longitude, google_place_url, qr_code_install_url, created_at';
  }
  // Build select list from existing columns
  const cols = Array.from(existingColumns).join(', ');
  return cols;
}

// ─── Controllers ──────────────────────────────────────────────────────────────

// GET - Récupérer tous les commerçants (sans les mots de passe)
exports.getAllCommercants = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('commercants')
      .select('id, email, nom_enseigne, telephone, adresse, ville, code_postal, template_metier, abonnement_statut, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, count: data.length, data: data });
  } catch (error) {
    console.error('Erreur getAllCommercants:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET - Récupérer un commerçant par ID
exports.getCommercantById = async (req, res) => {
  try {
    const { id } = req.params;
    const selectList = buildSelectList();
    const { data, error } = await supabase
      .from('commercants')
      .select(selectList)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Commerçant non trouvé' });
    }

    res.json({ success: true, data: data });
  } catch (error) {
    console.error('Erreur getCommercantById:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/commercants/me — Récupérer le commerçant connecté
exports.getMe = async (req, res) => {
  try {
    const { id } = req.commercant;
    const selectList = buildSelectList();
    const { data, error } = await supabase
      .from('commercants')
      .select(selectList)
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

// PUT /api/commercants/me — Alias pour update
exports.updateMe = async (req, res) => {
  return exports.updateCommercant(req, res);
};

// POST - Créer un nouveau commerçant
exports.createCommercant = async (req, res) => {
  res.status(400).json({ success: false, error: 'Utilisez POST /api/auth/register pour créer un compte commerçant' });
};

// PUT /api/commercants/update — Mise à jour des paramètres du commerçant connecté
exports.updateCommercant = async (req, res) => {
  try {
    const allowedFields = [
      'nom_enseigne', 'telephone', 'adresse', 'ville', 'code_postal',
      'carte_couleur_primaire', 'carte_couleur_secondaire', 'carte_logo_url',
      'couleur_primaire', 'couleur_secondaire', 'logo_url',
      'points_par_visite', 'points_recompense', 'points_requis_recompense',
      'module_avis_google', 'module_geolocalisation', 'module_menu_jour', 'module_offres_flash',
      'module_avis', 'module_geoloc', 'module_menus', 'module_offres',
      'delai_notif_avis_minutes', 'delai_avis_minutes',
      'rayon_geoloc_metres', 'latitude', 'longitude',
      'google_place_url',
      'module_notifications', 'notif_max_par_jour', 'notif_heure_debut', 'notif_heure_fin', 'notif_template_defaut', 'notif_mode_simulation',
      'avis_seuil_reponse', 'avis_template_auto', 'avis_reponse_auto',
      'menu_categories', 'menu_devise', 'menu_afficher_prix',
      'offres_duree_defaut', 'offres_limite_client', 'offres_notif_auto', 'offres_code_auto',
      'geoloc_message', 'geoloc_heure_debut', 'geoloc_heure_fin',
      'auto_review_message', 'auto_review_seuil_etoiles', 'auto_review_alerte_email',
      'module_boutiques', 'boutique_defaut_id',
      'carte_programme_nom', 'carte_recompense_description', 'carte_layout',
      'texte_perso_bas_carte', 'style_texte',
      // Premium card design
      'card_design', 'carte_background_image_url', 'carte_font_family',
      'carte_text_color', 'carte_text_color_auto', 'carte_tier_name',
      'carte_tier_color', 'carte_overlay_opacity', 'carte_overlay_color',
      // Relance & anniversaire (migration 007)
      'relance_auto', 'relance_jours', 'anniversaire_auto', 'anniversaire_message',
      'type_fidelite', 'type_fidelite_config',
    ];

    // Build payload with only allowed fields
    const payload = {};
    const body = req.body;
    allowedFields.forEach(f => {
      if (body[f] !== undefined) payload[f] = body[f];
    });

    // Map frontend aliases → backend column names
    if (payload.couleur_primaire !== undefined)   { payload.carte_couleur_primaire = payload.couleur_primaire; delete payload.couleur_primaire; }
    if (payload.couleur_secondaire !== undefined) { payload.carte_couleur_secondaire = payload.couleur_secondaire; delete payload.couleur_secondaire; }
    if (payload.logo_url !== undefined)           { payload.carte_logo_url = payload.logo_url; delete payload.logo_url; }
    if (payload.module_avis !== undefined)        { payload.module_avis_google = payload.module_avis; delete payload.module_avis; }
    if (payload.module_geoloc !== undefined)      { payload.module_geolocalisation = payload.module_geoloc; delete payload.module_geoloc; }
    if (payload.module_menus !== undefined)       { payload.module_menu_jour = payload.module_menus; delete payload.module_menus; }
    if (payload.module_offres !== undefined)      { payload.module_offres_flash = payload.module_offres; delete payload.module_offres; }
    if (payload.delai_avis_minutes !== undefined) { payload.delai_notif_avis_minutes = payload.delai_avis_minutes; delete payload.delai_avis_minutes; }
    if (payload.points_requis_recompense !== undefined) { payload.points_recompense = payload.points_requis_recompense; delete payload.points_requis_recompense; }

    // Convert time strings "HH:MM" to minutes integer for geoloc fields
    if (payload.geoloc_heure_debut && typeof payload.geoloc_heure_debut === 'string') {
      const parts = payload.geoloc_heure_debut.split(':');
      payload.geoloc_heure_debut = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    if (payload.geoloc_heure_fin && typeof payload.geoloc_heure_fin === 'string') {
      const parts = payload.geoloc_heure_fin.split(':');
      payload.geoloc_heure_fin = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    // Convert time strings "HH:MM" to minutes integer for notification fields
    if (payload.notif_heure_debut && typeof payload.notif_heure_debut === 'string') {
      const parts = payload.notif_heure_debut.split(':');
      payload.notif_heure_debut = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    if (payload.notif_heure_fin && typeof payload.notif_heure_fin === 'string') {
      const parts = payload.notif_heure_fin.split(':');
      payload.notif_heure_fin = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    // Filter out columns that don't exist in the database
    const filteredPayload = filterExisting(payload);

    if (Object.keys(filteredPayload).length === 0) {
      return res.json({ success: true, data: { commercant: null, message: 'No valid fields to update' } });
    }

    const selectList = buildSelectList();
    const { data, error } = await supabase
      .from('commercants')
      .update(filteredPayload)
      .eq('id', req.commercant.id)
      .select(selectList)
      .single();

    if (error) throw error;

    res.json({ success: true, data: { commercant: data } });
  } catch (error) {
    console.error('Erreur updateCommercant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/commercants/qr-code
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

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const installUrl = data.qr_code_install_url || `${frontendUrl}/install/${data.id}`;

    if (!data.qr_code_install_url) {
      await supabase
        .from('commercants')
        .update({ qr_code_install_url: installUrl })
        .eq('id', data.id);
    }

    res.json({
      success: true,
      data: { install_url: installUrl, nom_enseigne: data.nom_enseigne },
    });
  } catch (error) {
    console.error('Erreur getQrCode:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
