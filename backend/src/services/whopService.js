const { supabase } = require('../config/supabase');

const WHOP_API_BASE = 'https://api.whop.com/api/v2';
const WHOP_API_KEY = process.env.WHOP_API_KEY;
const WHOP_PRODUCT_ID = process.env.WHOP_PRODUCT_ID;
const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

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
  const planId = 'plan_CpKndqmVy2HsP';
  const successUrl = encodeURIComponent(`${FRONTEND_URL}/dashboard?whop_success=1`);
  const cancelUrl = encodeURIComponent(`${FRONTEND_URL}/abonnement?cancelled=1`);
  // Whop metadata is passed as query param
  return `https://whop.com/checkout/${WHOP_PRODUCT_ID}?plan=${planId}&metadata[commercant_id]=${commercantId}&success_url=${successUrl}&cancel_url=${cancelUrl}`;
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
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
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
    whop_membership_id: membership.id,
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
  getCheckoutUrl,
  getMembership,
  getMembershipsByMetadata,
  cancelMembership,
  verifyWebhook,
  mapMembershipStatus,
  updateCommercantFromMembership,
};