/**
 * Panel employés — gestion d'équipe pour un commerçant.
 *
 * Principe : la tablette de caisse reste connectée au compte du commerçant.
 * En début de service, l'employé saisit son code PIN : ses scans lui sont
 * alors attribués, et son accès est limité aux modules que le commerçant
 * lui a autorisés. Le commerçant reprend la main avec son propre PIN.
 *
 * Le PIN n'est jamais stocké en clair (bcrypt), jamais renvoyé par l'API.
 */

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');

// Modules qu'un employé peut se voir accorder
const MODULES_DISPONIBLES = [
  'scan', 'cartes', 'notifications', 'automatisations',
  'avis', 'menus', 'offres', 'geolocalisation', 'analytics',
];

function nettoyerPermissions(permissions) {
  if (!Array.isArray(permissions)) return ['scan'];
  const valides = permissions.filter(p => MODULES_DISPONIBLES.includes(p));
  // Le scan est le minimum vital : un employé sans aucun accès n'a rien à faire ici
  return valides.length ? valides : ['scan'];
}

function pinValide(pin) {
  return typeof pin === 'string' && /^\d{4,6}$/.test(pin);
}

/** Ne jamais exposer le hash du PIN. */
function versReponse(employe) {
  if (!employe) return null;
  const { pin_hash, ...reste } = employe;
  return reste;
}

// ─── GET /api/employes ────────────────────────────────────────────────────────
// Liste de l'équipe, avec l'activité de chacun.

router.get('/', authMiddleware, async (req, res) => {
  try {
    const commercantId = req.commercant.id;

    const { data: employes, error } = await supabase
      .from('employes')
      .select('id, prenom, permissions, actif, derniere_activite_at, created_at')
      .eq('commercant_id', commercantId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Compteurs de scans (aujourd'hui / 30 jours) par employé
    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);
    const il30j = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { data: visites } = await supabase
      .from('visites')
      .select('employe_id, created_at, montant')
      .eq('commercant_id', commercantId)
      .gte('created_at', il30j.toISOString())
      .not('employe_id', 'is', null);

    const stats = {};
    for (const v of visites || []) {
      const s = stats[v.employe_id] || { scans_30j: 0, scans_jour: 0, ca_30j: 0 };
      s.scans_30j++;
      if (new Date(v.created_at) >= debutJour) s.scans_jour++;
      if (v.montant) s.ca_30j += parseFloat(v.montant) || 0;
      stats[v.employe_id] = s;
    }

    const enrichis = (employes || []).map(e => ({
      ...versReponse(e),
      scans_jour: stats[e.id]?.scans_jour || 0,
      scans_30j: stats[e.id]?.scans_30j || 0,
      ca_30j: Math.round((stats[e.id]?.ca_30j || 0) * 100) / 100,
    }));

    return res.json({ success: true, data: { employes: enrichis, modules: MODULES_DISPONIBLES } });
  } catch (err) {
    console.error('[Employes] Liste:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/employes ───────────────────────────────────────────────────────

router.post('/', authMiddleware, async (req, res) => {
  try {
    const commercantId = req.commercant.id;
    const { prenom, pin, permissions } = req.body;

    if (!prenom || !prenom.trim()) {
      return res.status(400).json({ success: false, error: 'Le prénom est obligatoire.' });
    }
    if (!pinValide(pin)) {
      return res.status(400).json({ success: false, error: 'Le code PIN doit contenir 4 à 6 chiffres.' });
    }

    // Deux employés du même commerce ne peuvent pas avoir le même PIN
    const { data: existants } = await supabase
      .from('employes')
      .select('pin_hash')
      .eq('commercant_id', commercantId);

    for (const e of existants || []) {
      if (e.pin_hash && await bcrypt.compare(pin, e.pin_hash)) {
        return res.status(409).json({ success: false, error: 'Ce code PIN est déjà utilisé par un autre membre de l\'équipe.' });
      }
    }

    const pin_hash = await bcrypt.hash(pin, 10);

    const { data, error } = await supabase
      .from('employes')
      .insert([{
        commercant_id: commercantId,
        prenom: prenom.trim(),
        pin_hash,
        permissions: nettoyerPermissions(permissions),
        actif: true,
      }])
      .select('id, prenom, permissions, actif, created_at')
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, data: versReponse(data) });
  } catch (err) {
    console.error('[Employes] Création:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/employes/:id ────────────────────────────────────────────────────

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const commercantId = req.commercant.id;
    const { id } = req.params;
    const { prenom, pin, permissions, actif } = req.body;

    const { data: employe } = await supabase
      .from('employes')
      .select('id, commercant_id')
      .eq('id', id)
      .single();

    if (!employe || employe.commercant_id !== commercantId) {
      return res.status(404).json({ success: false, error: 'Membre introuvable.' });
    }

    const updates = {};
    if (prenom !== undefined) updates.prenom = String(prenom).trim();
    if (permissions !== undefined) updates.permissions = nettoyerPermissions(permissions);
    if (actif !== undefined) updates.actif = !!actif;
    if (pin) {
      if (!pinValide(pin)) {
        return res.status(400).json({ success: false, error: 'Le code PIN doit contenir 4 à 6 chiffres.' });
      }
      updates.pin_hash = await bcrypt.hash(pin, 10);
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, error: 'Rien à modifier.' });
    }

    const { data, error } = await supabase
      .from('employes')
      .update(updates)
      .eq('id', id)
      .select('id, prenom, permissions, actif, created_at')
      .single();

    if (error) throw error;
    return res.json({ success: true, data: versReponse(data) });
  } catch (err) {
    console.error('[Employes] Mise à jour:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DELETE /api/employes/:id ─────────────────────────────────────────────────

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const commercantId = req.commercant.id;
    const { id } = req.params;

    const { data: employe } = await supabase
      .from('employes')
      .select('id, commercant_id, prenom')
      .eq('id', id)
      .single();

    if (!employe || employe.commercant_id !== commercantId) {
      return res.status(404).json({ success: false, error: 'Membre introuvable.' });
    }

    const { error } = await supabase.from('employes').delete().eq('id', id);
    if (error) throw error;

    // Les visites déjà enregistrées gardent l'identifiant : l'historique reste
    // cohérent même après le départ d'un employé.
    console.log(`[Employes] ${employe.prenom} retiré de l'équipe (${commercantId})`);
    return res.json({ success: true });
  } catch (err) {
    console.error('[Employes] Suppression:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/employes/pin ───────────────────────────────────────────────────
// Prise de service : l'employé saisit son PIN, on renvoie son profil et ses droits.

router.post('/pin', authMiddleware, async (req, res) => {
  try {
    const commercantId = req.commercant.id;
    const { pin } = req.body;

    if (!pinValide(pin)) {
      return res.status(400).json({ success: false, error: 'Code PIN invalide.' });
    }

    const { data: employes } = await supabase
      .from('employes')
      .select('id, prenom, permissions, actif, pin_hash')
      .eq('commercant_id', commercantId)
      .eq('actif', true);

    for (const e of employes || []) {
      if (e.pin_hash && await bcrypt.compare(pin, e.pin_hash)) {
        await supabase
          .from('employes')
          .update({ derniere_activite_at: new Date().toISOString() })
          .eq('id', e.id);

        return res.json({
          success: true,
          data: { id: e.id, prenom: e.prenom, permissions: nettoyerPermissions(e.permissions) },
        });
      }
    }

    return res.status(401).json({ success: false, error: 'Code PIN non reconnu.' });
  } catch (err) {
    console.error('[Employes] PIN:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
