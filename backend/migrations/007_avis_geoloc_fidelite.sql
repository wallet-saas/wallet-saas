-- Migration 007 : Avis notification unique, cooldown géoloc, URL Google directe
-- À exécuter dans Supabase SQL Editor

-- 1. URL directe vers la fiche Google du commerce
--    Le commerçant renseigne cette URL dans ses paramètres.
--    Ex: https://g.page/mon-commerce ou https://maps.google.com/?cid=xxx
ALTER TABLE commercants
  ADD COLUMN IF NOT EXISTS google_place_url TEXT;

-- 2. Suivi : est-ce que la notification d'avis a déjà été envoyée pour cette carte ?
--    Une seule notification avis par carte (envoyée à la première installation).
ALTER TABLE cartes
  ADD COLUMN IF NOT EXISTS avis_notif_sent BOOLEAN DEFAULT FALSE;

-- 3. Timestamp de la dernière notification de géolocalisation pour cette carte.
--    Permet d'imposer un cooldown de 72h entre deux notifications de proximité.
ALTER TABLE cartes
  ADD COLUMN IF NOT EXISTS last_geoloc_notif_at TIMESTAMPTZ;
