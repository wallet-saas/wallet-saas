const express = require('express');
const router = express.Router();
const { scanQR, getScanHistory } = require('../controllers/scanController');
const authMiddleware = require('../middleware/authMiddleware');
const { scanRateLimiter } = require('../middleware/rateLimiter');
const { scanValidation, handleValidationErrors } = require('../middleware/validation');

/**
 * @route   POST /api/scan
 * @desc    Scanner une carte QR et incrémenter les points de fidélité
 * @access  Private (JWT commerçant requis)
 */
router.post('/', authMiddleware, scanRateLimiter, scanValidation, handleValidationErrors, scanQR);

/**
 * @route   GET /api/scan/history
 * @desc    Historique des scans du commerçant
 * @access  Private (JWT commerçant requis)
 */
router.get('/history', authMiddleware, getScanHistory);

/**
 * @route   GET /api/scan/page
 * @desc    Interface de scan caméra (HTML standalone)
 * @access  Public (auth via localStorage JWT dans le navigateur)
 */
router.get('/page', (req, res) => {
  res.send(getScanPage());
});

/**
 * Génère la page HTML de scan caméra avec jsQR
 */
function getScanPage() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Scanner une carte — Stamply</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f0f0f;
      color: #fff;
      height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    /* --- AUTH SCREEN --- */
    #auth-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.2rem;
      padding: 2rem;
      width: 100%;
      max-width: 400px;
    }
    #auth-screen h1 { font-size: 1.6rem; text-align: center; }
    #auth-screen p { font-size: 0.95rem; color: #aaa; text-align: center; }
    #auth-screen input {
      width: 100%;
      padding: 0.9rem 1rem;
      border-radius: 12px;
      border: 1px solid #333;
      background: #1c1c1e;
      color: #fff;
      font-size: 1rem;
    }
    #auth-screen input::placeholder { color: #666; }
    #auth-btn {
      width: 100%;
      padding: 0.9rem;
      border-radius: 12px;
      background: #5856D6;
      color: white;
      font-size: 1rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
    }
    #auth-btn:active { opacity: 0.8; }
    #auth-error { color: #ff453a; font-size: 0.9rem; }

    /* --- SCANNER SCREEN --- */
    #scanner-screen { display: none; width: 100%; height: 100dvh; position: relative; }

    #video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Viseur */
    #viewfinder {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -60%);
      width: 240px;
      height: 240px;
      border: 3px solid rgba(255,255,255,0.8);
      border-radius: 20px;
      box-shadow: 0 0 0 9999px rgba(0,0,0,0.5);
    }
    #viewfinder::before,
    #viewfinder::after {
      content: '';
      position: absolute;
      width: 36px;
      height: 36px;
      border-color: #5856D6;
      border-style: solid;
    }
    #viewfinder::before { top: -3px; left: -3px; border-width: 4px 0 0 4px; border-radius: 4px 0 0 0; }
    #viewfinder::after  { bottom: -3px; right: -3px; border-width: 0 4px 4px 0; border-radius: 0 0 4px 0; }

    #hint {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, calc(-60% + 140px));
      color: rgba(255,255,255,0.85);
      font-size: 0.9rem;
      text-align: center;
      width: 260px;
    }

    /* Header */
    #scanner-header {
      position: absolute;
      top: 0; left: 0; right: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.2rem 1.2rem;
      background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
    }
    #scanner-title { font-size: 1.1rem; font-weight: 600; }
    #logout-btn {
      background: rgba(255,255,255,0.15);
      border: none;
      color: white;
      padding: 0.4rem 0.8rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
    }

    /* --- OVERLAY RÉSULTAT --- */
    #overlay {
      display: none;
      position: absolute;
      inset: 0;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      gap: 1rem;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    #overlay.show { display: flex; }

    #overlay-icon { font-size: 5rem; line-height: 1; }
    #overlay-title { font-size: 1.8rem; font-weight: 700; text-align: center; }
    #overlay-sub   { font-size: 1.1rem; color: rgba(255,255,255,0.85); text-align: center; }

    #overlay.success { background: rgba(52, 199, 89, 0.85); }
    #overlay.error   { background: rgba(255, 59, 48, 0.85); }
    #overlay.warning { background: rgba(255, 159, 10, 0.85); }

    canvas { display: none; }
  </style>
