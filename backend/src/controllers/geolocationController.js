const { supabase } = require('../config/supabase');
const {
  sendProximityNotification,
  checkProximityAndNotify,
  getGeolocationStats
} = require('../services/geolocationService');

// ---------------------------------------------------------------------------
// POST /api/geolocation/trigger
// Déclencher manuellement une notification de proximité (test ou webhook app mobile)
// ---------------------------------------------------------------------------
/**
 * Deux modes d'utilisation :
 * 1. Webhook depuis une app mobile : envoie { carte_id, latitude, longitude }
 *    → le serveur calcule la distance et déclenche si dans le rayon
 * 2. Déclenchement direct (test dashboard) : envoie { carte_id } uniquement
 *    → force l'envoi de la notification sans calcul de distance
 */
const triggerNotification = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const { carte_id, latitude, longitude } = req.body;

    if (!carte_id) {
      return res.status(400).json({ success: false, error: 'carte_id requis.' });
    }

    // Vérifier que la carte appartient à ce commerçant
    const { data: carte } = await supabase
      .from('cartes')
      .select('id')
      .eq('id', carte_id)
      .eq('commercant_id', commercantId)
      .single();

    if (!carte) {
      return res.status(404).json({ success: false, error: 'Carte introuvable ou non autorisée.' });
    }

    let result;

    if (latitude !== undefined && longitude !== undefined) {
      // Mode webhook : vérification distance + notification si dans rayon
      result = await checkProximityAndNotify(carte_id, parseFloat(latitude), parseFloat(longitude));

      if (!result.triggered) {
        return res.status(200).json({
          success: true,
          triggered: false,
          reason: result.reason || 'out_of_range',
          distance: result.distance,
          rayon: result.rayon
        });
      }
    } else {
      // Mode direct (test / déclenchement manuel depuis dashboard)
      result = await sendProximityNotification(carte_id, commercantId);
    }

    return res.status(200).json({
      success: true,
      triggered: true,
      data: result
    });

  } catch (error) {
    console.error('Erreur triggerNotification:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/geolocation/device-location  (PUBLIC — appelé par l'app mobile client)
// Reçoit la position GPS d'un client et déclenche si dans le rayon
// ---------------------------------------------------------------------------
const reportDeviceLocation = async (req, res) => {
  try {
    const { carte_id, latitude, longitude } = req.body;

    if (!carte_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'carte_id, latitude et longitude requis.' });
    }

    const result = await checkProximityAndNotify(
      carte_id,
      parseFloat(latitude),
      parseFloat(longitude)
    );

    return res.status(200).json({ success: true, data: result });

  } catch (error) {
    console.error('Erreur reportDeviceLocation:', error.message);
    // On retourne 200 quand même (le client ne doit pas savoir si on a envoyé ou non)
    return res.status(200).json({ success: true });
  }
};

// ---------------------------------------------------------------------------
// GET /api/geolocation/stats
// Statistiques de conversion géolocalisation
// ---------------------------------------------------------------------------
const getStats = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;

    // Vérifier que le module est activé
    const { data: commercant } = await supabase
      .from('commercants')
      .select('module_geolocalisation, rayon_geoloc_metres, latitude, longitude')
      .eq('id', commercantId)
      .single();

    const stats = await getGeolocationStats(commercantId);

    return res.status(200).json({
      success: true,
      data: {
        ...stats,
        moduleActif: commercant?.module_geolocalisation || false,
        rayonMetres: commercant?.rayon_geoloc_metres || 200,
        positionConfiguree: !!(commercant?.latitude && commercant?.longitude)
      }
    });

  } catch (error) {
    console.error('Erreur getStats géoloc:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  triggerNotification,
  reportDeviceLocation,
  getStats
};
