const fs = require('fs').promises;
const path = require('path');

/**
 * Utilitaire pour charger et valider les certificats Apple
 */

/**
 * Vérifier que tous les certificats nécessaires sont présents
 * @returns {Promise<Object>}
 */
const checkCertificates = async () => {
  try {
    const certificatesPath = path.resolve(__dirname, '../../certificates');
    
    const requiredFiles = [
      'wwdr.pem',
      'signerCert.pem',
      'signerKey.pem'
    ];

    const missingFiles = [];

    for (const file of requiredFiles) {
      const filePath = path.join(certificatesPath, file);
      try {
        await fs.access(filePath);
      } catch (error) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      return {
        valid: false,
        message: `Certificats manquants : ${missingFiles.join(', ')}`,
        missingFiles
      };
    }

    // Vérifier que le mot de passe du certificat est configuré
    if (!process.env.APPLE_PASS_CERT_PASSWORD) {
      return {
        valid: false,
        message: 'APPLE_PASS_CERT_PASSWORD non configuré dans .env'
      };
    }

    return {
      valid: true,
      message: 'Tous les certificats sont présents'
    };

  } catch (error) {
    return {
      valid: false,
      message: error.message
    };
  }
};

/**
 * Initialiser le dossier certificates/ si il n'existe pas
 * @returns {Promise<void>}
 */
const initCertificatesFolder = async () => {
  const certificatesPath = path.resolve(__dirname, '../../certificates');
  
  try {
    await fs.access(certificatesPath);
  } catch (error) {
    // Le dossier n'existe pas, on le crée
    await fs.mkdir(certificatesPath, { recursive: true });
    console.log('📁 Dossier certificates/ créé');
  }
};

module.exports = {
  checkCertificates,
  initCertificatesFolder
};
