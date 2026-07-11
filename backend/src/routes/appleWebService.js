/**
 * Apple Wallet Web Service — Stamply
 * 
 * Implémente le protocole Apple Wallet Web Service :
 * https://developer.apple.com/library/archive/documentation/PassKit/Reference/PassKit_WebService/WebService.html
 * 
 * Ces endpoints sont appelés AUTOMATIQUEMENT par l'iPhone du client
 * quand il installe une carte Apple Wallet.
 * 
 * Routes (montées sous /api/wallet/):
 *   POST /v1/devices/:deviceId/registrations/:passTypeId/:serial
 *   GET  /v1/devices/:deviceId/registrations/:passTypeId
 *   GET  /v1/passes/:passTypeId/:serial
 *   POST /v1/log
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const appleWalletService = require('../services/appleWalletService');

// ─── Helper: vérifier le token d'authentification ───────────────────────────

async function verifyAuthToken(req, serialNumber) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('ApplePass ')) return null;

  const token = auth.slice(10);
  const { data: carte } = await supabase
    .from('cartes')
    .select('apple_auth_token')
    .eq('pass_serial_number', serialNumber)
    .single();

  if (!carte) return null;
  return carte.apple_auth_token === token ? carte : null;
}

// ─── POST /v1/devices/:deviceId/registrations/:passTypeId/:serial ───────────
// Apple Wallet appelle cet endpoint quand le client ajoute la carte.
// On stocke le deviceLibraryIdentifier + pushToken pour envoyer des push.
//
// Body: { pushToken: string }
// Headers: Authorization: ApplePass <authToken>

router.post('/v1/devices/:deviceId/registrations/:passTypeId/:serial', async (req, res) => {
  try {
    const { deviceId, passTypeId, serial } = req.params;
    const { pushToken } = req.body;

    // Vérifier que le passTypeId correspond
    const expectedPassType = appleWalletService.APPLE_PASS_TYPE_ID;
    if (passTypeId !== expectedPassType) {
      return res.status(404).json({ error: 'Pass type not found' });
    }

    // Vérifier le token d'authentification
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('ApplePass ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: carte } = await supabase
      .from('cartes')
      .select('id, apple_auth_token')
      .eq('pass_serial_number', serial)
      .single();

    if (!carte || carte.apple_auth_token !== auth.slice(10)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Stocker le push token et l'identifiant device
    // La colonne apple_push_token existe dans la table cartes
    const { error: updateError } = await supabase
      .from('cartes')
      .update({
        apple_device_id: deviceId,
        apple_push_token: pushToken,
        apple_registered_at: new Date().toISOString(),
      })
      .eq('id', carte.id);

    if (updateError) {
      console.error('[AppleWS] Erreur enregistrement device:', updateError.message);
      return res.status(500).json({ error: 'Internal error' });
    }

    console.log(`[AppleWS] ✅ Carte ${serial} enregistrée pour push (device: ${deviceId})`);
    return res.status(201).json({ result: 'OK' });
  } catch (err) {
    console.error('[AppleWS] Registration error:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// ─── GET /v1/devices/:deviceId/registrations/:passTypeId ───────────────────
// Apple Wallet demande la liste des serial numbers de passes associés à ce device.
// Renvoie les serial numbers ET le lastUpdated timestamp.

router.get('/v1/devices/:deviceId/registrations/:passTypeId', async (req, res) => {
  try {
    const { deviceId, passTypeId } = req.params;
    const passesUpdatedSince = req.query.passesUpdatedSince;

    const expectedPassType = appleWalletService.APPLE_PASS_TYPE_ID;
    if (passTypeId !== expectedPassType) {
      return res.status(404).json({ error: 'Pass type not found' });
    }

    let query = supabase
      .from('cartes')
      .select('pass_serial_number, updated_at')
      .eq('apple_device_id', deviceId);

    if (passesUpdatedSince) {
      query = query.gt('updated_at', new Date(passesUpdatedSince).toISOString());
    }

    const { data: cartes, error } = await query;

    if (error) throw error;

    return res.json({
      serialNumbers: cartes.map(c => c.pass_serial_number),
      lastUpdated: cartes.length > 0
        ? new Date(Math.max(...cartes.map(c => new Date(c.updated_at).getTime()))).toISOString()
        : new Date().toISOString(),
    });
  } catch (err) {
    console.error('[AppleWS] Get serials error:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// ─── GET /v1/passes/:passTypeId/:serial ────────────────────────────────────
// Apple Wallet demande le pass mis à jour (après avoir reçu un push).
// Il faut renvoyer le fichier .pkpass complet à jour.

router.get('/v1/passes/:passTypeId/:serial', async (req, res) => {
  try {
    const { passTypeId, serial } = req.params;

    const expectedPassType = appleWalletService.APPLE_PASS_TYPE_ID;
    if (passTypeId !== expectedPassType) {
      return res.status(404).json({ error: 'Pass type not found' });
    }

    // Vérifier le token d'authentification
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('ApplePass ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: carte } = await supabase
      .from('cartes')
      .select('id, pass_serial_number, points, visites, commercant_id, apple_auth_token')
      .eq('pass_serial_number', serial)
      .single();

    if (!carte || carte.apple_auth_token !== auth.slice(10)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Récupérer le commerçant
    const { data: commercant } = await supabase
      .from('commercants')
      .select('id, nom_enseigne, carte_couleur_primaire, carte_couleur_secondaire, points_recompense, adresse, ville')
      .eq('id', carte.commercant_id)
      .single();

    if (!commercant) {
      return res.status(404).json({ error: 'Commerce not found' });
    }

    // Générer un nouveau .pkpass avec les données à jour
    const carteObj = { pass_serial_number: serial, points: carte.points || 0, visites: carte.visites || 0 };
    const pkpassBuffer = await appleWalletService.generatePkpassBuffer(carteObj, commercant);

    if (!pkpassBuffer) {
      return res.status(500).json({ error: 'Failed to generate pass' });
    }

    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', `attachment; filename="${serial}.pkpass"`);
    res.setHeader('Last-Modified', new Date().toUTCString());
    return res.send(pkpassBuffer);
  } catch (err) {
    console.error('[AppleWS] Get pass error:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// ─── POST /v1/log ──────────────────────────────────────────────────────────
// Apple Wallet envoie les logs d'erreur du device.
// On les stocke pour diagnostic.

router.post('/v1/log', async (req, res) => {
  try {
    const logs = req.body.logs || [];
    console.log(`[AppleWS] 📝 Logs reçus (${logs.length} entrées):`, logs.slice(0, 3).join(', '));

    // Stocker dans Supabase si on veut
    if (logs.length > 0) {
      await supabase.from('admin_logs').insert({
        action: 'apple_wallet_device_log',
        details: logs.slice(0, 10).join('\n'),
      }).catch(() => {});
    }

    return res.status(200).json({ result: 'OK' });
  } catch (err) {
    console.error('[AppleWS] Log error:', err.message);
    return res.status(200).json({ result: 'OK' });
  }
});

module.exports = router;
