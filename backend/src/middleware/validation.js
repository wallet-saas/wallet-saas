/**
 * Middleware de validation des entrées
 * Valide et nettoie les données entrantes
 */

const { validationResult, body, param, query } = require('express-validator');

// Règles de validation pour l'inscription
const registerValidation = [
  body('email')
    .isEmail().withMessage('Email invalide.')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email trop long (max 255 caractères).'),
  body('password')
    .isLength({ min: 8, max: 128 }).withMessage('Le mot de passe doit contenir entre 8 et 128 caractères.')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule.')
    .matches(/[a-z]/).withMessage('Le mot de passe doit contenir au moins une minuscule.')
    .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre.'),
  body('nom_enseigne')
    .trim()
    .isLength({ min: 2, max: 255 }).withMessage('Le nom d\'enseigne doit contenir entre 2 et 255 caractères.')
    .escape(),
  body('siret')
    .optional()
    .matches(/^\d{14}$/).withMessage('Le SIRET doit contenir exactement 14 chiffres.'),
  body('telephone')
    .optional()
    .matches(/^[\d\s+\-().]{7,20}$/).withMessage('Numéro de téléphone invalide.'),
  body('adresse')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Adresse trop longue.')
    .escape(),
  body('code_postal')
    .optional()
    .matches(/^\d{5}$/).withMessage('Code postal invalide (5 chiffres requis).'),
  body('ville')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Nom de ville trop long.')
    .escape(),
];

// Règles de validation pour le login
const loginValidation = [
  body('email')
    .isEmail().withMessage('Email invalide.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Mot de passe requis.'),
];

// Règles de validation pour le setup wallet
const walletSetupValidation = [
  body('template_metier')
    .optional()
    .isIn(['boulangerie', 'coiffeur', 'restaurant', 'kine', 'garagiste', 'default'])
    .withMessage('Template invalide.'),
  body('carte_programme_nom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Nom du programme: 2-100 caractères.')
    .escape(),
  body('carte_recompense_description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description trop longue.')
    .escape(),
  body('carte_couleur_primaire')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Couleur invalide (format #RRGGBB).'),
  body('carte_couleur_secondaire')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Couleur invalide (format #RRGGBB).'),
  body('points_par_visite')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Points par visite: 1-10.'),
  body('points_recompense')
    .optional()
    .isInt({ min: 2, max: 100 }).withMessage('Seuil de récompense: 2-100.'),
];

// Règles de validation pour le scan (QR statique ou dynamique)
const scanValidation = [
  body('pass_serial_number')
    .optional()
    .isString().withMessage('Numéro de série invalide.')
    .isLength({ max: 255 }).withMessage('Numéro de série trop long.'),
  body('qr_string')
    .optional()
    .isString().withMessage('QR string invalide.')
    .isLength({ min: 10, max: 2000 }).withMessage('QR string invalide (taille).'),
];

// Règles de validation pour les notifications
const notificationValidation = [
  body('titre')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Titre: 1-100 caractères.'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 }).withMessage('Message: 1-500 caractères.'),
  body('cible')
    .optional()
    .isIn(['tous', 'actifs', 'dormants']).withMessage('Cible invalide.'),
];

// Règles de validation pour les offres
const offreValidation = [
  body('titre')
    .trim()
    .isLength({ min: 2, max: 255 }).withMessage('Titre: 2-255 caractères.')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description trop longue.')
    .escape(),
  body('reduction_pct')
    .optional()
    .isFloat({ min: 0.1, max: 100 }).withMessage('Réduction: 0.1-100%.'),
  body('reduction_montant')
    .optional()
    .isFloat({ min: 0.01, max: 10000 }).withMessage('Montant réduction invalide.'),
  body('date_fin')
    .optional()
    .isISO8601().withMessage('Date de fin invalide (ISO 8601).'),
];

// Middleware de vérification des erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Données invalides.',
      details: errors.array().map(e => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  walletSetupValidation,
  scanValidation,
  notificationValidation,
  offreValidation,
  handleValidationErrors,
};
