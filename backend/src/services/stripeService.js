const Stripe = require('stripe');
const { supabase } = require('../config/supabase');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

// Resolve price ID — logs a warning at startup if not configured
let _priceId = null;
async function getPriceId() {
  if (_priceId) return _priceId;

  if (process.env.STRIPE_PRICE_ID) {
    _priceId = process.env.STRIPE_PRICE_ID;
    return _priceId;
  }

  // Auto-create product + price on first use (test mode convenience)
  console.warn('⚠️  STRIPE_PRICE_ID not set — creating Stamply Pro product in Stripe test mode...');
  const product = await stripe.products.create({
    name: 'Stamply Pro',
    description: 'Carte de fidélité digitale illimitée – Apple & Google Wallet',
  });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 2900, // 29 € in cents
    currency: 'eur',
    recurring: { interval: 'month' },
  });
  _priceId = price.id;
  console.log(`✅ Stripe price created: ${price.id} — add to .env: STRIPE_PRICE_ID=${price.id}`);
  return _priceId;
}

// Get or create a Stripe customer for a commerçant
async function getOrCreateCustomer(commercant) {
  if (commercant.stripe_customer_id) {
    return commercant.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: commercant.email,
    name: commercant.nom_enseigne,
    metadata: { commercant_id: commercant.id },
  });

  await supabase
    .from('commercants')
    .update({ stripe_customer_id: customer.id })
    .eq('id', commercant.id);

  return customer.id;
}

// Create a Checkout session (redirect flow)
async function createCheckoutSession(commercant) {
  const priceId = await getPriceId();
  const customerId = await getOrCreateCustomer(commercant);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${FRONTEND_URL}/abonnement?success=1`,
    cancel_url: `${FRONTEND_URL}/abonnement?cancelled=1`,
    metadata: { commercant_id: commercant.id },
    locale: 'fr',
  });

  return session;
}

// Create a Stripe Customer Portal session
async function createPortalSession(commercant) {
  if (!commercant.stripe_customer_id) {
    throw new Error('Aucun client Stripe associé à ce compte');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: commercant.stripe_customer_id,
    return_url: `${FRONTEND_URL}/dashboard/abonnement`,
  });

  return session;
}

// Cancel subscription at end of current period
async function cancelSubscription(commercant) {
  if (!commercant.stripe_subscription_id) {
    throw new Error('Aucun abonnement actif');
  }

  const subscription = await stripe.subscriptions.update(
    commercant.stripe_subscription_id,
    { cancel_at_period_end: true }
  );

  return subscription;
}

// Map Stripe status to our statut_abonnement values
function mapStripeStatus(stripeStatus) {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':    return 'actif';
    case 'past_due':
    case 'unpaid':      return 'suspendu';
    case 'canceled':    return 'annule';
    default:            return 'inactif';
  }
}

// Sync a Stripe subscription object to the commercants table
async function updateSubscriptionStatus(subscription) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id;

  const { data: commercant } = await supabase
    .from('commercants')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!commercant) {
    console.warn(`[Stripe] No commercant found for customer: ${customerId}`);
    return;
  }

  const abonnement_statut = mapStripeStatus(subscription.status);
  const date_fin = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  console.log(`[Stripe] Updating commercant ${commercant.id}: abonnement_statut=${abonnement_statut}, sub_id=${subscription.id}`);

  const { error } = await supabase
    .from('commercants')
    .update({
      stripe_subscription_id: subscription.id,
      abonnement_statut,
      abonnement_fin: date_fin,
    })
    .eq('id', commercant.id);

  if (error) {
    console.error('[Stripe] Failed to update subscription status:', error.message);
    throw error;
  }

  console.log(`[Stripe] ✅ Updated commercant ${commercant.id}: abonnement_statut=${abonnement_statut}`);
}

module.exports = {
  stripe,
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
  updateSubscriptionStatus,
};
