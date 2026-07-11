const { supabase } = require('../config/supabase');
const googleWalletService = require('../services/googleWalletService');
const appleWalletService = require('../services/appleWalletService');
const { v4: uuidv4 } = require('uuid');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Génère les URLs Google et Apple Wallet pour une carte.
 * Non-bloquant : retourne { google: null, apple: null } en cas d'erreur.
 */
async function generateWalletUrls(carte, commercant) {
  const [googleUrl, appleUrl] = await Promise.all([
    googleWalletService.generateSaveUrl(carte, commercant).catch((e) => {
      console.error('[walletController] generateSaveUrl threw:', e.message);
      return null;
    }),
    appleWalletService.generateSaveUrl(carte, commercant).catch(() => null),
  ]);
  return { google: googleUrl, apple: appleUrl };
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/**
 * Générer une nouvelle carte wallet depuis le dashboard commerçant
 * POST /api/wallet/generate
 * Protégé par authMiddleware
 */
const generateWalletCard = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;

    const { data: commercant, error: commercantError } = await supabase
      .from('commercants')
      .select('id, nom_enseigne, carte_couleur_primaire, carte_couleur_secondaire, carte_logo_url, points_recompense')
      .eq('id', commercantId)
      .single();

    if (commercantError || !commercant) {
      return res.status(404).json({ success: false, error: 'Commerçant introuvable.' });
    }

    const serialNumber = uuidv4();
    const carteObj = { pass_serial_number: serialNumber, points: 0 };

    // Générer les URLs wallet (non-bloquant si non configuré)
    const walletUrls = await generateWalletUrls(carteObj, commercant);

    // Enregistrer la carte en base
    const { data: newCard, error: insertError } = await supabase
      .from('cartes')
      .insert([{
        commercant_id: commercantId,
        pass_type: 'universal',
        pass_serial_number: serialNumber,
        points: 0,
        google_wallet_url: walletUrls.google,
        apple_wallet_url: walletUrls.apple,
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Erreur insertion carte:', insertError);
      return res.status(500).json({ success: false, error: 'Erreur lors de l\'enregistrement de la carte.' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    // L'URL d'installation pointe vers la page Next.js /install/[commercantId]
    // afin que le client bénéficie de la détection OS et du bon bouton wallet
    const installUrl = `${frontendUrl}/install/${commercantId}`;

    res.status(201).json({
      success: true,
      data: {
        pass_serial_number: serialNumber,
        install_url: installUrl,
        qr_code_url: installUrl,
        google_wallet_url: walletUrls.google,
        apple_wallet_url: walletUrls.apple,
        google_wallet_configured: googleWalletService.isConfigured(),
        apple_wallet_configured: appleWalletService.isConfigured(),
      }
    });
  } catch (error) {
    console.error('Erreur generateWalletCard:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la génération de la carte.' });
  }
};

/**
 * Page HTML d'installation d'une carte (fallback legacy)
 * GET /api/wallet/install/:serial
 * Redirige vers la page Next.js de détection OS (préférable).
 */
const getInstallPage = async (req, res) => {
  try {
    const { serial } = req.params;

    const { data: card, error: cardError } = await supabase
      .from('cartes')
      .select('id, pass_serial_number, points, commercant_id, google_wallet_url, apple_wallet_url')
      .eq('pass_serial_number', serial)
      .single();

    if (cardError || !card) {
      return res.status(404).send(`
        <!DOCTYPE html><html lang="fr"><head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Carte introuvable — Stamply</title>
        <style>body{font-family:-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;text-align:center;padding:20px}</style>
        </head><body><div><h1>❌ Carte introuvable</h1><p>Cette carte de fidélité n'existe pas.</p></div></body></html>
      `);
    }

    // Rediriger vers la page Next.js d'installation (avec détection OS)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const commercantId = card.commercant_id;

    if (commercantId) {
      return res.redirect(302, `${frontendUrl}/install/${commercantId}`);
    }

    // Fallback HTML si pas de commerçant
    const couleurPrimaire = '#6366f1';
    const nomEnseigne = 'Votre commerce';
    const googleUrl = card.google_wallet_url;

    res.send(`
      <!DOCTYPE html><html lang="fr"><head>
      <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
      <title>${nomEnseigne} — Stamply</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:linear-gradient(135deg,${couleurPrimaire} 0%,#764ba2 100%);color:#fff;padding:20px}
        .c{text-align:center;max-width:380px;background:rgba(255,255,255,.15);backdrop-filter:blur(12px);padding:2rem;border-radius:20px}
        h1{font-size:1.6rem;margin-bottom:.5rem}
        .btn{display:inline-block;background:#fff;color:${couleurPrimaire};padding:.9rem 1.8rem;border-radius:12px;text-decoration:none;font-weight:700;font-size:1rem;margin-top:1.2rem}
      </style>
      </head><body>
      <div class="c">
        <h1>🎉 Carte de fidélité</h1>
        <p style="opacity:.9;margin-bottom:1rem">${nomEnseigne}</p>
        ${googleUrl
          ? `<a class="btn" href="${googleUrl}"><img src="https://pay.google.com/about/static/sample-assets/pay-with-gpay-button.png" alt="Ajouter à Google Wallet" style="height:40px"></a>`
          : '<p style="opacity:.7;font-size:.9rem">Configurez Google Wallet dans le dashboard pour activer l\'installation.</p>'
        }
      </div>
      </body></html>
    `);
  } catch (error) {
    console.error('Erreur getInstallPage:', error);
    res.status(500).send('Erreur lors du chargement de la page.');
  }
};

/**
 * Télécharger les détails de la carte (simulation / debug)
 * GET /api/wallet/download/:serial
 */
const downloadPass = async (req, res) => {
  try {
    const { serial } = req.params;

    const { data: card, error } = await supabase
      .from('cartes')
      .select('pass_serial_number, points, commercant_id, google_wallet_url, apple_wallet_url')
      .eq('pass_serial_number', serial)
      .single();

    if (error || !card) {
      return res.status(404).json({ success: false, error: 'Carte introuvable' });
    }

    // Rediriger vers Apple Wallet si disponible
    if (card.apple_wallet_url) {
      return res.redirect(302, card.apple_wallet_url);
    }

    // Sinon, rediriger vers Google Wallet
    if (card.google_wallet_url) {
      return res.redirect(302, card.google_wallet_url);
    }

    // Fallback: retourner les infos de la carte
    let nomEnseigne = 'Votre commerce';
    if (card.commercant_id) {
      const { data: commercant } = await supabase
        .from('commercants')
        .select('nom_enseigne')
        .eq('id', card.commercant_id)
        .single();
      if (commercant) nomEnseigne = commercant.nom_enseigne;
    }

    res.status(200).json({
      success: true,
      data: {
        pass_serial_number: card.pass_serial_number,
        points: card.points,
        nom_enseigne: nomEnseigne,
        google_wallet_url: card.google_wallet_url,
        apple_wallet_url: card.apple_wallet_url,
        google_wallet_configured: googleWalletService.isConfigured(),
        apple_wallet_configured: appleWalletService.isConfigured(),
      }
    });
  } catch (error) {
    console.error('Erreur downloadPass:', error);
    res.status(500).json({ success: false, error: 'Erreur lors du téléchargement' });
  }
};

/**
 * Récupérer les cartes d'un commerçant (liste paginée)
 * GET /api/wallet/cartes
 */
const getCommercantCards = async (req, res) => {
  try {
    const { id: commercantId } = req.commercant;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const { data: cartes, error, count } = await supabase
      .from('cartes')
      .select('id, pass_serial_number, points, created_at, last_visit_at, google_wallet_url, apple_wallet_url', { count: 'exact' })
      .eq('commercant_id', commercantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      success: true,
      data: { cartes, total, page, totalPages }
    });
  } catch (error) {
    console.error('Erreur getCommercantCards:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Générer une carte pour un client via la page d'installation publique
 * POST /api/wallet/generate-for/:commercantId
 * Public — appelé depuis /install/[commercantId] côté client
 */
const generateCardForClient = async (req, res) => {
  try {
    const { commercantId } = req.params;

    const { data: commercant, error: commercantError } = await supabase
      .from('commercants')
      .select('id, nom_enseigne, carte_couleur_primaire, carte_couleur_secondaire, carte_logo_url, points_recompense, abonnement_statut, wallet_class_configured')
      .eq('id', commercantId)
      .single();

    if (commercantError || !commercant) {
      return res.status(404).json({ success: false, error: 'Commerce introuvable.' });
    }

    // Note: on ne bloque pas si abonnement inactif — le commerçant peut tester
    // le flux d'installation même sans abonnement actif (mode démo)
    // if (commercant.abonnement_statut !== 'actif') {
    //   return res.status(403).json({ success: false, error: 'Programme de fidélité inactif pour ce commerce.' });
    // }

    if (commercant.wallet_class_configured !== true) {
      return res.status(403).json({ success: false, error: 'Ce commerçant n\'a pas encore configuré sa carte de fidélité.' });
    }

    const serialNumber = uuidv4();
    const appleAuthToken = uuidv4();
    const carteObj = { pass_serial_number: serialNumber, points: 0, apple_auth_token: appleAuthToken };

    // Générer l'URL Google Wallet
    let googleUrl = null;
    try {
      googleUrl = await googleWalletService.generateSaveUrl(carteObj, commercant);
    } catch (e) {
      console.error('[walletController] generateSaveUrl threw:', e.message);
    }

    // Générer l'URL Apple Wallet (non-bloquant)
    let appleUrl = null;
    try {
      appleUrl = await appleWalletService.generateSaveUrl(carteObj, commercant);
    } catch (e) {
      // non-fatal
    }

    const { data: newCard, error: insertError } = await supabase
      .from('cartes')
      .insert([{
        commercant_id: commercantId,
        pass_type: 'universal',
        pass_serial_number: serialNumber,
        points: 0,
        google_wallet_url: googleUrl,
        apple_wallet_url: appleUrl,
        apple_auth_token: appleAuthToken,
        installed_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Erreur création carte client:', insertError);
      return res.status(500).json({ success: false, error: 'Erreur création carte.' });
    }

    res.status(201).json({
      success: true,
      data: {
        serial_number: newCard.pass_serial_number,
        google_wallet_url: googleUrl,
        apple_wallet_url: appleUrl,
        nom_enseigne: commercant.nom_enseigne,
        couleur_primaire: commercant.carte_couleur_primaire || '#6366f1',
        couleur_secondaire: commercant.carte_couleur_secondaire || '#a5b4fc',
        logo_url: commercant.carte_logo_url || null,
        points_recompense: commercant.points_recompense || 10,
        google_wallet_configured: googleWalletService.isConfigured(),
        apple_wallet_configured: appleWalletService.isConfigured(),
      }
    });
  } catch (error) {
    console.error('Erreur generateCardForClient:', error);
    res.status(500).json({ success: false, error: 'Erreur interne.' });
  }
};

module.exports = {
  generateWalletCard,
  getInstallPage,
  downloadPass,
  getCommercantCards,
  generateCardForClient,
};
