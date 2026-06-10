const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

// ─── Multer config (mémoire, pas de disque) ────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté (JPG, PNG, WebP uniquement)'));
    }
  },
});

const BUCKET = 'card-assets';

/**
 * POST /api/images/upload
 * Upload un fichier (image de fond ou logo) vers Supabase Storage.
 * Utilise la service role key du backend (contourne RLS).
 * Protégé par JWT.
 * 
 * multipart/form-data:
 *   - file: le fichier image
 *   - type: 'background' | 'logo'
 */
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const type = req.body.type || 'background';
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Aucun fichier fourni.' });
    }

    if (!['background', 'logo'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Type invalide (background ou logo).' });
    }

    // Nom fichier unique
    const ext = req.file.mimetype.split('/')[1] || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const fileName = `merchant_${commercantId}/${type}_${timestamp}_${random}.${ext}`;

    // Upload via Supabase Storage (service role = bypass RLS)
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, req.file.buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: req.file.mimetype,
      });

    if (error) {
      console.error('[images] Erreur Supabase Storage:', error);
      return res.status(500).json({ success: false, error: `Erreur upload: ${error.message}` });
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);

    // Sauvegarder l'URL dans le commercant selon le type
    const updateField = type === 'logo' ? 'carte_logo_url' : 'carte_background_image_url';
    const { error: updateError } = await supabase
      .from('commercants')
      .update({ [updateField]: urlData.publicUrl })
      .eq('id', commercantId);

    if (updateError) {
      console.error('[images] Erreur update commercant:', updateError);
    }

    res.json({
      success: true,
      data: {
        url: urlData.publicUrl,
        type,
      },
    });
  } catch (err) {
    console.error('[images] Erreur upload:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur lors de l\'upload.' });
  }
});

/**
 * GET /api/images/:commercantId
 * Sert le logo d'un commerçant.
 * Public — pas de JWT requis
 */
router.get('/:commercantId', async (req, res) => {
  try {
    const { commercantId } = req.params;

    const { data: commercant, error } = await supabase
      .from('commercants')
      .select('carte_logo_url, template_metier')
      .eq('id', commercantId)
      .single();

    if (error || !commercant) {
      return res.status(404).json({ success: false, error: 'Commerçant introuvable.' });
    }

    const selfUrl = req.protocol + '://' + req.get('host');
    const logo = commercant.carte_logo_url || '';
    
    const templateLogos = {
      boulangerie: 'https://placehold.co/200x200/D97706/ffffff?text=B',
      coiffeur: 'https://placehold.co/200x200/7C3AED/ffffff?text=C',
      restaurant: 'https://placehold.co/200x200/DC2626/ffffff?text=R',
      kine: 'https://placehold.co/200x200/059669/ffffff?text=K',
      garagiste: 'https://placehold.co/200x200/374151/ffffff?text=G',
    };

    const isSelfUrl = logo && (
      logo.startsWith(selfUrl)
      || logo.startsWith('/api/')
      || logo.includes('stamply-backend')
      || logo.includes('render.com')
      || logo.includes('localhost')
      || logo.includes('127.0.0.1')
      || logo.includes('/api/images/')
      || logo.includes('/wallet/')
    );

    if (logo.startsWith('http') && !isSelfUrl) {
      return res.redirect(302, logo);
    }

    const logoUrl = isSelfUrl
      ? (templateLogos[commercant.template_metier] || 'https://placehold.co/200x200/6366f1/ffffff?text=S')
      : (commercant.carte_logo_url || templateLogos[commercant.template_metier] || 'https://placehold.co/200x200/6366f1/ffffff?text=S');

    res.json({
      success: true,
      data: { logo_url: logoUrl, template_metier: commercant.template_metier },
    });
  } catch (err) {
    console.error('[images] Erreur:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération du logo.' });
  }
});

module.exports = router;
