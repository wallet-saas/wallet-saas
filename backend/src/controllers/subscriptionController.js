const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const whopService = require('../services/whopService');

// Helper: fetch full commercant row
async function getCommercant(id) {
  const { data, error } = await supabase
    .from('commercants')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) throw new Error('Commerçant introuvable');
  return data;
}

/**
 * GET /api/subscription/checkout?token=...
 * Redirige vers Whop checkout hosted.
 */
const checkout = async (req, res) => {
  try {
    let token = req.query.token;
    if (!token) {
      const header = req.headers.authorization;
      token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    }
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token requis' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, error: 'Token invalide' });
    }

    const commercant = await getCommercant(decoded.id);

    if (commercant.abonnement_statut === 'actif') {
      return res.redirect(
        303,
        `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard`
      );
    }

    // Rediriger vers Whop checkout
    const checkoutUrl = whopService.getCheckoutUrl(commercant.id);
    return res.redirect(303, checkoutUrl);
  } catch (error) {
    console.error('[subscription] checkout error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/subscription/portal
 * Retourne un lien vers la page de gestion Whop
 */
const portal = async (req, res) => {
  try {
    const commercant = await getCommercant(req.commercant.id);

    if (!commercant.whop_subscription_id) {
      return res.status(400).json({
        success: false,
        error: 'Aucun abonnement Whop associé à ce compte',
      });
    }

    // Whop n'a pas de portail client dédié
    // On redirige vers la page produit Whop où l'utilisateur peut gérer
    const url = `https://whop.com/checkout/${process.env.WHOP_PRODUCT_ID}/manage?membership_id=${commercant.whop_subscription_id}`;
    return res.json({ url });
  } catch (error) {
    console.error('[subscription] portal error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/subscription/cancel
 * Annule l'abonnement via Whop
 */
const cancel = async (req, res) => {
  try {
    const commercant = await getCommercant(req.commercant.id);

    if (!commercant.whop_subscription_id) {
      return res.status(400).json({ success: false, error: 'Aucun abonnement actif' });
    }

    await whopService.cancelMembership(commercant.whop_subscription_id);

    // Mettre à jour le statut localement
    await supabase
      .from('commercants')
      .update({ abonnement_statut: 'inactif' })
      .eq('id', commercant.id);

    return res.json({
      success: true,
      message: "Abonnement annulé. Votre accès reste actif jusqu'à la fin de la période en cours.",
    });
  } catch (error) {
    console.error('[subscription] cancel error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/subscription/status
 */
const status = async (req, res) => {
  try {
    const { data: commercant, error } = await supabase
      .from('commercants')
      .select('abonnement_statut, whop_subscription_id, whop_customer_id, abonnement_fin')
      .eq('id', req.commercant.id)
      .single();

    if (error || !commercant) {
      return res.status(404).json({ success: false, error: 'Commerçant introuvable' });
    }

    return res.json({
      success: true,
      data: {
        statut: commercant.abonnement_statut,
        date_fin: commercant.abonnement_fin,
        has_subscription: commercant.abonnement_statut === 'actif',
        whop_subscription_id: commercant.whop_subscription_id,
      },
    });
  } catch (error) {
    console.error('[subscription] status error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/subscription/sync
 * Force-sync Whop → Supabase
 */
const sync = async (req, res) => {
  try {
    const commercant = await getCommercant(req.commercant.id);

    if (!commercant.whop_subscription_id) {
      throw new Error('Aucun abonnement Whop trouvé');
    }

    // Vérifier le statut sur Whop
    const membership = await whopService.getMembership(commercant.whop_subscription_id);

    const newStatus = whopService.mapMembershipStatus(membership.status || 'active');

    const { error: updateError } = await supabase
      .from('commercants')
      .update({ abonnement_statut: newStatus })
      .eq('id', commercant.id);

    if (updateError) throw updateError;

    return res.json({
      success: true,
      data: {
        abonnement_statut: newStatus,
        whop_subscription_id: commercant.whop_subscription_id,
      },
    });
  } catch (error) {
    console.error('[subscription] sync error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { checkout, portal, cancel, status, sync };