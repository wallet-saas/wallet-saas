const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const stripeService = require('../services/stripeService');

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
 * Browser redirect — token passed as query param because window.location.href is used.
 */
const checkout = async (req, res) => {
  try {
    // Accept token from Authorization header OR from query param (browser redirect)
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

    const session = await stripeService.createCheckoutSession(commercant);
    return res.redirect(303, session.url);
  } catch (error) {
    console.error('[subscription] checkout error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/subscription/portal
 * Returns { url } — frontend opens it in a new tab.
 */
const portal = async (req, res) => {
  try {
    const commercant = await getCommercant(req.commercant.id);
    const session = await stripeService.createPortalSession(commercant);
    return res.json({ url: session.url });
  } catch (error) {
    console.error('[subscription] portal error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/subscription/cancel
 * Sets cancel_at_period_end = true in Stripe.
 */
const cancel = async (req, res) => {
  try {
    const commercant = await getCommercant(req.commercant.id);
    await stripeService.cancelSubscription(commercant);
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
      .select('abonnement_statut, stripe_subscription_id, stripe_customer_id, abonnement_fin')
      .eq('id', req.commercant.id)
      .single();

    if (error || !commercant) {
      return res.status(404).json({ success: false, error: 'Commerçant introuvable' });
    }

    return res.json({
      statut: commercant.abonnement_statut,
      date_fin: commercant.abonnement_fin,
      has_subscription: !!commercant.stripe_subscription_id,
    });
  } catch (error) {
    console.error('[subscription] status error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/subscription/sync
 * Pulls the live subscription from Stripe and updates Supabase immediately.
 * Used as fallback when the webhook hasn't fired yet (e.g. dev mode without Stripe CLI).
 */
const sync = async (req, res) => {
  try {
    const { data: commercant, error: fetchError } = await supabase
      .from('commercants')
      .select('id, stripe_customer_id')
      .eq('id', req.commercant.id)
      .single();

    if (fetchError || !commercant) {
      return res.status(404).json({ success: false, error: 'Commerçant introuvable' });
    }

    if (!commercant.stripe_customer_id) {
      return res.status(400).json({ success: false, error: 'Aucun customer Stripe associé' });
    }

    console.log(`[subscription/sync] Fetching Stripe subscriptions for customer: ${commercant.stripe_customer_id}`);

    // Pull all non-canceled subscriptions (active, trialing, past_due…)
    const { stripe } = require('../services/stripeService');
    const subscriptions = await stripe.subscriptions.list({
      customer: commercant.stripe_customer_id,
      limit: 5,
    });

    console.log(`[subscription/sync] Found ${subscriptions.data.length} subscription(s)`);

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ success: false, error: 'Aucune subscription trouvée dans Stripe' });
    }

    // Prefer active/trialing, fallback to most recent
    const sub =
      subscriptions.data.find((s) => s.status === 'active' || s.status === 'trialing') ||
      subscriptions.data[0];

    const statusMap = { active: 'actif', trialing: 'actif', past_due: 'suspendu', unpaid: 'suspendu', canceled: 'annule' };
    const abonnement_statut = statusMap[sub.status] || 'inactif';

    console.log(`[subscription/sync] Updating commercant ${commercant.id}: abonnement_statut=${abonnement_statut}, sub_id=${sub.id}`);

    const { error: updateError } = await supabase
      .from('commercants')
      .update({
        stripe_subscription_id: sub.id,
        abonnement_statut,
        abonnement_fin: sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
      })
      .eq('id', commercant.id);

    if (updateError) {
      console.error('[subscription/sync] Supabase update error:', updateError.message);
      return res.status(500).json({ success: false, error: updateError.message });
    }

    console.log(`[subscription/sync] ✅ Success`);
    return res.json({
      success: true,
      data: { abonnement_statut, stripe_subscription_id: sub.id },
    });
  } catch (error) {
    console.error('[subscription/sync] Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { checkout, portal, cancel, status, sync };
