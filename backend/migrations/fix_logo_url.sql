-- ============================================
-- STAMPLY — Migration: Fix carte_logo_url boucle infinie
-- ============================================
-- Problème: certains commercants ont un carte_logo_url qui pointe vers
-- /api/images/:commercantId, créant une boucle de redirection 302.
-- Solution: vider les URLs qui pointent vers notre propre API.

UPDATE commercants
SET carte_logo_url = NULL
WHERE carte_logo_url LIKE '%/api/images/%'
   OR carte_logo_url LIKE '%stamply-backend%'
   OR carte_logo_url LIKE '%localhost%';

-- Vérifier le résultat
SELECT id, nom, carte_logo_url FROM commercants WHERE carte_logo_url IS NOT NULL;
