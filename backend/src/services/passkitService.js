const axios = require('axios');

/**
 * Service PassKit - Gestion des cartes Apple Wallet et Google Wallet
 * Documentation : https://docs.passkit.io
 */

const PASSKIT_API_URL = 'https://api.pub1.passkit.io';

/**
 * Créer une carte wallet pour un client
 * @param {Object} params - Paramètres de la carte
 * @returns {Promise<Object>} - Données de la carte créée
 */
const createPass = async (params) => {
  try {
    const {
      commercantId,
      serialNumber,
      nomEnseigne,
      couleurPrimaire = '#5856D6',
      couleurSecondaire = '#FFFFFF',
      logoUrl = null
    } = params;

    // Configuration de la carte
    const passData = {
      // Identifiant unique de la carte
      serialNumber: serialNumber,
      
      // Type de carte : Carte de fidélité
      storeCard: {
        // Champ principal : Points de fidélité
        primaryFields: [
          {
            key: 'points',
            label: 'POINTS',
            value: 0,
            changeMessage: 'Vous avez maintenant %@ points'
          }
        ],
        
        // Champs secondaires : Informations commerçant
        secondaryFields: [
          {
            key: 'commerce',
            label: 'CHEZ',
            value: nomEnseigne
          },
          {
            key: 'reward',
            label: 'PROCHAIN CADEAU',
            value: 'À 10 points'
          }
        ],
        
        // Champs auxiliaires (optionnel)
        auxiliaryFields: [
          {
            key: 'status',
            label: 'STATUT',
            value: 'Actif'
          }
        ],
        
        // Champs au dos de la carte
        backFields: [
          {
            key: 'terms',
            label: 'Conditions',
            value: 'Cumulez 1 point par visite. 10 points = 1 récompense offerte.'
          },
          {
            key: 'contact',
            label: 'Contact',
            value: 'Pour toute question, contactez directement votre commerçant.'
          }
        ]
      },

      // Code-barres (QR code pour scanner en caisse)
      barcode: {
        message: serialNumber,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1'
      },

      // Informations générales
      description: `Carte de fidélité ${nomEnseigne}`,
      organizationName: nomEnseigne,
      logoText: nomEnseigne,
      
      // Couleurs
      backgroundColor: couleurPrimaire,
      foregroundColor: couleurSecondaire,
      labelColor: couleurSecondaire,

      // Logo (optionnel)
      ...(logoUrl && {
        logo: logoUrl,
        icon: logoUrl
      })
    };

    // Appel API PassKit
    const response = await axios.post(
      `${PASSKIT_API_URL}/passes`,
      passData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PASSKIT_API_KEY}`,
          'X-Api-Secret': process.env.PASSKIT_API_SECRET
        }
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Erreur PassKit createPass:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

/**
 * Mettre à jour les points d'une carte
 * @param {string} serialNumber - Numéro de série de la carte
 * @param {number} newPoints - Nouveau nombre de points
 * @returns {Promise<Object>}
 */
const updatePassPoints = async (serialNumber, newPoints) => {
  try {
    const updateData = {
      storeCard: {
        primaryFields: [
          {
            key: 'points',
            value: newPoints
          }
        ]
      }
    };

    const response = await axios.patch(
      `${PASSKIT_API_URL}/passes/${serialNumber}`,
      updateData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PASSKIT_API_KEY}`,
          'X-Api-Secret': process.env.PASSKIT_API_SECRET
        }
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Erreur PassKit updatePassPoints:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

/**
 * Envoyer une notification push à une carte
 * @param {string} serialNumber - Numéro de série de la carte
 * @param {string} message - Message de la notification
 * @returns {Promise<Object>}
 */
const sendPushNotification = async (serialNumber, message) => {
  try {
    const response = await axios.post(
      `${PASSKIT_API_URL}/passes/${serialNumber}/push`,
      { message },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PASSKIT_API_KEY}`,
          'X-Api-Secret': process.env.PASSKIT_API_SECRET
        }
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Erreur PassKit sendPushNotification:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

/**
 * Supprimer une carte
 * @param {string} serialNumber - Numéro de série de la carte
 * @returns {Promise<Object>}
 */
const deletePass = async (serialNumber) => {
  try {
    const response = await axios.delete(
      `${PASSKIT_API_URL}/passes/${serialNumber}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PASSKIT_API_KEY}`,
          'X-Api-Secret': process.env.PASSKIT_API_SECRET
        }
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Erreur PassKit deletePass:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

module.exports = {
  createPass,
  updatePassPoints,
  sendPushNotification,
  deletePass
};
