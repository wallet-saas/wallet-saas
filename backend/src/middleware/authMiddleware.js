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

/**
 * Exige un abonnement actif pour agir dans le commerce.
 *
 * S'applique au commerçant ET à ses employés : si l'abonnement s'arrête, plus
 * personne ne peut scanner, notifier ou pousser une offre — sinon il suffirait
 * de créer un compte employé pour continuer à utiliser Stamply sans payer.
 *
 * Les données ne sont pas touchées : les cartes des clients restent en place,
 * et tout redevient accessible dès le paiement suivant.
 *
 * Piloté par REQUIRE_SUBSCRIPTION=true sur Render, comme le reste du paywall.
 */
const STATUTS_AUTORISES = ['actif', 'trialing'];
const cacheAbonnement = new Map();
const CACHE_MS = 30 * 1000;

const requireAbonnementActif = async (req, res, next) => {
  if (process.env.REQUIRE_SUBSCRIPTION !== 'true') return next();

  const commercantId = req.commercant?.id;
  if (!commercantId) return next();

  try {
    let statut = null;
    const enCache = cacheAbonnement.get(commercantId);
    if (enCache && Date.now() - enCache.at < CACHE_MS) {
      statut = enCache.statut;
    } else {
      const { supabase } = require('../config/supabase');
      const { data } = await supabase
        .from('commercants')
        .select('abonnement_statut')
        .eq('id', commercantId)
        .single();
      statut = data?.abonnement_statut || 'inactif';
      cacheAbonnement.set(commercantId, { statut, at: Date.now() });
    }

    if (STATUTS_AUTORISES.includes(statut)) return next();

    return res.status(402).json({
      success: false,
      error: req.employe
        ? "L'abonnement de ce commerce est suspendu. Contactez votre responsable."
        : "Votre abonnement est inactif. Réactivez-le pour continuer à utiliser Stamply.",
      abonnement_requis: true,
    });
  } catch (err) {
    // En cas de panne de lecture, on laisse passer plutôt que de bloquer une
    // caisse en plein service : la coupure d'accès ne doit jamais venir d'un bug.
    console.error('[Auth] Vérification abonnement impossible:', err.message);
    return next();
  }
};

module.exports = authMiddleware;
module.exports.requireCommercant = requireCommercant;
module.exports.requirePermission = requirePermission;
module.exports.requireAbonnementActif = requireAbonnementActif;
