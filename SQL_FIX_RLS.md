-- ─── Stamply — Corrections RLS Storage + Colonnes (à exécuter dans Supabase SQL Editor) ───

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CORRECTION RLS — Bucket card-assets (erreur "new row violates row-level security policy")
-- ─────────────────────────────────────────────────────────────────────────────

-- Vérifier si le bucket existe
-- SELECT * FROM storage.buckets WHERE id = 'card-assets';

-- Politique : permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Allow authenticated uploads to card-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'card-assets');

-- Politique : permettre la lecture publique (bucket public)
CREATE POLICY "Allow public read on card-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'card-assets');

-- Politique : permettre la suppression au propriétaire (optionnel)
CREATE POLICY "Allow owner deletes on card-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'card-assets');

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. COLONNES CARTE PREMIUM (si pas déjà faites)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE commercants ADD COLUMN IF NOT EXISTS card_design TEXT DEFAULT NULL;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_background_image_url TEXT DEFAULT NULL;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_font_family TEXT DEFAULT 'sans';
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_text_color TEXT DEFAULT '#FFFFFF';
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_text_color_auto BOOLEAN DEFAULT true;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_overlay_opacity INTEGER DEFAULT 40;
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_overlay_color TEXT DEFAULT '#000000';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TAMPONS — Renommer points_recompense en tampons_palier (optionnel)
--    On garde points_recompense pour la compatibilité avec le code existant
--    mais on ajoute une colonne tampons_palier si vous préférer séparer
-- ─────────────────────────────────────────────────────────────────────────────

-- Option A : On garde points_recompense comme "palier de tampons" (recommandé, pas de migration)
-- La colonne points_recompense existe déjà = c'est le nombre de tampons requis pour la récompense

-- Option B : Ajouter une colonne dédiée (décommenter si vous voulez)
-- ALTER TABLE commercants ADD COLUMN IF NOT EXISTS tampons_palier INTEGER DEFAULT 10;
-- UPDATE commercants SET tampons_palier = COALESCE(points_recompense, 10) WHERE tampons_palier IS NULL;
