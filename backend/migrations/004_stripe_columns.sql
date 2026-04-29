-- Migration 004 — Add Stripe columns (stripe_customer_id & stripe_subscription_id already
-- exist in the original schema.sql; this migration is a safe no-op for those.
-- abonnement_fin also already exists in the original schema — do NOT add date_fin_abonnement.
-- Run this in Supabase Dashboard → SQL Editor only if your table is missing these columns.

ALTER TABLE commercants
  ADD COLUMN IF NOT EXISTS stripe_customer_id      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS abonnement_fin           TIMESTAMPTZ;

-- Index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_commercants_stripe_customer_id
  ON commercants (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
