-- Migration 005 — QR code d'installation unique par commerçant
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE commercants
  ADD COLUMN IF NOT EXISTS qr_code_install_url TEXT;
