const { supabase } = require('../config/supabase');
const googleWalletService = require('../services/googleWalletService');
const appleWalletService = require('../services/appleWalletService');
const badgeService = require('../services/badgeService');
const autoReviewService = require('../services/autoReviewService');
const rewardService = require('../services/rewardService');
const qrCodeService = require('../services/qrCodeService');
const walletNotificationService = require('../services/walletNotificationService');
const carteTypeService = require('../services/carteTypeService');

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
    const { pass_serial_number, qr_string, montant, quantite, action } = req.body;
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
        .select('id, pass_serial_number, points, visites, solde, total_depense, statut_palier, coupon_utilise, commercant_id, actif')
        .eq('id', carteId)
        .eq('commercant_id', commercantId)
        .single();
      carte = data;
      if (error) carte = null;
    }

    if (!carte) {
      const { data, error } = await supabase
        .from('cartes')
        .select('id, pass_serial_number, points, visites, solde, total_depense, statut_palier, coupon_utilise, commercant_id, actif')
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

    if (carte.actif === false) {
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

    // --- Logique de fidélité selon le type de carte du commerçant ---
    const { data: commercant } = await supabase
      .from('commercants')
      .select('points_recompense, reward_config, carte_type, carte_type_config, nom_enseigne')
      .eq('id', commercantId)
      .single();

    const { type: carteType, config: typeConfig } = carteTypeService.getTypeConfig(commercant || {});
    const scanResult = carteTypeService.applyScan({
      type: carteType,
      config: typeConfig,
      carte,
      params: { montant, quantite, action },
    });

    if (!scanResult.ok) {
      // Erreur métier (montant manquant, solde insuffisant, coupon déjà utilisé…)
      scanRateLimit.delete(carte.id); // ne pas pénaliser un scan à corriger
      return res.status(400).json({ success: false, error: scanResult.error, carte_type: carteType });
    }

    const { error: updateError } = await supabase
      .from('cartes')
      .update(scanResult.updates)
      .eq('id', carte.id);

    if (updateError) {
      console.error('Erreur update cartes:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour de la carte.'
      });
    }

    const carteApres = { ...carte, ...scanResult.updates };
    const newTampons = carteApres.points || 0;
    const seuil = carteType === 'tampons' ? typeConfig.tampons_requis
      : carteType === 'points' ? typeConfig.points_recompense
      : null;
    const reward = seuil !== null && newTampons >= seuil;
    const reset = false;

    // --- Récupérer le client_id depuis la table clients via carte_id ---
    let clientId = null;
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('carte_id', carte.id)
      .single();
    if (clientData) clientId = clientData.id;

    // --- Insérer une ligne dans visites (seulement si client_id trouvé) ---
    if (clientId) {
      const { error: visiteError } = await supabase
        .from('visites')
        .insert([{
          commercant_id: commercantId,
          carte_id: carte.id,
          client_id: clientId,
          points_gagnes: (carteApres.points || 0) - (carte.points || 0),
          source: qrType === 'dynamic' ? 'qr_dynamic' : 'scan'
        }]);

      if (visiteError) {
        console.error('Erreur insertion visite (non bloquant):', visiteError);
      }
    } else {
      console.log('[Scan] Pas de client_id pour la carte', carte.id, '- visite non enregistrée dans visites');
    }

    // --- Mettre à jour la carte Google Wallet (best-effort) ---
    const displayApres = carteTypeService.displayFields({
      type: carteType, config: typeConfig, carte: carteApres, commercant,
    });
    googleWalletService.updateLoyaltyObjectPoints(carte.pass_serial_number, newTampons, {
      label: displayApres.header_label,
      value: displayApres.header_value,
    });

    // --- Mettre à jour la carte Apple Wallet via APNS (best-effort) ---
    appleWalletService.updatePoints(carte.pass_serial_number, newTampons);

    // NOTE : pas de sendToWalletCards ici. La mise à jour des points suffit :
    // - Apple : updatePoints() envoie le push APNS → le pass se rafraîchit et le
    //   changeMessage "Vous avez %@ points !" s'affiche en notification système.
    // - Google : les points se mettent à jour silencieusement (pas de TEXT_AND_NOTIFY,
    //   pour préserver le quota de 3 notifications/24h par carte pour les vraies offres).

    // --- Vérifier et attribuer des badges ---
    const newBadges = await badgeService.checkAndAssignBadges(carte.id, commercantId, newTampons);

    // --- Vérifier les récompenses (nouveau système configurable) ---
    const newRewards = await rewardService.checkRewardUnlocked(
      carte.id, commercantId, newTampons, null
    );

    // --- Programmer la notification d'avis automatique ---
    await autoReviewService.scheduleReviewNotification(carte.id, commercantId, newTampons);

    // --- Message de réponse ---
    let message = scanResult.resume || 'Visite enregistrée !';
    if (reward) message += ` — 🎉 Récompense disponible !`;
    if (newRewards && newRewards.length > 0) {
      message = newRewards.map(r => `🎁 ${r.label}`).join(' | ');
    }

    return res.status(200).json({
      success: true,
      qr_type: qrType,
      carte_type: carteType,
      resume: scanResult.resume,
      carte_etat: {
        points: carteApres.points || 0,
        solde: carteApres.solde || 0,
        total_depense: carteApres.total_depense || 0,
        statut_palier: carteApres.statut_palier || null,
        coupon_utilise: carteApres.coupon_utilise || false,
        visites: carteApres.visites || 0,
      },
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
