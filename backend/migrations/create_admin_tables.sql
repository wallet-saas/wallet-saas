-- ═══════════════════════════════════════════════════════════════════════════════
-- STAMPLY — Migrations Admin
-- À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Table admin_logs pour tracer les actions admin
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- 2. Colonne is_active sur commercants (si elle n'existe pas déjà)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commercants' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE commercants ADD COLUMN is_active boolean DEFAULT true;
    -- Mettre à jour les existants
    UPDATE commercants SET is_active = true WHERE is_active IS NULL;
  END IF;
END $$;

-- 3. Index pour les recherches admin
CREATE INDEX IF NOT EXISTS idx_commercants_created_at ON commercants(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commercants_email ON commercants(email);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
