-- ============================================
-- STAMPLY — Migration: Multi-commerçant
-- ============================================
-- Permet à un commerçant de gérer plusieurs boutiques

-- 1. Table boutiques (une boutique = un emplacement physique)
CREATE TABLE IF NOT EXISTS boutiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commercant_id UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  adresse TEXT,
  ville VARCHAR(100),
  code_postal VARCHAR(10),
  telephone VARCHAR(20),
  email VARCHAR(255),
  google_place_url TEXT,
  google_place_id VARCHAR(255),
  carte_couleur_primaire VARCHAR(7) DEFAULT '#6366f1',
  carte_couleur_secondaire VARCHAR(7) DEFAULT '#764ba2',
  carte_programme_nom VARCHAR(255),
  carte_recompense_description TEXT,
  points_recompense INTEGER DEFAULT 10,
  logo_url TEXT,
  template_type VARCHAR(50),
  module_avis_google BOOLEAN DEFAULT true,
  delai_notif_avis_minutes INTEGER DEFAULT 60,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boutiques_commercant ON boutiques(commercant_id);
CREATE INDEX IF NOT EXISTS idx_boutiques_actif ON boutiques(actif);

-- 2. Ajouter colonne boutique_id aux tables existantes
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS boutique_id UUID REFERENCES boutiques(id) ON DELETE SET NULL;
ALTER TABLE visites ADD COLUMN IF NOT EXISTS boutique_id UUID REFERENCES boutiques(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS boutique_id UUID REFERENCES boutiques(id) ON DELETE SET NULL;
ALTER TABLE offres ADD COLUMN IF NOT EXISTS boutique_id UUID REFERENCES boutiques(id) ON DELETE SET NULL;
ALTER TABLE avis ADD COLUMN IF NOT EXISTS boutique_id UUID REFERENCES boutiques(id) ON DELETE SET NULL;
ALTER TABLE menus ADD COLUMN IF NOT EXISTS boutique_id UUID REFERENCES boutiques(id) ON DELETE SET NULL;
ALTER TABLE client_badges ADD COLUMN IF NOT EXISTS boutique_id UUID REFERENCES boutiques(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cartes_boutique ON cartes(boutique_id);
CREATE INDEX IF NOT EXISTS idx_visites_boutique ON visites(boutique_id);
CREATE INDEX IF NOT EXISTS idx_notifications_boutique ON notifications(boutique_id);
CREATE INDEX IF NOT EXISTS idx_offres_boutique ON offres(boutique_id);
CREATE INDEX IF NOT EXISTS idx_avis_boutique ON avis(boutique_id);

-- 3. Trigger updated_at pour boutiques
DROP TRIGGER IF EXISTS tr_boutiques_updated ON boutiques;
CREATE TRIGGER tr_boutiques_updated BEFORE UPDATE ON boutiques
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. RLS
ALTER TABLE boutiques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commercants can manage their boutiques"
  ON boutiques FOR ALL
  USING (commercant_id = auth.uid());

-- 5. Migrer les données existantes : créer une boutique par commerçant
-- (à exécuter manuellement après vérification)
-- INSERT INTO boutiques (commercant_id, nom, carte_couleur_primaire, carte_programme_nom, points_recompense, google_place_url, google_place_id, module_avis_google, delai_notif_avis_minutes)
-- SELECT id, nom_enseigne, carte_couleur_primaire, carte_programme_nom, points_recompense, google_place_url, google_place_id, module_avis_google, delai_notif_avis_minutes
-- FROM commercants
-- WHERE NOT EXISTS (SELECT 1 FROM boutiques WHERE boutiques.commercant_id = commercants.id);