</head>
<body>

  <!-- AUTH -->
  <div id="auth-screen">
    <h1>🔐 Stamply — Scan</h1>
    <p>Entrez votre token JWT pour accéder au scanner de cartes.</p>
    <input type="password" id="token-input" placeholder="Token JWT (Bearer ...)" autocomplete="off">
    <button id="auth-btn">Accéder au scanner</button>
    <span id="auth-error"></span>
  </div>

  <!-- SCANNER -->
  <div id="scanner-screen">
    <video id="video" autoplay muted playsinline></video>
    <canvas id="canvas"></canvas>

    <div id="scanner-header">
      <span id="scanner-title">📷 Scanner une carte</span>
      <button id="logout-btn">Déconnexion</button>
    </div>

    <div id="viewfinder"></div>
    <p id="hint">Pointez la caméra sur la carte du client</p>

    <!-- Overlay résultat -->
    <div id="overlay">
      <div id="overlay-icon"></div>
      <div id="overlay-title"></div>
      <div id="overlay-sub"></div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
  <script>
    const API_BASE = window.location.origin;
    const STORAGE_KEY = 'stamply_jwt';

    let jwt = localStorage.getItem(STORAGE_KEY) || '';
    let scanning = true;
    let animFrame = null;

    // --- AUTH ---
    if (jwt) showScanner();

    document.getElementById('auth-btn').addEventListener('click', () => {
      const raw = document.getElementById('token-input').value.trim();
      jwt = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
      if (!jwt) {
        document.getElementById('auth-error').textContent = 'Token requis.';
        return;
      }
      localStorage.setItem(STORAGE_KEY, jwt);
      document.getElementById('auth-error').textContent = '';
      showScanner();
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      jwt = '';
      stopCamera();
      document.getElementById('scanner-screen').style.display = 'none';
      document.getElementById('auth-screen').style.display = 'flex';
    });

    // --- SCANNER ---
    async function showScanner() {
      document.getElementById('auth-screen').style.display = 'none';
      document.getElementById('scanner-screen').style.display = 'block';
      await startCamera();
    }

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        const video = document.getElementById('video');
        video.srcObject = stream;
        video.onloadedmetadata = () => { video.play(); requestAnimationFrame(tick); };
      } catch (err) {
        console.error('Erreur caméra:', err);
        showOverlay('error', '❌', 'Caméra inaccessible', 'Autorisez l\'accès à la caméra dans votre navigateur.', 0);
      }
    }

    function stopCamera() {
      const video = document.getElementById('video');
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(t => t.stop());
        video.srcObject = null;
      }
      if (animFrame) cancelAnimationFrame(animFrame);
    }

    function tick() {
      animFrame = requestAnimationFrame(tick);
      if (!scanning) return;

      const video = document.getElementById('video');
      const canvas = document.getElementById('canvas');
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        handleScan(code.data);
      }
    }

    async function handleScan(rawData) {
      scanning = false; // Pause le scan

      // Extraire le serial number : soit UUID direct, soit URL contenant le serial
      let serial = rawData;
      const urlMatch = rawData.match(/\\/install\\/([a-f0-9\\-]{36})/);
      if (urlMatch) serial = urlMatch[1];

      // Vérifier format UUID basique
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(serial)) {
        showOverlay('error', '❌', 'QR invalide', 'Ce QR code n\\'est pas une carte Stamply.', 2500);
        return;
      }

      try {
        const res = await fetch(API_BASE + '/api/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + jwt
          },
          body: JSON.stringify({ pass_serial_number: serial })
        });

        const data = await res.json();

        if (res.status === 429) {
          showOverlay('warning', '⚠️', 'Déjà scanné', 'Réessayez dans ' + data.retryAfterSeconds + 's.', 2500);
        } else if (res.status === 401) {
          // Token expiré → retour auth
          localStorage.removeItem(STORAGE_KEY);
          jwt = '';
          stopCamera();
          document.getElementById('scanner-screen').style.display = 'none';
          document.getElementById('auth-screen').style.display = 'flex';
        } else if (!data.success) {
          showOverlay('error', '❌', 'Carte non reconnue', data.error || 'Erreur inconnue.', 2500);
        } else {
          showOverlay('success', '✓', data.points + ' points', data.message, 2000);
        }
      } catch (err) {
        console.error('Erreur API scan:', err);
        showOverlay('error', '❌', 'Erreur réseau', 'Vérifiez votre connexion.', 2500);
      }
    }

    function showOverlay(type, icon, title, sub, duration) {
      const overlay = document.getElementById('overlay');
      overlay.className = 'show ' + type;
      document.getElementById('overlay-icon').textContent = icon;
      document.getElementById('overlay-title').textContent = title;
      document.getElementById('overlay-sub').textContent = sub;

      if (duration > 0) {
        setTimeout(() => {
          overlay.className = '';
          scanning = true; // Reprendre le scan
        }, duration);
      }
    }
  </script>
</body>
</html>`;
}

module.exports = router;
