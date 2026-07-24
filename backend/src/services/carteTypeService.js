/**
 * carteTypeService — Système de fidélité multi-types.
 *
 * 7 types de cartes au choix du commerçant (commercants.carte_type) :
 *   points | tampons | cashback | remise | carte_cadeau | membre | coupon
 *
 * La config par type est dans commercants.carte_type_config (JSONB),
 * fusionnée avec les valeurs par défaut ci-dessous.
 *
 * Deux fonctions clés :
 *  - applyScan()     : logique métier d'un scan (pure, testable)
 *  - displayFields() : ce qui s'affiche sur le pass (Apple + Google)
 */

const TYPES = {
  points: {
    nom: 'Carte de points',
    defaults: {
      points_par_euro: 1,          // 1€ dépensé = X points
      points_recompense: 100,      // palier de récompense
      recompense_desc: 'une récompense offerte',
    },
  },
  tampons: {
    nom: 'Carte à tampons',
    defaults: {
      tampons_requis: 10,
      tampon_emoji: '⭐',
      recompense_desc: 'une récompense offerte',
    },
  },
  cashback: {
    nom: 'Carte de cashback',
    defaults: {
      cashback_pourcent: 5,        // % du montant crédité en cagnotte
    },
  },
  remise: {
    nom: 'Carte de remise à paliers',
    defaults: {
      paliers: [
        { seuil: 0,   nom: 'Bronze', remise: 0 },
        { seuil: 200, nom: 'Argent', remise: 5 },
        { seuil: 500, nom: 'Or',     remise: 10 },
      ],
    },
  },
  carte_cadeau: {
    nom: 'Carte cadeau',
    defaults: {},
  },
  membre: {
    nom: 'Carte de membre',
    defaults: {
      statut_defaut: 'Membre',
    },
  },
  coupon: {
    nom: 'Coupon rabais numérique',
    defaults: {
      offre: '-10% sur votre première commande',
      type_apres_usage: 'tampons', // le coupon se transforme en carte fidélité après usage
    },
  },
};

const TYPES_AVEC_MONTANT = ['points', 'cashback', 'remise', 'carte_cadeau'];

/** Type effectif d'une carte : un coupon utilisé devient la carte cible. */
function typeEffectif(carteType, config, carte) {
  if (carteType === 'coupon' && carte?.coupon_utilise) {
    return config.type_apres_usage || 'tampons';
  }
  return carteType;
}

/** Retourne { type, config } fusionnés avec les défauts. */
function getTypeConfig(commercant) {
  const type = TYPES[commercant?.carte_type] ? commercant.carte_type : 'tampons';
  const defaults = TYPES[type].defaults;
  const custom = commercant?.carte_type_config || {};
  const config = { ...defaults, ...custom };
  // Rétro-compat : l'ancien champ points_recompense du commerçant reste prioritaire s'il existe
  if (type === 'points' && commercant?.points_recompense && !custom.points_recompense) {
    config.points_recompense = commercant.points_recompense;
  }
  if (type === 'tampons' && commercant?.points_recompense && !custom.tampons_requis) {
    config.tampons_requis = commercant.points_recompense;
  }
  return { type, config };
}

function palierActuel(paliers, totalDepense) {
  const tries = [...(paliers || [])].sort((a, b) => a.seuil - b.seuil);
  let courant = tries[0] || { seuil: 0, nom: 'Bronze', remise: 0 };
  for (const p of tries) {
    if ((totalDepense || 0) >= p.seuil) courant = p;
  }
  return courant;
}

/**
 * Applique un scan selon le type de carte. Fonction PURE (aucun accès DB).
 *
 * @param {object} p
 * @param {string} p.type      Type de carte du commerçant
 * @param {object} p.config    Config fusionnée (getTypeConfig)
 * @param {object} p.carte     Ligne cartes actuelle (points, solde, total_depense, coupon_utilise, visites)
 * @param {object} p.params    Entrées du commerçant au scan :
 *                             { montant?: number, quantite?: number, action?: 'scan'|'debit'|'credit'|'utiliser'|'recompense' }
 * @returns {{ ok: boolean, error?: string, updates?: object, resume?: string, notif?: string }}
 */
