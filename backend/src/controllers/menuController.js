const { supabase } = require('../config/supabase');

// ---------------------------------------------------------------------------
// POST /api/menus/create
// ---------------------------------------------------------------------------
const createMenu = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { titre, description, prix, categorie, disponible, image_url } = req.body;

    if (!titre?.trim()) {
      return res.status(400).json({ success: false, error: 'Le titre est requis.' });
    }

    const { data: menu, error } = await supabase
      .from('menus')
      .insert([{
        commercant_id: commercantId,
        titre: titre.trim(),
        description: description?.trim() || null,
        prix: prix !== undefined ? parseFloat(prix) : null,
        categorie: categorie?.trim() || null,
        disponible: disponible !== undefined ? !!disponible : true,
        image_url: image_url?.trim() || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Erreur création menu:', error);
      return res.status(500).json({ success: false, error: 'Erreur lors de la création du menu.' });
    }

    return res.status(201).json({ success: true, data: { menu } });

  } catch (error) {
    console.error('Erreur createMenu:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de la création du menu.' });
  }
};

// ---------------------------------------------------------------------------
// GET /api/menus/list
// ---------------------------------------------------------------------------
const listMenus = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { categorie, disponible } = req.query;

    let query = supabase
      .from('menus')
      .select('*')
      .eq('commercant_id', commercantId)
      .order('categorie', { ascending: true })
      .order('created_at', { ascending: false });

    if (categorie) query = query.eq('categorie', categorie);
    if (disponible === 'true') query = query.eq('disponible', true);
    if (disponible === 'false') query = query.eq('disponible', false);

    const { data: menus, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des menus.' });
    }

    // Regrouper par catégorie pour le dashboard
    const parCategorie = menus.reduce((acc, item) => {
      const cat = item.categorie || 'Sans catégorie';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      count: menus.length,
      data: { menus, parCategorie }
    });

  } catch (error) {
    console.error('Erreur listMenus:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des menus.' });
  }
};

// ---------------------------------------------------------------------------
// PUT /api/menus/:id
// ---------------------------------------------------------------------------
const updateMenu = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { id } = req.params;
    const { titre, description, prix, categorie, disponible, image_url } = req.body;

    // Vérifier appartenance
    const { data: existing } = await supabase
      .from('menus')
      .select('id')
      .eq('id', id)
      .eq('commercant_id', commercantId)
      .single();

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Menu introuvable ou non autorisé.' });
    }

    const updates = {};
    if (titre !== undefined) updates.titre = titre.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (prix !== undefined) updates.prix = prix !== null ? parseFloat(prix) : null;
    if (categorie !== undefined) updates.categorie = categorie?.trim() || null;
    if (disponible !== undefined) updates.disponible = !!disponible;
    if (image_url !== undefined) updates.image_url = image_url?.trim() || null;
    updates.updated_at = new Date().toISOString();

    const { data: menu, error } = await supabase
      .from('menus')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour.' });
    }

    return res.status(200).json({ success: true, data: { menu } });

  } catch (error) {
    console.error('Erreur updateMenu:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour.' });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/menus/:id
// ---------------------------------------------------------------------------
const deleteMenu = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { id } = req.params;

    const { data: existing } = await supabase
      .from('menus')
      .select('id')
      .eq('id', id)
      .eq('commercant_id', commercantId)
      .single();

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Menu introuvable ou non autorisé.' });
    }

    const { error } = await supabase.from('menus').delete().eq('id', id);

    if (error) {
      return res.status(500).json({ success: false, error: 'Erreur lors de la suppression.' });
    }

    return res.status(200).json({ success: true, message: 'Menu supprimé.' });

  } catch (error) {
    console.error('Erreur deleteMenu:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de la suppression.' });
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/menus/:id/toggle
// Activer/désactiver la disponibilité d'un menu
// ---------------------------------------------------------------------------
const toggleDisponibilite = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { id } = req.params;

    const { data: existing } = await supabase
      .from('menus')
      .select('id, disponible')
      .eq('id', id)
      .eq('commercant_id', commercantId)
      .single();

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Menu introuvable ou non autorisé.' });
    }

    const newDisponible = !existing.disponible;

    const { data: menu, error } = await supabase
      .from('menus')
      .update({ disponible: newDisponible, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: 'Erreur lors du changement de statut.' });
    }

    return res.status(200).json({
      success: true,
      disponible: newDisponible,
      message: newDisponible ? 'Menu marqué comme disponible.' : 'Menu marqué comme indisponible.',
      data: { menu }
    });

  } catch (error) {
    console.error('Erreur toggleDisponibilite:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors du changement de statut.' });
  }
};

module.exports = {
  createMenu,
  listMenus,
  updateMenu,
  deleteMenu,
  toggleDisponibilite
};
