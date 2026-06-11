const { supabase } = require('../config/supabase');
const googleWalletService = require('../services/googleWalletService');
const badgeService = require('../services/badgeService');
const autoReviewService = require('../services/autoReviewService');
const rewardService = require('../services/rewardService');
const qrCodeService = require('../services/qrCodeService');

// Rate limiting en mémoire : Map<carte_id, timestamp_last_scan>
const scanRateLimit = new Map();
const RATE_LIMIT_MS = 30 * 1000; // 30 secondes

/**
 * Scanner un QR code et incrémenter les points de fidélité
 * POST /api/scan
 * Protégé par authMiddleware (JWT commerçant requis)
 */
const scanQR = async (req, res) => {
  try {
    const { pass_serial_number, qr_string } = req.body;
    const { id: commercantId } = req.commercant;

    if (!pass_serial_number && !qr_string) {
      return res.status(400).json({
        success: false,
        error: 'pass_serial_number ou qr_string requis.'
      });
    }

    let carteId = null;
    let passSerialNumber = pass_serial_number;
    let qrType = 'static';

    // Si c'est un QR code dynamique, le vérifier d'abord
    if (qr_string) {
      const qrResult = qrCodeService.verifyDynamicQR(qr_string);
      if (qrResult.valid) {
        carteId = qrResult.carteId;
        passSerialNumber = qrResult.passSerialNumber;
        qrType = 'dynamic';
      } else if (qrResult.expired && qrResult.carteId) {
        // QR expiré mais on peut quand même identifier la carte
        carteId = qrResult.carteId;
        passSerialNumber = qrResult.passSerialNumber;
        qrType = 'expired';
      } else {
        // Essayer comme QR statique (pass_serial_number direct)
        passSerialNumber = qr_string;
        qrType = 'static_fallback';
      }
    }

    // --- Vérifier que la carte existe et appartient à ce commerçant ---
    let carte;
    if (carteId) {
      const { data, error } = await supabase
        .from('cartes')
        .select('id, pass_serial_number, points, commercant_id, actif')
        .eq('id', carteId)
        .eq('commercant_id', commercantId)
        .single();
      carte = data;
      if (error) carte = null;
    }

    if (!carte) {
      const { data, error } = await supabase
        .from('cartes')
        .select('id, pass_serial_number, points, commercant_id, actif')
        .eq('pass_serial_number', passSerialNumber)
        .eq('commercant_id', commercantId)
        .single();
      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: 'Carte non reconnue.'
        });
      }
      carte = data;
    }

    if (!carte.actif) {
      return res.status(403).json({
        success: false,
        error: 'Cette carte est désactivée.'
      });
    }

    // --- Rate limiting (par carte_id) ---
    const now = Date.now();
    const lastScan = scanRateLimit.get(carte.id);
    if (lastScan && now - lastScan < RATE_LIMIT_MS) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_MS - (now - lastScan)) / 1000);
      return res.status(429).json({
        success: false,
        error: 'Déjà scanné récemment.',
        retryAfterSeconds: remainingSeconds
      });
    }
    scanRateLimit.set(carte.id, now);

    // Nettoyage du Map si trop grand
    if (scanRateLimit.size > 10000) {
      for (const [key, ts] of scanRateLimit.entries()) {
        if (now - ts > RATE_LIMIT_MS) scanRateLimit.delete(key);
      }
    }

    // --- Calcul des tampons et récompenses ---
    const { data: commercant } = await supabase
      .from('commercants')
      .select('points_recompense, reward_config')
      .eq('id', commercantId)
      .single();

    const rewardConfig = commercant?.reward_config || {};
    const seuil = commercant?.points_recompense || 10;
    const now_iso = new Date().toISOString();

    // Logique de reset via config récompenses
    const autoReset = rewardConfig.auto_reset !== false;
    const maxNiveau = Math.max(
      rewardConfig.visites_recompense_1 || 0,
      rewardConfig.visites_recompense_2 || 0,
      rewardConfig.visites_recompense_3 || 0,
      seuil
    );

    // carte.points = nombre de tampons actuels
    const tamponsActuels = carte.points || 0;
    const reset = autoReset && tamponsActuels >= maxNiveau;
    const newTampons = reset ? 1 : tamponsActuels + 1;
    const reward = !reset && newTampons === seuil;

    // --- Mise à jour des tampons ---
    const { error: updateError } = await supabase
      .from('cartes')
      .update({
        points: newTampons,
        last_visit_at: now_iso,
        updated_at: now_iso
      })
      .eq('id', carte.id);

    if (updateError) {
      console.error('Erreur update cartes:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour des tampons.'
      });
    }

    // --- Insérer une ligne dans visites ---
    const { error: visiteError } = await supabase
      .from('visites')
      .insert([{
        commercant_id: commercantId,
        carte_id: carte.id,
        client_id: null,
        points_gagnes: 1,
        source: qrType === 'dynamic' ? 'qr_dynamic' : 'scan'
      }]);

    if (visiteError) {
      console.error('Erreur insertion visite (non bloquant):', visiteError);
    }

    // --- Mettre à jour la carte Google Wallet (best-effort) ---
    googleWalletService.updateLoyaltyObjectPoints(carte.pass_serial_number, newTampons);

    // --- Vérifier et attribuer des badges ---
    const newBadges = await badgeService.checkAndAssignBadges(carte.id, commercantId, newTampons);

    // --- Vérifier les récompenses (nouveau système configurable) ---
    const newRewards = await rewardService.checkRewardUnlocked(
      carte.id, commercantId, newTampons, null
    );

    // --- Programmer la notification d'avis automatique ---
    await autoReviewService.scheduleReviewNotification(carte.id, commercantId, newTampons);

    // --- Message de réponse ---
    let message = reward
      ? `🎉 Récompense débloquée ! (${seuil} tampons atteints)`
      : reset
        ? `Nouveau cycle ! Tampons remis à 1.`
        : 'Visite enregistrée !';

    if (newRewards && newRewards.length > 0) {
      message = newRewards.map(r => `🎁 ${r.label}`).join(' | ');
    }

    return res.status(200).json({
      success: true,
      qr_type: qrType,
      tampons: newTampons,
      seuil,
      reward,
      reset,
      qr_expired: qrType === 'expired',
      badges: newBadges.map((b) => ({ id: b.id, label: b.label, icon: b.icon })),
      rewards: newRewards?.map(r => ({
        niveau: r.niveau,
        label: r.label,
        action: r.action,
        valeur: r.valeur,
        code_promo: r.code_genere || null,
        points_bonus: r.points_bonus,
      })) || [],
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
      .select('id, points_gagnes, source, carte_id, commercant_id')
      .eq('commercant_id', commercantId)
      .order('id', { ascending: false })
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