function applyScan({ type: carteType, config, carte, params = {} }) {
  const type = typeEffectif(carteType, config, carte);
  const action = params.action || 'scan';
  const montant = params.montant !== undefined ? parseFloat(params.montant) : undefined;
  const now = new Date().toISOString();
  const base = { last_visit_at: now, updated_at: now, visites: (carte.visites || 0) + 1 };

  const montantRequis = () => {
    if (montant === undefined || isNaN(montant) || montant <= 0) {
      return { ok: false, error: 'Montant de l\'achat requis (en €).' };
    }
    return null;
  };

  switch (type) {
    case 'points': {
      if (action === 'recompense') {
        const seuil = config.points_recompense;
        if ((carte.points || 0) < seuil) return { ok: false, error: `Il faut ${seuil} points pour utiliser la récompense.` };
        const points = (carte.points || 0) - seuil;
        return { ok: true, updates: { ...base, points }, resume: `Récompense utilisée (-${seuil} pts)`, notif: `🎁 Récompense utilisée ! Il vous reste ${points} points.` };
      }
      const err = montantRequis(); if (err) return err;
      const gain = Math.round(montant * (config.points_par_euro || 1));
      const points = (carte.points || 0) + gain;
      const seuil = config.points_recompense;
      const recompense = points >= seuil ? ` 🎁 Récompense disponible !` : '';
      return { ok: true, updates: { ...base, points }, resume: `+${gain} pts (${montant.toFixed(2)}€)`, notif: `+${gain} points ! Total : ${points} pts.${recompense}` };
    }

    case 'tampons': {
      if (action === 'recompense') {
        const requis = config.tampons_requis;
        if ((carte.points || 0) < requis) return { ok: false, error: `Il faut ${requis} tampons pour la récompense.` };
        const points = (carte.points || 0) - requis;
        return { ok: true, updates: { ...base, points }, resume: `Récompense utilisée (-${requis} tampons)`, notif: `🎁 Récompense utilisée ! Tampons restants : ${points}.` };
      }
      const quantite = Math.max(1, parseInt(params.quantite || 1));
      const points = (carte.points || 0) + quantite;
      const requis = config.tampons_requis;
      const emoji = config.tampon_emoji || '⭐';
      const recompense = points >= requis ? ` 🎁 Récompense disponible !` : '';
      return { ok: true, updates: { ...base, points }, resume: `+${quantite} tampon${quantite > 1 ? 's' : ''}`, notif: `${emoji} +${quantite} tampon${quantite > 1 ? 's' : ''} ! ${points}/${requis}.${recompense}` };
    }

    case 'cashback': {
      if (action === 'debit') {
        const err = montantRequis(); if (err) return err;
        if ((carte.solde || 0) < montant) return { ok: false, error: `Solde insuffisant (${(carte.solde || 0).toFixed(2)}€).` };
        const solde = Math.round(((carte.solde || 0) - montant) * 100) / 100;
        return { ok: true, updates: { ...base, solde }, resume: `-${montant.toFixed(2)}€ utilisés`, notif: `💶 ${montant.toFixed(2)}€ utilisés. Cagnotte : ${solde.toFixed(2)}€.` };
      }
      const err = montantRequis(); if (err) return err;
      const gain = Math.round(montant * (config.cashback_pourcent || 5)) / 100;
      const solde = Math.round(((carte.solde || 0) + gain) * 100) / 100;
      return { ok: true, updates: { ...base, solde }, resume: `+${gain.toFixed(2)}€ de cashback`, notif: `💶 +${gain.toFixed(2)}€ de cashback ! Cagnotte : ${solde.toFixed(2)}€.` };
    }

    case 'remise': {
      const err = montantRequis(); if (err) return err;
      const total = Math.round(((carte.total_depense || 0) + montant) * 100) / 100;
      const avant = palierActuel(config.paliers, carte.total_depense);
      const apres = palierActuel(config.paliers, total);
      const changement = apres.nom !== avant.nom ? ` 🎉 Nouveau statut : ${apres.nom} (-${apres.remise}%) !` : '';
      return { ok: true, updates: { ...base, total_depense: total, statut_palier: apres.nom }, resume: `+${montant.toFixed(2)}€ (statut ${apres.nom})`, notif: `Statut ${apres.nom} — remise ${apres.remise}%.${changement}` };
    }

    case 'carte_cadeau': {
      const err = montantRequis(); if (err) return err;
      if (action === 'credit') {
        const solde = Math.round(((carte.solde || 0) + montant) * 100) / 100;
        return { ok: true, updates: { ...base, solde }, resume: `+${montant.toFixed(2)}€ crédités`, notif: `🎁 Carte rechargée de ${montant.toFixed(2)}€. Solde : ${solde.toFixed(2)}€.` };
      }
      // défaut : débit (paiement en caisse)
      if ((carte.solde || 0) < montant) return { ok: false, error: `Solde insuffisant (${(carte.solde || 0).toFixed(2)}€).` };
      const solde = Math.round(((carte.solde || 0) - montant) * 100) / 100;
      return { ok: true, updates: { ...base, solde }, resume: `-${montant.toFixed(2)}€ débités`, notif: `💳 ${montant.toFixed(2)}€ débités. Solde restant : ${solde.toFixed(2)}€.` };
    }

    case 'membre': {
      return { ok: true, updates: { ...base }, resume: 'Visite enregistrée', notif: `Visite enregistrée — à bientôt ! 👋` };
    }

    case 'coupon': {
      if (carte.coupon_utilise) {
        return { ok: false, error: 'Coupon déjà utilisé.' };
      }
      // Utiliser le coupon → il se transforme en carte de fidélité (type_apres_usage)
      return { ok: true, updates: { ...base, coupon_utilise: true, points: 0 }, resume: `Coupon "${config.offre}" validé`, notif: `✅ Coupon utilisé : ${config.offre}. Votre carte de fidélité est activée !` };
    }

    default:
      return { ok: false, error: `Type de carte inconnu : ${type}` };
  }
}

