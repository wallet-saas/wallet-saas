-- ============================================
-- WALLET-SAAS — Schéma PostgreSQL (Supabase)
-- ============================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: commercants
-- ============================================
CREATE TABLE commercants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nom_enseigne VARCHAR(255) NOT NULL,
  telephone VARCHAR(20),
  adresse TEXT,
  ville VARCHAR(100),
  code_postal VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  google_place_id VARCHAR(255),
  template_metier VARCHAR(50) DEFAULT 'restaurateur',
  template_type VARCHAR(50),
  -- Modules activés (ON/OFF)
  module_fidelite BOOLEAN DEFAULT TRUE,
  module_avis_google BOOLEAN DEFAULT FALSE,
  module_geolocalisation BOOLEAN DEFAULT FALSE,
  module_menu_jour BOOLEAN DEFAULT FALSE,
  module_offres_flash BOOLEAN DEFAULT FALSE,
  -- Personnalisation carte
  carte_couleur_primaire VARCHAR(7) DEFAULT '#1E40AF',
  carte_couleur_secondaire VARCHAR(7) DEFAULT '#FFFFFF',
  carte_logo_url TEXT,
  carte_programme_nom VARCHAR(255),
  carte_recompense_description TEXT,
  -- Google Wallet
  wallet_class_configured BOOLEAN DEFAULT FALSE,
  -- Google Place
  google_place_url TEXT,
  qr_code_install_url TEXT,
  -- Abonnement
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  abonnement_statut VARCHAR(20) DEFAULT 'trial',
  abonnement_debut TIMESTAMPTZ,
  abonnement_fin TIMESTAMPTZ,
  -- Paramètres
  delai_notif_avis_minutes INTEGER DEFAULT 60,
  rayon_geoloc_metres INTEGER DEFAULT 200,
  points_par_visite INTEGER DEFAULT 1,
  points_recompense INTEGER DEFAULT 10,
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: cartes
-- ============================================
CREATE TABLE cartes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commercant_id UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
  pass_type VARCHAR(20) NOT NULL DEFAULT 'universal' CHECK (pass_type IN ('apple', 'google', 'universal')),
  pass_serial_number VARCHAR(255) UNIQUE NOT NULL,
  pass_url TEXT,
  qr_code_url TEXT,
  design_json JSONB,
  -- Points de fidélité
  points INTEGER DEFAULT 0,
  -- URLs Wallet
  google_wallet_url TEXT,
  apple_wallet_url TEXT,
  -- Métadonnées
  actif BOOLEAN DEFAULT TRUE,
  installed_at TIMESTAMPTZ,
  last_visit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: clients (porteurs de carte)
-- ============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commercant_id UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
  carte_id UUID REFERENCES cartes(id),
  device_token VARCHAR(255),
  platform VARCHAR(20) CHECK (platform IN ('ios', 'android')),
  points_fidelite INTEGER DEFAULT 0,
  nombre_visites INTEGER DEFAULT 0,
  derniere_visite TIMESTAMPTZ,
  statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'dormant', 'perdu')),
  consentement_rgpd BOOLEAN DEFAULT FALSE,
  consentement_geoloc BOOLEAN DEFAULT FALSE,
  consentement_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: visites
-- ============================================
CREATE TABLE visites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  commercant_id UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
  points_gagnes INTEGER DEFAULT 1,
  source VARCHAR(20) DEFAULT 'scan' CHECK (source IN ('scan', 'geoloc', 'manuel')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: notifications
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commercant_id UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
  titre VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) DEFAULT 'push' CHECK (type IN ('push', 'avis_google', 'offre_flash', 'geoloc', 'relance')),
  cible VARCHAR(20) DEFAULT 'tous' CHECK (cible IN ('tous', 'actifs', 'dormants', 'segment')),
  total_envoyes INTEGER DEFAULT 0,
  total_ouverts INTEGER DEFAULT 0,
  planifiee_pour TIMESTAMPTZ,
  envoyee BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: avis
-- ============================================
CREATE TABLE avis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commercant_id UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  source VARCHAR(20) DEFAULT 'google' CHECK (source IN ('google', 'interne')),
  note INTEGER CHECK (note >= 1 AND note <= 5),
  contenu TEXT,
  reponse_suggeree TEXT,
  reponse_envoyee TEXT,
  reponse_validee BOOLEAN DEFAULT FALSE,
  google_review_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: menus (module optionnel)
-- ============================================
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commercant_id UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  prix DECIMAL(8, 2),
  categorie VARCHAR(100),
  disponible BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: offres (offres flash)
-- ============================================
CREATE TABLE offres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commercant_id UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  code_promo VARCHAR(50),
  reduction_pct NUMERIC(5,2),
  reduction_montant NUMERIC(8,2),
  date_debut TIMESTAMPTZ DEFAULT NOW(),
  date_fin TIMESTAMPTZ,
  actif BOOLEAN DEFAULT TRUE,
  total_envoyes INTEGER DEFAULT 0,
  total_utilises INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offres_commercant ON offres(commercant_id);

-- ============================================
-- INDEX pour performance
-- ============================================
CREATE INDEX idx_cartes_commercant ON cartes(commercant_id);
CREATE INDEX idx_clients_commercant ON clients(commercant_id);
CREATE INDEX idx_clients_statut ON clients(statut);
CREATE INDEX idx_visites_client ON visites(client_id);
CREATE INDEX idx_visites_commercant ON visites(commercant_id);
CREATE INDEX idx_visites_created ON visites(created_at);
CREATE INDEX idx_notifications_commercant ON notifications(commercant_id);
CREATE INDEX idx_avis_commercant ON avis(commercant_id);

-- ============================================
-- TRIGGER: updated_at automatique
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_commercants_updated BEFORE UPDATE ON commercants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_cartes_updated BEFORE UPDATE ON cartes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_clients_updated BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_menus_updated BEFORE UPDATE ON menus FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS (Row Level Security) pour Supabase
-- ============================================
ALTER TABLE commercants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE avis ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE offres ENABLE ROW LEVEL SECURITY;
