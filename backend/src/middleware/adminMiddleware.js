/**
 * Stamply — Middleware Admin
 * Protège les routes d'administration.
 * 
 * Deux modes d'authentification :
 * 1. Header ADMIN_KEY (simple secret key dans les variables d'environnement)
 * 2. Header Authorization Bearer <JWT> + email = ADMIN_EMAIL
 * 
 * Variables d'environnement requises :
 *   ADMIN_KEY=stamply_admin_xxx          (accès simple, recommandé)
 *   ADMIN_EMAIL=ton@email.com            (optionnel, pour auth JWT)
 */

const jwt = require('jsonwebtoken');

const ADMIN_KEY = process.env.ADMIN_KEY || 'stamply_admin_default_change_me';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || null;

function adminMiddleware(req, res, next) {
  // Mode 1 : Admin Key (header X-Admin-Key)
  const adminKey = req.headers['x-admin-key'];
  if (adminKey && adminKey === ADMIN_KEY) {
    req.admin = { mode: 'key' };
    return next();
  }

  // Mode 2 : JWT Bearer + email admin
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (ADMIN_EMAIL && decoded.email === ADMIN_EMAIL) {
          req.admin = { mode: 'jwt', email: decoded.email, id: decoded.id };
          return next();
        }
      }
    } catch (e) {
      // fall through to 401
    }
  }

  return res.status(401).json({
    success: false,
    error: 'Accès admin refusé. Fournir X-Admin-Key ou token admin.',
  });
}

module.exports = { adminMiddleware, ADMIN_KEY };
