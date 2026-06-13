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

// ---------------------------------------------------------------------------
// POST /api/menus/push-selection
// Pousser une sélection de plats en notification push
// Body: { menu_ids: string[], groupe_id?: string }
// ---------------------------------------------------------------------------
const pushSelection = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { menu_ids, groupe_id } = req.body;

    if (!Array.isArray(menu_ids) || menu_ids.length === 0) {
      return res.status(400).json({ success: false, error: 'menu_ids requis (tableau non vide).' });
    }

    // Récupérer les plats depuis Supabase pour avoir les titres/prix
    const { data: menus, error: fetchErr } = await supabase
      .from('menus')
      .select('id, titre, prix, description')
      .in('id', menu_ids)
      .eq('commercant_id', commercantId)
      .eq('disponible', true);

    if (fetchErr) {
      return res.status(500).json({ success: false, error: 'Erreur récupération des plats.' });
    }

    if (!menus || menus.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucun plat disponible trouvé dans la sélection.' });
    }

    const platsList = menus.map(m => `• ${m.titre}${m.prix ? ` — ${m.prix}€` : ''}`).join('\n');

    let titre;
    if (groupe_id) {
      titre = `🍽️ Menu du jour`;
    } else {
      titre = `🍽️ Aujourd'hui chez nous`;
    }
    const message = `${platsList}\n\nPassez nous voir !`;

    // Envoyer via le service de notifications existant
    const { sendPushNotification } = require('../services/notificationService');
    const result = await sendPushNotification(
      commercantId,
      titre,
      message,
      'tous'
    );

    // ── Insérer dans l'historique des notifications ──
    const { data: nomsGroupes } = await supabase
      .from('commercants')
      .select('menus_groupes')
      .eq('id', commercantId)
      .single();

    let nomGroupe = null;
    if (groupe_id && nomsGroupes?.menus_groupes) {
      const groupes = nomsGroupes.menus_groupes || [];
      const found = groupes.find(g => g.id === groupe_id);
      if (found) nomGroupe = found.nom;
    }

    const notifTitre = nomGroupe
      ? `🍽️ Menu "${nomGroupe}" pushé`
      : `🍽️ ${menus.length} plat(s) pushé(s)`;

    await supabase.from('notifications').insert([{
      commercant_id: commercantId,
      titre: notifTitre,
      message: `${platsList}\n\n${result.simulation ? '(mode simulation)' : `${result.totalEnvoyes} client(s) notifié(s)`}`,
      type: 'push',
      cible: 'tous',
      total_envoyes: result?.totalEnvoyes ?? 0,
      total_ouverts: 0,
      envoyee: true,
    }]);

    const msgSimulation = result?.simulation
      ? `🍽️ Notification simulée pour ${menus.length} plat(s)${nomGroupe ? ` (groupe "${nomGroupe}")` : ''}. Connectez FCM/APNS pour l'envoi réel.`
      : `🍽️ Notification envoyée pour ${menus.length} plat(s) à ${result.totalEnvoyes} client(s)${nomGroupe ? ` (groupe "${nomGroupe}")` : ''}.`;

    return res.status(200).json({
      success: true,
      simulation: result?.simulation ?? true,
      totalEnvoyes: result?.totalEnvoyes ?? 0,
      message: msgSimulation,
      data: { menus, totalEnvoyes: result?.totalEnvoyes ?? 0, message: msgSimulation }
    });

  } catch (error) {
    console.error('Erreur pushSelection:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/menus/groupes
// Lister les menus groupés du commerçant (stockés en JSONB)
// ---------------------------------------------------------------------------
const listGroupes = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;

    const { data: commercant, error } = await supabase
      .from('commercants')
      .select('menus_groupes')
      .eq('id', commercantId)
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: 'Erreur récupération groupes.' });
    }

    return res.status(200).json({
      success: true,
      data: { groupes: commercant?.menus_groupes || [] }
    });

  } catch (error) {
    console.error('Erreur listGroupes:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// PUT /api/menus/groupes
// Sauvegarder les menus groupés (remplace tout)
// Body: { groupes: MenuGroupe[] }
// ---------------------------------------------------------------------------
const saveGroupes = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { groupes } = req.body;

    if (!Array.isArray(groupes)) {
      return res.status(400).json({ success: false, error: 'groupes doit être un tableau.' });
    }

    for (const g of groupes) {
      if (!g.id || !g.nom || !Array.isArray(g.menu_ids)) {
        return res.status(400).json({ success: false, error: 'Chaque groupe doit avoir id, nom et menu_ids.' });
      }
    }

    const { error: updateErr } = await supabase
      .from('commercants')
      .update({ menus_groupes: groupes })
      .eq('id', commercantId);

    if (updateErr) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `${groupes.length} groupe(s) sauvegardé(s).`,
      data: { groupes }
    });

  } catch (error) {
    console.error('Erreur saveGroupes:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createMenu,
  listMenus,
  updateMenu,
  deleteMenu,
  toggleDisponibilite,
  pushSelection,
  listGroupes,
  saveGroupes
};
