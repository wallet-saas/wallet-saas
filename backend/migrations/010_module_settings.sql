-- ============================================================
-- STAMPLY — Colonnes modules personnalisation
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 🔔 NOTIFICATIONS
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS module_notifications BOOLEAN DEFAULT true;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS notif_max_par_jour INTEGER DEFAULT 3;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS notif_heure_debut INTEGER DEFAULT 8;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS notif_heure_fin INTEGER DEFAULT 22;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS notif_template_defaut TEXT DEFAULT 'Bonjour ! Une nouvelle offre vous attend 🎁';

-- ⭐ AVIS GOOGLE
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS avis_seuil_reponse INTEGER DEFAULT 3;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS avis_template_auto TEXT;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS avis_reponse_auto BOOLEAN DEFAULT false;

-- 🍽️ MENUS
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS menu_categories JSONB DEFAULT '["Entrées","Plats","Desserts","Boissons"]'::jsonb;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS menu_devise TEXT DEFAULT 'EUR';
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS menu_afficher_prix BOOLEAN DEFAULT true;

-- 🏷️ OFFRES FLASH
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS offres_duree_defaut INTEGER DEFAULT 7;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS offres_limite_client INTEGER DEFAULT 1;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS offres_notif_auto BOOLEAN DEFAULT true;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS offres_code_auto BOOLEAN DEFAULT true;

-- 📍 GÉOLOCALISATION
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS geoloc_message TEXT DEFAULT 'Passez nous voir !';
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS geoloc_heure_debut INTEGER DEFAULT 8;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS geoloc_heure_fin INTEGER DEFAULT 22;

-- 🤖 AVIS AUTOMATIQUES
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS auto_review_message TEXT;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS auto_review_seuil_etoiles INTEGER DEFAULT 4;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS auto_review_alerte_email BOOLEAN DEFAULT false;

-- 🏪 BOUTIQUES
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS module_boutiques BOOLEAN DEFAULT false;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS boutique_defaut_id UUID;

-- ============================================================
-- Vérification (optionnel — à commenter si tu veux)
-- ============================================================
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'commercants'
-- AND column_name IN (
--   'module_notifications','notif_max_par_jour','notif_heure_debut','notif_heure_fin','notif_template_defaut',
--   'avis_seuil_reponse','avis_template_auto','avis_reponse_auto',
--   'menu_categories','menu_devise','menu_afficher_prix',
--   'offres_duree_defaut','offres_limite_client','offres_notif_auto','offres_code_auto',
--   'geoloc_message','geoloc_heure_debut','geoloc_heure_fin',
--   'auto_review_message','auto_review_seuil_etoiles','auto_review_alerte_email',
--   'module_boutiques','boutique_defaut_id'
-- )
-- ORDER BY column_name;
