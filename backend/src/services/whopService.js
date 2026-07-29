const { supabase } = require('../config/supabase');

const WHOP_API_BASE = 'https://api.whop.com/api/v2';
const WHOP_API_KEY = process.env.WHOP_API_KEY;
const WHOP_PRODUCT_ID = process.env.WHOP_PRODUCT_ID;
const WHOP_PLAN_ID = process.env.WHOP_PLAN_ID || 'plan_CpKndqmVy2HsP';
const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://stamply-gamma.vercel.app' 
    : 'http://localhost:3001');

function getHeaders() {
  return {
    'Authorization': `Bearer ${WHOP_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

// ─── API calls ─────────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const url = `${WHOP_API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error?.message || `Whop API error ${res.status}`);
  }
  return body;
}

// ─── Checkout URL ──────────────────────────────────────────────────────────────

/**
 * Whop hosted checkout URL.
 * Format: https://whop.com/checkout/{product_id}?plan={plan_id}
 * We add metadata to identify the commercant when webhook fires.
 */
function getCheckoutUrl(commercantId) {
  // Use direct plan URL — the product+plan format shows "Nothing to see here"
  const successUrl = encodeURIComponent(`${FRONTEND_URL}/dashboard?whop_success=1`);
  const cancelUrl = encodeURIComponent(`${FRONTEND_URL}/abonnement?cancelled=1`);
  // Metadata is passed as query params on the direct plan checkout URL
  return `https://whop.com/checkout/${WHOP_PLAN_ID}?metadata[commercant_id]=${commercantId}&success_url=${successUrl}&cancel_url=${cancelUrl}`;
}

// ─── Get Membership ────────────────────────────────────────────────────────────

async function getMembership(membershipId) {
  const data = await apiFetch(`/memberships/${membershipId}`);
  return data;
}

// ─── List Memberships for a user ──────────────────────────────────────────────

async function getMembershipsByMetadata(commercantId) {
  const data = await apiFetch(`/memberships?metadata[commercant_id]=${commercantId}`);
  return data.data || [];
}

// ─── Factures / reçus de paiement ─────────────────────────────────────────────

/**
 * Récupère les paiements Whop d'un commerçant. Whop émet et archive déjà les
 * factures : on ne les regénère pas, on rapatrie simplement la liste et le
 * lien du reçu pour que le commerçant les retrouve depuis son dashboard.
 *
 * @param {string} membershipId
 * @returns {Promise<Array<{id, date, montant, devise, statut, recu_url}>>}
 */
/**
 * Normalise une date Whop.
 * L'API mélange les formats selon les endpoints et les versions : chaîne ISO
 * ("2023-12-01T05:00:00.401Z"), timestamp Unix en secondes (1701406800) ou en
 * millisecondes. Multiplier aveuglément par 1000 faisait lever un RangeError
 * sur les chaînes ISO, ce qui cassait toute la liste des factures.
 */
function normaliserDateWhop(valeur) {
  if (!valeur) return null;

  if (typeof valeur === 'string') {
    const d = new Date(valeur);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  if (typeof valeur === 'number') {
    // Moins de 10^12 : des secondes ; au-delà : des millisecondes
    const ms = valeur < 1e12 ? valeur * 1000 : valeur;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  return null;
}

async function getPayments(membershipId) {
  if (!membershipId) return [];

  const data = await apiFetch(`/payments?membership_id=${encodeURIComponent(membershipId)}`);
  const lignes = data?.data || data?.payments || (Array.isArray(data) ? data : []);

  return lignes
    .map(p => ({
      id: p.id,
      date: normaliserDateWhop(p.paid_at) || normaliserDateWhop(p.created_at),
      // Le nom du champ montant varie : on prend le premier disponible
      montant: p.amount_after_fees ?? p.final_amount ?? p.subtotal ?? p.amount ?? null,
      devise: (p.currency || 'eur').toUpperCase(),
      statut: p.status || 'paid',
      // Whop n'expose pas d'URL de reçu par paiement dans l'API : le commerçant
      // les retrouve dans son espace commandes Whop.
      recu_url: p.receipt_url || p.hosted_invoice_url || null,
    }))
    // Certains paiements en cours n'ont aucune date exploitable : on les écarte
    // plutôt que d'afficher une ligne vide
    .filter(p => p.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ─── Cancel Membership ─────────────────────────────────────────────────────────

async function cancelMembership(membershipId) {
  const data = await apiFetch(`/memberships/${membershipId}/cancel`, {
    method: 'POST',
  });
  return data;
}

// ─── Verify Webhook Signature ──────────────────────────────────────────────────

function verifyWebhook(rawBody, signature) {
  // Whop signature is in the header X-Whop-Signature
  // Simple HMAC-SHA256 verification
  const crypto = require('crypto');
  const expected = crypto
    .createHmac('sha256', WHOP_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false; // timingSafeEqual jette sinon
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

// ─── Map Whop status to Stamply status ─────────────────────────────────────────

function mapMembershipStatus(whopStatus) {
  // Whop statuses: active, cancelled, expired, paused, pending
  const map = {
    active: 'actif',
    cancelled: 'inactif',
    expired: 'inactif',
    paused: 'suspendu',
    pending: 'inactif',
  };
  return map[whopStatus] || 'inactif';
}

// ─── Update commercant from Whop membership ───────────────────────────────────

async function updateCommercantFromMembership(membership) {
  const commercantId = membership.metadata?.commercant_id;
  if (!commercantId) {
    console.warn('[Whop] Webhook: no commercant_id in metadata');
    return null;
  }

  const whopStatus = membership.status || 'active';
  const abonnementStatut = mapMembershipStatus(whopStatus);

  const updateData = {
    whop_subscription_id: membership.id,
    whop_customer_id: membership.user?.id || membership.user_id,
    abonnement_statut: abonnementStatut,
    abonnement_debut: membership.created_at
      ? new Date(membership.created_at * 1000).toISOString()
      : undefined,
    abonnement_fin: membership.expires_at
      ? new Date(membership.expires_at * 1000).toISOString()
      : null,
  };

  // Clean undefined values
  Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

  const { error } = await supabase
    .from('commercants')
    .update(updateData)
    .eq('id', commercantId);

  if (error) {
    console.error('[Whop] Error updating commercant:', error.message);
    return null;
  }

  console.log(`[Whop] ✅ Commerçant ${commercantId} → ${abonnementStatut} (whop: ${whopStatus})`);
  return { commercantId, statut: abonnementStatut };
}

module.exports = {
  getPayments,
  getCheckoutUrl,
  getMembership,
  getMembershipsByMetadata,
  cancelMembership,
  verifyWebhook,
  mapMembershipStatus,
  updateCommercantFromMembership,
};