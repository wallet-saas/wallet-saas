const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('Missing Stripe secret key');
}

const stripe = new Stripe(stripeSecretKey);

module.exports = { stripe };
