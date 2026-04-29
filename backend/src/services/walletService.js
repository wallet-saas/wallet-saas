const { v4: uuidv4 } = require('uuid');

/**
 * Service de génération de cartes Apple Wallet (MODE SIMULATION)
 * En attendant les certificats Apple, on simule la génération de cartes
 */

/**
 * Simuler la création d'une carte wallet
 * @param {Object} params - Paramètres de la carte
 * @returns {Promise<Object>}
 */
const createWalletPass = async (params) => {
  try {
    const {
      serialNumber,
      nomEnseigne,
      couleurPrimaire = '#5856D6',
      couleurSecondaire = '#FFFFFF',
      points = 0,
      pointsRecompense = 10
    } = params;

    // Simuler la structure d'une carte .pkpass
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: 'pass.com.stamply.loyalty',
      serialNumber: serialNumber,
      teamIdentifier: 'SIMULATION',
      organizationName: nomEnseigne,
      description: `Carte de fidélité ${nomEnseigne}`,
      
      // Couleurs
      backgroundColor: couleurPrimaire,
      foregroundColor: couleurSecondaire,
      labelColor: couleurSecondaire,
      
      // Données de la carte
      storeCard: {
        primaryFields: [
          {
            key: 'points',
            label: 'POINTS',
            value: points
          }
        ],
        secondaryFields: [
          {
            key: 'commerce',
            label: 'CHEZ',
            value: nomEnseigne
          },
          {
            key: 'reward',
            label: 'PROCHAIN CADEAU',
            value: `À ${pointsRecompense} points`
          }
        ],
        backFields: [
          {
            key: 'terms',
            label: 'Conditions',
            value: `Cumulez 1 point par visite. ${pointsRecompense} points = 1 récompense offerte.`
          }
        ]
      },
      
      // QR Code
      barcode: {
        message: serialNumber,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1'
      }
    };

    // En mode simulation, on retourne les données au format JSON
    // (au lieu d'un Buffer .pkpass)
    return {
      success: true,
      data: passData,
      isSimulation: true
    };

  } catch (error) {
    console.error('Erreur createWalletPass:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Mettre à jour les points d'une carte (simulation)
 * @param {Object} params
 * @returns {Promise<Object>}
 */
const updatePassPoints = async (params) => {
  try {
    const { newPoints } = params;

    // En mode simulation, on confirme juste la mise à jour
    return {
      success: true,
      message: `Points mis à jour : ${newPoints}`,
      isSimulation: true
    };

  } catch (error) {
    console.error('Erreur updatePassPoints:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  createWalletPass,
  updatePassPoints
};
