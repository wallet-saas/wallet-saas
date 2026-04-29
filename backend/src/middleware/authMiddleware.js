const jwt = require('jsonwebtoken');

/**
 * Middleware pour vérifier le token JWT
 * Protège les routes qui nécessitent une authentification
 */
const authMiddleware = (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    console.log(`[AUTH] ${req.method} ${req.path} — Authorization header présent:`, !!authHeader);

    if (!authHeader) {
      console.log('[AUTH] ✗ Header Authorization manquant');
      return res.status(401).json({
        success: false,
        error: 'Token manquant. Veuillez vous connecter.'
      });
    }

    // Format attendu: "Bearer TOKEN"
    const token = authHeader.split(' ')[1];

    if (!token) {
      console.log('[AUTH] ✗ Token vide après split Bearer');
      return res.status(401).json({
        success: false,
        error: 'Format du token invalide.'
      });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[AUTH] ✓ Token valide — id:', decoded.id, '| email:', decoded.email, '| exp:', new Date(decoded.exp * 1000).toISOString());

    // Ajouter les infos du commerçant à la requête
    req.commercant = {
      id: decoded.id,
      email: decoded.email
    };

    next();
  } catch (error) {
    console.error('Erreur JWT:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expiré. Veuillez vous reconnecter.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token invalide.'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification du token.'
    });
  }
};

module.exports = authMiddleware;
