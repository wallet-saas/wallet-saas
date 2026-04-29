const stripeService = require('../services/stripeService');

/**
 * POST /api/webhooks/stripe
 * Raw body is required — must be registered before express.json() in index.js.
 */
const webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret && sig) {
      // Production / staging: verify Stripe signature
      event = stripeService.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // Development without webhook secret — parse raw buffer
      const body = req.body instanceof Buffer ? req.body.toString('utf8') : req.body;
      event = typeof body === 'string' ? JSON.parse(body) : body;
      console.warn('[Stripe webhook] ⚠️  No STRIPE_WEBHOOK_SECRET — signature not verified');
    }
  } catch (err) {
    console.error('[Stripe webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`[Stripe webhook] Received: ${event.type}`);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await stripeService.updateSubscriptionStatus(event.data.object);
        break;

      case 'customer.subscription.deleted':
        // Force status to 'canceled' regardless of what Stripe sends
        await stripeService.updateSubscriptionStatus({
          ...event.data.object,
          status: 'canceled',
        });
        break;

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const subscription = await stripeService.stripe.subscriptions.retrieve(
            invoice.subscription
          );
          await stripeService.updateSubscriptionStatus({
            ...subscription,
            status: 'past_due',
          });
        }
        break;
      }

      default:
        // Unhandled event types are fine — just acknowledge receipt
        break;
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('[Stripe webhook] Processing error:', error.message);
    // Return 200 anyway to prevent Stripe from retrying unnecessarily
    return res.status(200).json({ received: true, warning: error.message });
  }
};

module.exports = { webhookHandler };
