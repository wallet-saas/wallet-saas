const whopService = require('../services/whopService');

/**
 * POST /api/webhooks/whop
 *
 * Reçoit les événements Whop (membership.created, membership.updated, etc.)
 * Le webhook est already configuré dans Whop: https://stamply-backend-gn8z.onrender.com/api/webhooks/whop
 */
async function webhookHandler(req, res) {
  try {
    const signature = req.headers['x-whop-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    // Webhook secret verification
    if (whopService.WHOP_WEBHOOK_SECRET && signature) {
      const isValid = whopService.verifyWebhook(rawBody, signature);
      if (!isValid) {
        console.warn('[Whop webhook] Signature invalide');
        return res.status(401).json({ success: false, error: 'Signature invalide' });
      }
    } else {
      console.warn('[Whop webhook] ⚠️  Pas de WHOP_WEBHOOK_SECRET — signature non vérifiée');
    }

    const event = req.body;
    const eventType = event.type || event.event;
    const membership = event.data || event.membership;

    console.log(`[Whop webhook] Reçu: ${eventType}`, membership?.id ? `(membership: ${membership.id})` : '');

    switch (eventType) {
      case 'membership.created':
      case 'membership.activated':
      case 'membership.updated':
        if (membership) {
          await whopService.updateCommercantFromMembership(membership);
        }
        break;

      case 'membership.cancelled':
      case 'membership.expired':
        if (membership) {
          await whopService.updateCommercantFromMembership({
            ...membership,
            status: 'cancelled',
          });
        }
        break;

      default:
        console.log(`[Whop webhook] Type non géré: ${eventType}`);
    }

    return res.json({ success: true, received: true });
  } catch (error) {
    console.error('[Whop webhook] Erreur:', error.message);
    // Toujours retourner 200 pour éviter que Whop réessaie
    return res.json({ success: false, error: error.message });
  }
}

module.exports = { webhookHandler };