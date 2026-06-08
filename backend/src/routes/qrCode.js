/**
 * Stamply — Routes QR Code Dynamique
 * 
 * GET  /api/qr/generate/:carteId   → Générer un QR code dynamique
 * POST /api/qr/verify              → Vérifier un QR code scanné
 * GET  /api/qr/page/:carteId      → Page web avec QR code (pour le client)
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');
const qrCodeService = require('../services/qrCodeService');
const authMiddleware = require('../middleware/authMiddleware');

// ============================================
// GET /api/qr/generate/:carteId
// Générer un QR code dynamique pour une carte
// ============================================
router.get('/generate/:carteId', authMiddleware, async (req, res) => {
  try {
    const { carteId } = req.params;
    const { id: commercantId } = req.commercant;

    // Récupérer la carte
    const { data: carte, error } = await supabase
      .from('cartes')
      .select('id, pass_serial_number, commercant_id, actif')
      .eq('id', carteId)
      .eq('commercant_id', commercantId)
      .single();

    if (error || !carte) {
      return res.status(404).json({ success: false, error: 'Carte non trouvée' });
    }

    if (!carte.actif) {
      return res.status(403).json({ success: false, error: 'Carte désactivée' });
    }

    // Générer le QR code dynamique
    const qr = qrCodeService.generateDynamicQR(carte.id, carte.pass_serial_number);

    res.json({
      success: true,
      data: {
        qr_string: qr.qrString,
        qr_data: qr.qrData,
        expires_at: qr.expiresAt,
        validity_seconds: qr.validitySeconds,
      },
    });
  } catch (err) {
    console.error('GET /qr/generate/:carteId error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// POST /api/qr/verify
// Vérifier un QR code scanné (utilisé par le scan QR du commerçant)
// ============================================
router.post('/verify', [
  body('qr_string').isString().isLength({ min: 10 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { qr_string } = req.body;

    // Essayer de vérifier comme QR dynamique
    const result = qrCodeService.verifyDynamicQR(qr_string);

    if (result.valid) {
      // QR dynamique valide — retourner l'ID de carte et le serial
      return res.json({
        success: true,
        type: 'dynamic',
        data: {
          carte_id: result.carteId,
          pass_serial_number: result.passSerialNumber,
          timestamp: result.timestamp,
        },
      });
    }

    // Si le QR est expiré mais qu'on a les infos, on peut quand même identifier la carte
    if (result.expired && result.carteId) {
      return res.status(410).json({
        success: false,
        type: 'expired',
        error: result.error,
        data: {
          carte_id: result.carteId,
          pass_serial_number: result.passSerialNumber,
        },
      });
    }

    // Essayer comme QR statique (pass_serial_number direct)
    const { data: carte, error } = await supabase
      .from('cartes')
      .select('id, pass_serial_number, commercant_id, actif')
      .eq('pass_serial_number', qr_string)
      .single();

    if (carte && carte.actif) {
      return res.json({
        success: true,
        type: 'static',
        data: {
          carte_id: carte.id,
          pass_serial_number: carte.pass_serial_number,
        },
      });
    }

    res.status(404).json({
      success: false,
      error: result.error || 'QR code non reconnu',
    });
  } catch (err) {
    console.error('POST /qr/verify error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// GET /api/qr/page/:carteId
// Page web avec QR code pour le client
// ============================================
router.get('/page', async (req, res) => {
  try {
    // Cette page est accessible via le wallet Google/Apple
    // Le client ouvre le lien → voit son QR code → le montre au commerçant
    const { carte_id, serial } = req.query;

    if (!carte_id && !serial) {
      return res.status(400).send(renderQRErrorPage('Paramètre manquant'));
    }

    let carte;
    if (carte_id) {
      const { data } = await supabase
        .from('cartes')
        .select('id, pass_serial_number, commercant_id, points, actif')
        .eq('id', carte_id)
        .single();
      carte = data;
    } else {
      const { data } = await supabase
        .from('cartes')
        .select('id, pass_serial_number, commercant_id, points, actif')
        .eq('pass_serial_number', serial)
        .single();
      carte = data;
    }

    if (!carte) {
      return res.status(404).send(renderQRErrorPage('Carte non trouvée'));
    }

    if (!carte.actif) {
      return res.status(403).send(renderQRErrorPage('Carte désactivée'));
    }

    // Générer le QR code
    const qr = qrCodeService.generateDynamicQR(carte.id, carte.pass_serial_number);

    res.send(renderQRPage(qr, carte));
  } catch (err) {
    console.error('GET /qr/page error:', err);
    res.status(500).send(renderQRErrorPage('Erreur serveur'));
  }
});

// ============================================
// FONCTIONS DE RENDU HTML
// ============================================

function renderQRPage(qr, carte) {
  const validityMin = Math.floor(qr.validitySeconds / 60);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Votre carte Stamply</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 20px;
      padding: 30px;
      width: 100%;
      max-width: 360px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
    }
    .logo { font-size: 24px; font-weight: 700; color: #667eea; margin-bottom: 5px; }
    .subtitle { font-size: 13px; color: #999; margin-bottom: 20px; }
    .qr-container {
      background: #f8f9fa;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 15px;
    }
    #qrcode { display: flex; justify-content: center; }
    #qrcode canvas, #qrcode img { border-radius: 8px; }
    .points { font-size: 36px; font-weight: 700; color: #333; margin: 10px 0 5px; }
    .points-label { font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
    .info { font-size: 12px; color: #999; margin-top: 15px; }
    .timer { font-size: 14px; color: #e74c3c; margin-top: 10px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Stamply</div>
    <div class="subtitle">Montrez ce QR code au commerçant</div>
    <div class="qr-container">
      <div id="qrcode"></div>
    </div>
    <div class="points">${carte.points}</div>
    <div class="points-label">points</div>
    <div class="timer" id="timer">Expire dans ${validityMin} min</div>
    <div class="info">Le QR code se renouvelle automatiquement</div>
  </div>
  <script>
    var qrString = ${JSON.stringify(qr.qrString)};
    var expiresAt = new Date(${JSON.stringify(qr.expiresAt)}).getTime();
    var validityMs = ${qr.validitySeconds * 1000};

    function generateQR() {
      // Regénérer via l'API
      fetch('/api/qr/generate/${carte.id}')
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            var data = res.data;
            QRCode.toCanvas(document.createElement('canvas'), data.qr_string, {
              width: 220, margin: 1,
              color: { dark: '#333333', light: '#ffffff' }
            }, function(err, canvas) {
              if (!err) {
                var container = document.getElementById('qrcode');
                container.innerHTML = '';
                container.appendChild(canvas);
              }
            });
          }
        })
        .catch(() => {});
    }

    function updateTimer() {
      var now = Date.now();
      var remaining = expiresAt - now;
      if (remaining <= 0) {
        document.getElementById('timer').textContent = 'QR expiré — renouvellement...';
        generateQR();
        return;
      }
      var min = Math.floor(remaining / 60000);
      var sec = Math.floor((remaining % 60000) / 1000);
      document.getElementById('timer').textContent = 'Expire dans ' + min + ' min ' + sec + 's';
    }

    // Générer le QR au chargement
    QRCode.toCanvas(document.createElement('canvas'), qrString, {
      width: 220, margin: 1,
      color: { dark: '#333333', light: '#ffffff' }
    }, function(err, canvas) {
      if (!err) {
        var container = document.getElementById('qrcode');
        container.innerHTML = '';
        container.appendChild(canvas);
      }
    });

    // Timer toutes les secondes
    setInterval(updateTimer, 1000);

    // Renouvellement automatique 10s avant expiration
    setTimeout(function() {
      location.reload();
    }, ${qr.validitySeconds * 1000} - 10000);
  </script>
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
</body>
</html>`;
}

function renderQRErrorPage(message) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Erreur — Stamply</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #f8f9fa;
      display: flex; align-items: center; justify-content: center; min-height: 100dvh; }
    .msg { background: white; padding: 40px; border-radius: 16px; text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    h1 { color: #e74c3c; margin-bottom: 10px; }
    p { color: #666; }
  </style>
</head>
<body><div class="msg"><h1>⚠️</h1><p>${message}</p></div></body>
</html>`;
}

module.exports = router;
