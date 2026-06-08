-- ============================================
-- STAMPLY V2 — Migrations SQL
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABLE: auto_review_settings
-- Paramètres d'avis automatique par commerçant
-- ============================================
CREATE TABLE IF NOT EXISTS auto_review_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commercant_id UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
  boutique_id UUID REFERENCES boutiques(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT true,
  delai_minutes INTEGER DEFAULT 1440, -- 24h par défaut
  google_place_url TEXT,
  message_personnalise TEXT DEFAULT 'Merci de laisser un avis sur votre visite !',
  seuil_etoiles INTEGER DEFAULT 4, -- ≥4 → Google, <4 → feedback interne
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_auto_review_settings_commercant_boutique
  ON auto_review_settings(commercant_id, boutique_id);

-- RLS
ALTER TABLE auto_review_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commercants can manage their own review settings"
  ON auto_review_settings
  FOR ALL
  USING (commercant_id = auth.uid());

-- ============================================
-- 2. TABLE: review_notifications
-- Tracking des notifications d'avis (1 par client, pas de spam)
-- ============================================
CREATE TABLE IF NOT EXISTS review_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  commercant_id UUID NOT NULL,
  boutique_id UUID,
  status TEXT DEFAULT 'pending', -- pending, sent, opened, completed, dismissed
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_notifications_client
  ON review_notifications(client_id, commercant_id, status);

CREATE INDEX IF NOT EXISTS idx_review_notifications_pending
  ON review_notifications(status, scheduled_at)
  WHERE status = 'pending';

-- RLS
ALTER TABLE review_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commercants can view their review notifications"
  ON review_notifications
  FOR SELECT
  USING (commercant_id = auth.uid());

-- ============================================
-- 3. COLONNE: feedback_interne dans avis
-- Pour stocker les retours négatifs (< 4 étoiles)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'avis' AND column_name = 'feedback_interne'
  ) THEN
    ALTER TABLE avis ADD COLUMN feedback_interne TEXT;
  END IF;
END $$;

-- ============================================
-- 4. TABLE: boutiques (multi-commerçant)
-- ============================================
CREATE TABLE IF NOT EXISTS boutiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commercant_id UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  adresse TEXT,
  ville TEXT,
  code_postal TEXT,
  telephone TEXT,
  email TEXT,
  categorie TEXT,
  google_place_id TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boutiques_commercant
  ON boutiques(commercant_id);

-- RLS
ALTER TABLE boutiques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commercants can manage their own boutiques"
  ON boutiques
  FOR ALL
  USING (commercant_id = auth.uid());

-- ============================================
-- 5. COLONNE: boutique_id dans les tables existantes
-- Pour lier les données à une boutique spécifique
-- ============================================

-- cartes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cartes' AND column_name = 'boutique_id'
  ) THEN
    ALTER TABLE cartes ADD COLUMN boutique_id UUID REFERENCES boutiques(id) ON DELETE SET NULL;
  END IF;
END $$;

-- visites
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visites' AND column_name = 'boutique_id'
  ) THEN
    ALTER TABLE visites ADD COLUMN boutique_id UUID REFERENCES boutiques(id) ON DELETE SET NULL;
  END IF;
END $$;

-- offres
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offres' AND column_name = 'boutique_id'
  ) THEN
    ALTER TABLE offres ADD COLUMN boutique_id UUID REFERENCES boutiques(id) ON DELETE SET NULL;
  END IF;
END $$;

-- avis
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'avis' AND column_name = 'boutique_id'
  ) THEN
    ALTER TABLE avis ADD COLUMN boutique_id UUID REFERENCES boutiques(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- 6. TABLE: badges (achievements)
-- ============================================
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  commercant_id UUID NOT NULL,
  boutique_id UUID,
  type TEXT NOT NULL, -- 'visite_1', 'visite_5', 'visite_10', 'visite_25', 'visite_50'
  nom TEXT NOT NULL,
  description TEXT,
  icone TEXT,
  date_obtention TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_badges_client
  ON badges(client_id, commercant_id);

-- RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own badges"
  ON badges
  FOR SELECT
  USING (client_id = auth.uid());

-- ============================================
-- 7. FONCTION: Mise à jour automatique de updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour les tables avec updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_auto_review_settings_updated_at') THEN
    CREATE TRIGGER update_auto_review_settings_updated_at
      BEFORE UPDATE ON auto_review_settings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_boutiques_updated_at') THEN
    CREATE TRIGGER update_boutiques_updated_at
      BEFORE UPDATE ON boutiques
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- FIN DES MIGRATIONS
-- ============================================
