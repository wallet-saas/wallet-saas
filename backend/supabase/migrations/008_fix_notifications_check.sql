-- =============================================================
-- Migration 008 : Fix CHECK constraint notifications.type
-- Description : Ajoute 'relance' et 'anniversaire' aux valeurs
--               autorisées pour la colonne notifications.type
-- =============================================================

-- 1. Supprimer l'ancienne contrainte (si elle existe)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. Recréer avec les nouvelles valeurs autorisées
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('push', 'sms', 'email', 'relance', 'anniversaire'));

-- 3. Colonnes supplémentaires pour le suivi des relances
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}';

COMMENT ON COLUMN notifications.meta IS 'Métadonnées supplémentaires de la notification (ex: {cible: "dormants", seuil: 14})';
