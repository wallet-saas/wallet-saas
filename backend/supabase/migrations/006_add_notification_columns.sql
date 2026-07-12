-- Stamply — Migration 006 : Colonnes notifications Apple Wallet + géoloc
-- Exécuter dans Supabase SQL Editor

-- 1. Ajouter les colonnes pour stocker le message de notification Apple Wallet
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS last_notif_titre TEXT DEFAULT '';
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS last_notif_message TEXT DEFAULT '';
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS last_notif_sent_at TIMESTAMPTZ;

-- 2. Index pour retrouver rapidement les cartes avec push tokens
CREATE INDEX IF NOT EXISTS idx_cartes_apple_push_token ON cartes(apple_push_token) WHERE apple_push_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cartes_apple_device_id ON cartes(apple_device_id) WHERE apple_device_id IS NOT NULL;

-- 3. Colonnes géolocalisation (si pas déjà faites)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS consentement_geoloc BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS device_token TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS platform TEXT;

-- 4. Colonnes Apple Wallet web service
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS apple_auth_token TEXT;
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS apple_device_id TEXT;
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS apple_push_token TEXT;
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS apple_registered_at TIMESTAMPTZ;