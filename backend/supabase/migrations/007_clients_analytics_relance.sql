-- =============================================================
-- Migration 007 : Clients, Analytics & Relance
-- Description : Ajout des colonnes manquantes pour la capture
--               client, les notifications, et les paramètres
--               de relance automatique / anniversaire.
-- =============================================================

-- -------------------------------------------------------------
-- 1. TABLE clients
--    Colonnes pour la capture des informations client,
--    consentements et date d'inscription.
-- -------------------------------------------------------------
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS telephone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS date_naissance DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS consentement_email BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS consentement_sms BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS inscrit_le TIMESTAMPTZ DEFAULT now();

COMMENT ON COLUMN clients.email IS 'Adresse e-mail du client (capture depuis la fiche client)';
COMMENT ON COLUMN clients.telephone IS 'Numéro de téléphone du client';
COMMENT ON COLUMN clients.date_naissance IS 'Date de naissance pour les offres anniversaire';
COMMENT ON COLUMN clients.consentement_email IS 'Consentement RGPD pour les communications par e-mail';
COMMENT ON COLUMN clients.consentement_sms IS 'Consentement RGPD pour les communications par SMS';
COMMENT ON COLUMN clients.inscrit_le IS 'Date et heure d''inscription du client';

-- -------------------------------------------------------------
-- 2. TABLE cartes
--    Dernière notification envoyée pour cette carte et
--    copie locale des infos client (pour requêtes rapides).
--    (Note : les colonnes de notifications ont déjà été
--     ajoutées dans la migration 006, mais on les vérifie ici.)
-- -------------------------------------------------------------
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS last_notif_titre TEXT DEFAULT '';
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS last_notif_message TEXT DEFAULT '';
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS last_notif_sent_at TIMESTAMPTZ;
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS client_nom TEXT DEFAULT '';
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS client_email TEXT DEFAULT '';
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS client_telephone TEXT DEFAULT '';
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS client_date_naissance DATE;

COMMENT ON COLUMN cartes.last_notif_titre IS 'Titre de la dernière notification envoyée au client';
COMMENT ON COLUMN cartes.last_notif_message IS 'Corps de la dernière notification envoyée';
COMMENT ON COLUMN cartes.last_notif_sent_at IS 'Horodatage de la dernière notification';
COMMENT ON COLUMN cartes.client_nom IS 'Copie locale du nom du client (dédupliqué pour requêtes rapides)';
COMMENT ON COLUMN cartes.client_email IS 'Copie locale de l''e-mail du client';
COMMENT ON COLUMN cartes.client_telephone IS 'Copie locale du téléphone du client';
COMMENT ON COLUMN cartes.client_date_naissance IS 'Copie locale de la date de naissance du client';

-- -------------------------------------------------------------
-- 3. TABLE commercants
--    Paramètres de relance automatique, anniversaire et
--    type de programme de fidélité.
-- -------------------------------------------------------------
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS relance_auto BOOLEAN DEFAULT false;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS relance_jours INTEGER DEFAULT 14;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS anniversaire_auto BOOLEAN DEFAULT false;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS anniversaire_message TEXT DEFAULT 'Joyeux anniversaire ! 🎉 Profitez d''une offre spéciale pour votre journée.';
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS type_fidelite TEXT DEFAULT 'tampons';
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS type_fidelite_config JSONB DEFAULT '{}';

COMMENT ON COLUMN commercants.relance_auto IS 'Activer la relance automatique des clients inactifs';
COMMENT ON COLUMN commercants.relance_jours IS 'Nombre de jours d''inactivité avant relance automatique (défaut: 14)';
COMMENT ON COLUMN commercants.anniversaire_auto IS 'Activer l''envoi automatique d''un message d''anniversaire';
COMMENT ON COLUMN commercants.anniversaire_message IS 'Message personnalisé envoyé pour l''anniversaire du client';
COMMENT ON COLUMN commercants.type_fidelite IS 'Type de programme : tampons, points, visites, etc.';
COMMENT ON COLUMN commercants.type_fidelite_config IS 'Configuration JSON du programme de fidélité (règles, paliers, etc.)';
