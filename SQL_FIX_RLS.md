-- ─── Stamply — SQL à exécuter dans Supabase SQL Editor ──────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. BUCKET card-assets (si pas déjà créé)
-- ─────────────────────────────────────────────────────────────────────────────
-- Aller dans Supabase Dashboard → Storage → New bucket
--   Nom : card-assets
--   Public : OUI
--   File size limit : 5242880 (5MB)
--   Allowed MIME types : image/jpeg, image/png, image/webp

-- OU via SQL :
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('card-assets', 'card-assets', true, 5242880, '{image/jpeg,image/png,image/webp}');

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. POLICIES RLS pour card-assets
-- ─────────────────────────────────────────────────────────────────────────────

-- Permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Allow authenticated uploads to card-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'card-assets');

-- Permettre la lecture publique
CREATE POLICY "Allow public read on card-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'card-assets');

-- Permettre la suppression aux utilisateurs authentifiés
CREATE POLICY "Allow owner deletes on card-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'card-assets');

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. COLONNES CARTE PREMIUM (si pas déjà faites)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE commercants ADD COLUMN IF NOT EXISTS card_design TEXT DEFAULT NULL;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_background_image_url TEXT DEFAULT NULL;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_font_family TEXT DEFAULT 'sans';
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_text_color TEXT DEFAULT '#FFFFFF';
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_text_color_auto BOOLEAN DEFAULT true;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_overlay_opacity INTEGER DEFAULT 40;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_overlay_color TEXT DEFAULT '#000000';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. TAMPONS — La colonne points_recompense existe déjà = palier de tampons
--    Pas de migration nécessaire. Le code utilise :
--    - cartes.points = tampons actuels du client (incrémenté à chaque scan)
--    - commercants.points_recompense = palier (ex: 10 tampons = 1 récompense)
-- ─────────────────────────────────────────────────────────────────────────────
