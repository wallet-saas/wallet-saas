-- ============================================
-- STAMPLY — Migration: Badges / Achievements
-- ============================================
-- Table client_badges : stocke les badges attribués aux clients

CREATE TABLE IF NOT EXISTS client_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carte_id UUID NOT NULL REFERENCES cartes(id) ON DELETE CASCADE,
  commercant_id UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
  badge_id VARCHAR(50) NOT NULL,
  badge_label VARCHAR(100) NOT NULL,
  badge_icon VARCHAR(10) DEFAULT '🏆',
  points_atribution INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_client_badges_carte ON client_badges(carte_id);
CREATE INDEX IF NOT EXISTS idx_client_badges_commercant ON client_badges(commercant_id);
CREATE INDEX IF NOT EXISTS idx_client_badges_badge_id ON client_badges(badge_id);

-- RLS
ALTER TABLE client_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commercants can view their client badges"
  ON client_badges FOR SELECT
  USING (commercant_id = auth.uid());

CREATE POLICY "Commercants can insert badges for their clients"
  ON client_badges FOR INSERT
  WITH CHECK (commercant_id = auth.uid());
