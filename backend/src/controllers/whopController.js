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
    // Whop transmet le nom de l'événement dans « action » (cf. docs Whop) ;
    // « type » et « event » sont acceptés en secours selon les versions.
    const eventType = event.action || event.type || event.event;
    const membership = event.data || event.membership;

    console.log(`[Whop webhook] Reçu: ${eventType}`, membership?.id ? `(membership: ${membership.id})` : '');

    switch (eventType) {
      // ── L'abonnement devient valide ──
      case 'membership.went_valid':
      case 'membership.activated':
      case 'membership.created':
      case 'membership.updated':
      case 'membership.metadata_updated':
        if (membership) {
          await whopService.updateCommercantFromMembership(membership);
        }
        break;

      // ── L'abonnement cesse d'être valide ──
      // Whop regroupe ici l'échec de paiement, la résiliation et l'expiration.
      // Sans ces cas, un commerçant qui ne paie plus gardait son accès.
      case 'membership.went_invalid':
      case 'membership.deactivated':
      case 'membership.cancelled':
      case 'membership.expired':
        if (membership) {
          await whopService.updateCommercantFromMembership({
            ...membership,
            status: 'cancelled',
          });
          console.log(`[Whop webhook] Accès retiré (${eventType})`);
        }
        break;

      // ── Paiement échoué : on ne coupe pas tout de suite ──
      // Whop réessaie plusieurs fois avant d'invalider l'abonnement ; couper
      // au premier échec pénaliserait un commerçant dont la carte a juste
      // expiré. On trace, et c'est membership.went_invalid qui coupera.
      case 'payment.failed':
        console.warn(`[Whop webhook] Paiement échoué pour ${membership?.id || 'inconnu'} — accès maintenu jusqu'à invalidation par Whop`);
        break;

      case 'payment.succeeded':
        if (membership) {
          await whopService.updateCommercantFromMembership(membership);
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