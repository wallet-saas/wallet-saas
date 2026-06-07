-- Migration 006 — Add points & last_visit_at to cartes table
-- The original schema.sql was missing these columns used by the wallet API.
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE cartes
  ADD COLUMN IF NOT EXISTS points         INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_visit_at  TIMESTAMPTZ;
