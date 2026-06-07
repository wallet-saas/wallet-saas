-- Migration 009 — Complément colonnes + table offres
-- À exécuter dans Supabase SQL Editor

-- 1. Colonnes manquantes dans commercants
ALTER TABLE commercants
  ADD COLUMN IF NOT EXISTS password TEXT,
  ADD COLUMN IF NOT EXISTS carte_programme_nom TEXT,
  ADD COLUMN IF NOT EXISTS carte_recompense_description TEXT,
  ADD COLUMN IF NOT EXISTS template_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS wallet_class_configured BOOLEAN DEFAULT FALSE;

-- 2. Table offres (module offres flash)
CREATE TABLE IF NOT EXISTS offres (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commercant_id     UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
  titre             VARCHAR(255) NOT NULL,
  description       TEXT,
  code_promo        VARCHAR(50),
  reduction_pct     NUMERIC(5,2),
  reduction_montant NUMERIC(8,2),
  date_debut        TIMESTAMPTZ DEFAULT NOW(),
  date_fin          TIMESTAMPTZ,
  actif             BOOLEAN DEFAULT TRUE,
  total_envoyes     INTEGER DEFAULT 0,
  total_utilises    INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offres_commercant ON offres(commercant_id);

-- 3. Trigger updated_at pour offres
DROP TRIGGER IF EXISTS tr_offres_updated ON offres;
CREATE TRIGGER tr_offres_updated BEFORE UPDATE ON offres FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. RLS pour offres
ALTER TABLE offres ENABLE ROW LEVEL SECURITY;
