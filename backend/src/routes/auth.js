const express = require('express');
const router = express.Router();
const { register, login, getMe, changePassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { loginRateLimiter, registerRateLimiter } = require('../middleware/rateLimiter');
const { registerValidation, loginValidation, handleValidationErrors } = require('../middleware/validation');

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouveau commerçant
 * @access  Public
 */
router.post('/register', registerRateLimiter, registerValidation, handleValidationErrors, register);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un commerçant
 * @access  Public
 */
router.post('/login', loginRateLimiter, loginValidation, handleValidationErrors, login);

/**
 * @route   GET /api/auth/me
 * @desc    Récupérer les informations du commerçant connecté
 * @access  Private (nécessite un token JWT)
 */
router.get('/me', authMiddleware, getMe);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Modifier le mot de passe
 * @access  Private
 */
router.put('/change-password', authMiddleware, changePassword);

module.exports = router;
