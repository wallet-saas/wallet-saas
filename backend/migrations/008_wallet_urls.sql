-- Migration 008 : URLs d'installation Google Wallet + Apple Wallet
-- À exécuter dans Supabase SQL Editor

-- 1. Colonnes pour les URLs d'installation wallet
ALTER TABLE cartes
  ADD COLUMN IF NOT EXISTS google_wallet_url TEXT,
  ADD COLUMN IF NOT EXISTS apple_wallet_url  TEXT,
  ADD COLUMN IF NOT EXISTS installed_at      TIMESTAMPTZ;

-- 2. Élargir la contrainte pass_type pour inclure 'universal'
--    (une carte peut être installée sur Apple ou Google selon l'OS du client)
ALTER TABLE cartes DROP CONSTRAINT IF EXISTS cartes_pass_type_check;
ALTER TABLE cartes
  ADD CONSTRAINT cartes_pass_type_check
  CHECK (pass_type IN ('apple', 'google', 'universal'));
