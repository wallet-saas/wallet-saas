const express = require('express');
const router = express.Router();
const commercantsController = require('../controllers/commercantsController');
const searchController = require('../controllers/commercantsSearchController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireCommercant } = authMiddleware;
const { supabase } = require('../config/supabase');

// Public — recherche et listing (AVANT /:id pour éviter le wildcard)
router.get('/search', searchController.search);
router.get('/categories', searchController.categories);
router.get('/', commercantsController.getAllCommercants);
router.post('/', commercantsController.createCommercant);

// Protected — must be before /:id to avoid wildcard match
router.put('/update', authMiddleware, requireCommercant, commercantsController.updateCommercant);
router.put('/me', authMiddleware, requireCommercant, commercantsController.updateMe);
router.get('/me', authMiddleware, commercantsController.getMe);
router.get('/qr-code', authMiddleware, commercantsController.getQrCode);

// POST /api/commercants/change-carte-type
// Change le type de programme de fidélité. Comme les compteurs ne sont pas
// convertibles d'un type à l'autre (10 tampons ≠ 10 points ≠ 10 €), toutes les
// cartes du commerçant sont remises à zéro. Action volontaire et confirmée côté UI.
router.post('/change-carte-type', authMiddleware, requireCommercant, async (req, res) => {
  try {
    const commercantId = req.commercant.id;
    const { carte_type, carte_type_config } = req.body;

    const TYPES_VALIDES = ['points', 'tampons', 'cashback', 'remise', 'carte_cadeau', 'membre', 'coupon'];
    if (!TYPES_VALIDES.includes(carte_type)) {
      return res.status(400).json({ success: false, error: 'Type de carte invalide.' });
    }

    const { data: actuel } = await supabase
      .from('commercants')
      .select('carte_type')
      .eq('id', commercantId)
      .single();

    const changementDeType = (actuel?.carte_type || 'tampons') !== carte_type;

    const { error: majError } = await supabase
      .from('commercants')
      .update({
        carte_type,
        carte_type_config: carte_type_config || {},
      })
      .eq('id', commercantId);
    if (majError) throw majError;

    let cartesReinitialisees = 0;
    if (changementDeType) {
      const { data: cartesMaj, error: resetError } = await supabase
        .from('cartes')
        .update({
          points: 0,
          solde: 0,
          total_depense: 0,
          statut_palier: null,
          coupon_utilise: false,
          updated_at: new Date().toISOString(),
        })
        .eq('commercant_id', commercantId)
        .select('id');
      if (resetError) throw resetError;
      cartesReinitialisees = cartesMaj?.length || 0;
      console.log(`[CarteType] ${commercantId} : ${actuel?.carte_type} -> ${carte_type}, ${cartesReinitialisees} cartes remises a zero`);
    }

    // Répercuter immédiatement le nouveau programme sur les cartes installées
    try {
      const walletSyncService = require('../services/walletSyncService');
      await walletSyncService.syncCommercantCards(commercantId, { force: true });
    } catch (err) {
      console.error('[CarteType] Sync cartes échouée:', err.message);
    }

    return res.status(200).json({
      success: true,
      data: { carte_type, changement: changementDeType, cartes_reinitialisees: cartesReinitialisees },
    });
  } catch (err) {
    console.error('Erreur change-carte-type:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/commercants/save-client-info
// Sauvegarde les infos client saisies sur la page d'installation
router.post('/save-client-info', async (req, res) => {
  try {
    const { commercantId, serial_number, nom, email, telephone, date_naissance, consentement_email, consentement_sms } = req.body;
    if (!commercantId || !serial_number) {
      return res.status(400).json({ success: false, error: 'Paramètres manquants.' });
    }
    // Mettre à jour la carte avec les infos client (affichage pass + relance)
    const { data: carteMaj, error } = await supabase
      .from('cartes')
      .update({
        client_nom: nom || '',
        client_email: email || '',
        client_telephone: telephone || '',
        client_date_naissance: date_naissance || null,
      })
      .eq('pass_serial_number', serial_number)
      .select('id, commercant_id')
      .single();
    if (error) throw error;

    // Créer/mettre à jour le client dans la table clients — c'est elle qui
    // alimente les visites, les anniversaires, le ciblage et les stats.
    if (carteMaj?.id) {
      const clientRow = {
        commercant_id: carteMaj.commercant_id || commercantId,
        carte_id: carteMaj.id,
        nom: nom || '',
        email: email || '',
        telephone: telephone || '',
        date_naissance: date_naissance || null,
        consentement_email: consentement_email === true,
        consentement_sms: consentement_sms === true,
        consentement_rgpd: true,
        consentement_date: new Date().toISOString(),
      };
      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .eq('carte_id', carteMaj.id)
        .maybeSingle();
      const { error: clientError } = existing?.id
        ? await supabase.from('clients').update(clientRow).eq('id', existing.id)
        : await supabase.from('clients').insert([clientRow]);
      if (clientError) {
        // Non bloquant pour l'installation, mais loggé : sans ligne clients,
        // anniversaires et stats ne fonctionneront pas pour ce client.
        console.error('Erreur upsert clients:', clientError.message);
      }
    }

    return res.status(200).json({ success: true, data: { message: 'Informations enregistrées.' } });
  } catch (err) {
    console.error('Erreur save-client-info:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Public by ID
router.get('/:id', commercantsController.getCommercantById);

module.exports = router;