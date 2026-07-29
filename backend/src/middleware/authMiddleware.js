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

    if (decoded.type === 'employe') {
      // Jeton employé : il agit dans le commerce de son employeur, mais
      // uniquement sur les modules qui lui ont été accordés.
      req.commercant = { id: decoded.commercant_id, email: null };
      req.employe = {
        id: decoded.id,
        prenom: decoded.prenom,
        permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [],
      };
    } else {
      req.commercant = { id: decoded.id, email: decoded.email };
      req.employe = null;
    }

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

/**
 * Réserve une route au commerçant lui-même.
 * À poser sur tout ce qu'un employé ne doit jamais toucher : paramètres du
 * commerce, abonnement, gestion de l'équipe, design de la carte.
 */
const requireCommercant = (req, res, next) => {
  if (req.employe) {
    return res.status(403).json({
      success: false,
      error: "Cette action est réservée au responsable du commerce.",
    });
  }
  next();
};

/**
 * Exige une permission précise pour un employé.
 * Le commerçant passe toujours ; l'employé doit avoir le module coché.
 * C'est la vérification qui compte : masquer un menu ne protège rien.
 */
const requirePermission = (module) => (req, res, next) => {
  if (!req.employe) return next();
  if (req.employe.permissions.includes(module)) return next();
  return res.status(403).json({
    success: false,
    error: `Vous n'avez pas accès au module « ${module} ».`,
  });
};

module.exports = authMiddleware;
module.exports.requireCommercant = requireCommercant;
module.exports.requirePermission = requirePermission;
