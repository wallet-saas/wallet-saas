const { supabase } = require('../config/supabase');
const googleWalletService = require('../services/googleWalletService');
const badgeService = require('../services/badgeService');

// Rate limiting en mémoire : Map<pass_serial_number, timestamp_last_scan>
const scanRateLimit = new Map();
const RATE_LIMIT_MS = 30 * 1000; // 30 secondes

/**
 * Scanner un QR code et incrémenter les points de fidélité
 * POST /api/scan
 * Protégé par authMiddleware (JWT commerçant requis)
 */
const scanQR = async (req, res) => {
  try {
    const { pass_serial_number } = req.body;
    const { id: commercantId } = req.commercant;

    if (!pass_serial_number) {
      return res.status(400).json({
        success: false,
        error: 'pass_serial_number requis.'
      });
    }

    // --- Rate limiting ---
    const now = Date.now();
    const lastScan = scanRateLimit.get(pass_serial_number);

    if (lastScan && now - lastScan < RATE_LIMIT_MS) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_MS - (now - lastScan)) / 1000);
      return res.status(429).json({
        success: false,
        error: 'Déjà scanné récemment.',
        retryAfterSeconds: remainingSeconds
      });
    }

    // --- Vérifier que la carte existe et appartient à ce commerçant ---
    const { data: carte, error: carteError } = await supabase
      .from('cartes')
      .select('id, pass_serial_number, points, commercant_id, actif')
      .eq('pass_serial_number', pass_serial_number)
      .eq('commercant_id', commercantId)
      .single();

    if (carteError || !carte) {
      return res.status(404).json({
        success: false,
        error: 'Carte non reconnue.'
      });
    }

    if (!carte.actif) {
      return res.status(403).json({
        success: false,
        error: 'Cette carte est désactivée.'
      });
    }

    // Récupérer le seuil de récompense du commerçant (défaut 10)
    const { data: commercant } = await supabase
      .from('commercants')
      .select('points_recompense')
      .eq('id', commercantId)
      .single();
    const seuil = commercant?.points_recompense || 10;

    // Logique de reset :
    // - Si les points actuels >= seuil → le client a déjà eu sa récompense,
    //   ce scan repart de 1 (nouveau cycle)
    // - Sinon → incrément normal
    const reset = carte.points >= seuil;
    const newPoints = reset ? 1 : carte.points + 1;
    const reward = !reset && newPoints === seuil; // vient juste d'atteindre le seuil
    const now_iso = new Date().toISOString();

    // --- Mise à jour des points + last_visit_at ---
    const { error: updateError } = await supabase
      .from('cartes')
      .update({
        points: newPoints,
        last_visit_at: now_iso,
        updated_at: now_iso
      })
      .eq('id', carte.id);

    if (updateError) {
      console.error('Erreur update cartes:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour des points.'
      });
    }

    // --- Insérer une ligne dans visites ---
    const { error: visiteError } = await supabase
      .from('visites')
      .insert([{
        commercant_id: commercantId,
        carte_id: carte.id,
        client_id: null, // anonyme par défaut (RGPD friendly)
        points_gagnes: 1,
        source: 'scan'
      }]);

    if (visiteError) {
      // Non bloquant : les points sont déjà crédités
      console.error('Erreur insertion visite (non bloquant):', visiteError);
    }

    // --- Mettre à jour la carte Google Wallet (best-effort, non-bloquant) ---
    googleWalletService.updateLoyaltyObjectPoints(pass_serial_number, newPoints);

    // --- Vérifier et attribuer des badges (non-bloquant) ---
    const newBadges = await badgeService.checkAndAssignBadges(carte.id, commercantId, newPoints);

    // --- Enregistrer le timestamp du scan pour le rate limiting ---
    scanRateLimit.set(pass_serial_number, now);

    // Nettoyage léger du Map si trop grand
    if (scanRateLimit.size > 10000) {
      for (const [key, ts] of scanRateLimit.entries()) {
        if (now - ts > RATE_LIMIT_MS) scanRateLimit.delete(key);
      }
    }

    const message = reward
      ? `🎉 Récompense débloquée ! (${seuil} points atteints)`
      : reset
        ? `Nouveau cycle ! Points remis à 1.`
        : 'Visite enregistrée !';

    return res.status(200).json({
      success: true,
      points: newPoints,
      seuil,
      reward,
      reset,
      badges: newBadges.map((b) => ({ id: b.id, label: b.label, icon: b.icon })),
      message
    });

  } catch (error) {
    console.error('Erreur scanQR:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du scan.'
    });
  }
};

/**
 * Récupérer l'historique des visites du commerçant
 * GET /api/scan/history
 */
const getScanHistory = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const limit = parseInt(req.query.limit) || 50;

    const { data: visites, error } = await supabase
      .from('visites')
      .select('id, points_gagnes, source, created_at, client_id')
      .eq('commercant_id', commercantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erreur récupération visites:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de l\'historique.'
      });
    }

    return res.status(200).json({
      success: true,
      count: visites.length,
      data: { visites }
    });

  } catch (error) {
    console.error('Erreur getScanHistory:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique.'
    });
  }
};

module.exports = { scanQR, getScanHistory };
