-- ─── Stamply — Colonnes carte premium (à exécuter dans Supabase SQL Editor) ───

-- Colonnes pour le design premium de la carte de fidélité
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS card_design TEXT DEFAULT NULL;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_background_image_url TEXT DEFAULT NULL;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_font_family TEXT DEFAULT 'sans';
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_text_color TEXT DEFAULT '#FFFFFF';
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_text_color_auto BOOLEAN DEFAULT true;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_tier_name TEXT DEFAULT 'Gold';
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_tier_color TEXT DEFAULT '#FFD700';
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_overlay_opacity INTEGER DEFAULT 40;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_overlay_color TEXT DEFAULT '#000000';

-- ─── Supabase Storage — Bucket pour les images de carte ─────────────────────
-- À créer dans Supabase Dashboard → Storage → New bucket :
--   Nom : card-assets
--   Public : OUI
--   File size limit : 5242880 (5MB)
--   Allowed MIME types : image/jpeg, image/png, image/webp
--
-- OU via SQL (si vous avez accès à l'admin API) :
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('card-assets', 'card-assets', true, 5242880, '{image/jpeg,image/png,image/webp}');

-- ─── RLS Policies pour card-assets ───────────────────────────────────────────
-- Permettre aux commerçants authentifiés d'uploader dans leur dossier
-- CREATE POLICY "Commerçants peuvent uploader leurs images"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'card-assets' AND (storage.foldername(name))[1] = 'merchant_' || auth.uid());

-- Permettre à tous de lire les images (bucket public)
-- CREATE POLICY "Images de carte publiques"
-- ON storage.objects FOR SELECT TO public
-- USING (bucket_id = 'card-assets');
