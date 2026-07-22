const express = require('express');
const router = express.Router();
const commercantsController = require('../controllers/commercantsController');
const searchController = require('../controllers/commercantsSearchController');
const authMiddleware = require('../middleware/authMiddleware');
const { supabase } = require('../config/supabase');

// Public — recherche et listing (AVANT /:id pour éviter le wildcard)
router.get('/search', searchController.search);
router.get('/categories', searchController.categories);
router.get('/', commercantsController.getAllCommercants);
router.post('/', commercantsController.createCommercant);

// Protected — must be before /:id to avoid wildcard match
router.put('/update', authMiddleware, commercantsController.updateCommercant);
router.put('/me', authMiddleware, commercantsController.updateMe);
router.get('/me', authMiddleware, commercantsController.getMe);
router.get('/qr-code', authMiddleware, commercantsController.getQrCode);

// POST /api/commercants/save-client-info
// Sauvegarde les infos client saisies sur la page d'installation
router.post('/save-client-info', async (req, res) => {
  try {
    const { commercantId, serial_number, nom, email, telephone, date_naissance, consentement_email, consentement_sms } = req.body;
    if (!commercantId || !serial_number) {
      return res.status(400).json({ success: false, error: 'Paramètres manquants.' });
    }
    // Mettre à jour la carte avec les infos client
    const { error } = await supabase
      .from('cartes')
      .update({
        client_nom: nom || '',
        client_email: email || '',
        client_telephone: telephone || '',
        client_date_naissance: date_naissance || null,
      })
      .eq('pass_serial_number', serial_number);
    if (error) throw error;
    return res.status(200).json({ success: true, data: { message: 'Informations enregistrées.' } });
  } catch (err) {
    console.error('Erreur save-client-info:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Public by ID
router.get('/:id', commercantsController.getCommercantById);

module.exports = router;