/**
 * Champs d'affichage du pass (Apple + Google) selon le type.
 * header = zone principale (en haut à droite), second = champ secondaire.
 */
function displayFields({ type: carteType, config, carte, commercant }) {
  const type = typeEffectif(carteType, config, carte);
  const points = carte?.points || 0;

  switch (type) {
    case 'points':
      return {
        header_label: 'POINTS', header_value: String(points),
        header_change: 'Vous avez %@ points !',
        second_label: 'PROCHAIN CADEAU À', second_value: `${config.points_recompense} points`,
        programme: `Cumulez ${config.points_par_euro} point${config.points_par_euro > 1 ? 's' : ''} par euro dépensé. ${config.points_recompense} points = ${config.recompense_desc}.`,
      };
    case 'tampons': {
      const emoji = config.tampon_emoji || '⭐';
      return {
        header_label: 'TAMPONS', header_value: `${points}/${config.tampons_requis}`,
        header_change: 'Vos tampons : %@',
        second_label: 'RÉCOMPENSE À', second_value: `${config.tampons_requis} tampons ${emoji}`,
        programme: `1 visite = 1 tampon ${emoji}. ${config.tampons_requis} tampons = ${config.recompense_desc}.`,
      };
    }
    case 'cashback':
      return {
        header_label: 'CAGNOTTE', header_value: `${(carte?.solde || 0).toFixed(2)} €`,
        header_change: 'Cagnotte : %@',
        second_label: 'CASHBACK', second_value: `${config.cashback_pourcent}% sur vos achats`,
        programme: `${config.cashback_pourcent}% de chaque achat est crédité sur votre cagnotte, utilisable en caisse.`,
      };
    case 'remise': {
      const palier = palierActuel(config.paliers, carte?.total_depense);
      const prochains = (config.paliers || []).filter(p => p.seuil > (carte?.total_depense || 0)).sort((a, b) => a.seuil - b.seuil);
      const prochain = prochains[0];
      return {
        header_label: 'STATUT', header_value: carte?.statut_palier || palier.nom,
        header_change: 'Votre statut : %@',
        second_label: 'REMISE ACTUELLE', second_value: `-${palier.remise}%`,
        programme: `Votre remise augmente avec vos achats cumulés : ${(config.paliers || []).map(p => `${p.nom} (-${p.remise}%) dès ${p.seuil}€`).join(', ')}.${prochain ? ` Prochain palier : ${prochain.nom} à ${prochain.seuil}€.` : ''}`,
      };
    }
    case 'carte_cadeau':
      return {
        header_label: 'SOLDE', header_value: `${(carte?.solde || 0).toFixed(2)} €`,
        header_change: 'Solde : %@',
        second_label: 'CARTE CADEAU', second_value: commercant?.nom_enseigne || '',
        programme: `Carte cadeau utilisable en caisse chez ${commercant?.nom_enseigne || 'votre commerce'}, en une ou plusieurs fois.`,
      };
    case 'membre':
      return {
        header_label: 'STATUT', header_value: config.statut_defaut || 'Membre',
        header_change: 'Votre statut : %@',
        second_label: 'MEMBRE', second_value: 'Actif',
        programme: `Carte de membre ${commercant?.nom_enseigne || ''} — présentez-la à chaque visite.`,
      };
    case 'coupon':
      return {
        header_label: 'COUPON', header_value: 'À utiliser',
        header_change: '%@',
        second_label: 'OFFRE', second_value: config.offre,
        programme: `Présentez ce coupon en caisse pour profiter de l'offre : ${config.offre}. Après utilisation, il devient votre carte de fidélité.`,
      };
    default:
      return {
        header_label: 'POINTS', header_value: String(points),
        header_change: 'Vous avez %@ points !',
        second_label: 'FIDÉLITÉ', second_value: '',
        programme: '',
      };
  }
}

module.exports = { TYPES, TYPES_AVEC_MONTANT, getTypeConfig, applyScan, displayFields, typeEffectif, palierActuel };
