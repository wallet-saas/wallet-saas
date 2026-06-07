/**
 * Rate limiting en mémoire pour les endpoints sensibles
 * Protège contre les attaques brute-force
 */

// Map<IP, { count, resetTime }>
const rateLimitMap = new Map();

/**
 * Crée un middleware de rate limiting
 * @param {number} maxRequests - Nombre max de requêtes par fenêtre
 * @param {number} windowMs - Durée de la fenêtre en ms
 * @param {string} message - Message d'erreur
 */
function createRateLimiter(maxRequests = 10, windowMs = 60 * 1000, message = 'Trop de requêtes. Réessayez plus tard.') {
  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();

    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetTime) {
      // Nouvelle fenêtre ou fenêtre expirée
      rateLimitMap.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (entry.count >= maxRequests) {
      const retryAfterMs = entry.resetTime - now;
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      });
    }

    entry.count++;
    next();
  };
}

// Rate limiter pour le login (5 tentatives par minute)
const loginRateLimiter = createRateLimiter(5, 60 * 1000, 'Trop de tentatives de connexion. Réessayez dans 1 minute.');

// Rate limiter pour le register (3 inscriptions par 10 minutes)
const registerRateLimiter = createRateLimiter(3, 10 * 60 * 1000, 'Trop d\'inscriptions. Réessayez dans 10 minutes.');

// Rate limiter pour le scan (30 scans par minute par IP)
const scanRateLimiter = createRateLimiter(30, 60 * 1000, 'Trop de scans. Réessayez dans quelques secondes.');

// Rate limiter pour les notifications (5 envois par minute)
const notificationRateLimiter = createRateLimiter(5, 60 * 1000, 'Trop de notifications. Réessayez dans 1 minute.');

// Nettoyage périodique des entrées expirées (toutes les 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

module.exports = {
  loginRateLimiter,
  registerRateLimiter,
  scanRateLimiter,
  notificationRateLimiter,
  createRateLimiter,
};
