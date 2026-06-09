/**
 * Stamply — Service Récompenses
 * 
 * Logique de récompenses configurable par le commerçant.
 * 
 * Types de récompenses supportés :
 * - "visites" : basé sur le nombre de visites (ex: 10 visites = café offert)
 * - "points" : basé sur les points accumulés
 * - "depense" : basé sur le montant dépensé
 * 
 * Actions quand débloqué :
 * - "message" : afficher un message de félicitations
 * - "reset_points" : remettre les points à 0 (nouveau cycle)
 * - "bonus_points" : donner des points bonus
 * - "code_promo" : générer un code promo unique
 * - "cadeau" : le client peut réclamer un cadeau au comptoir
 */

const { supabase } = require('../config/supabase');

const BADGE_LEVELS = { 1: '🥉', 5: '🥈', 10: '🥇', 25: '💎', 50: '👑' };

/**
 * Configuration par défaut des récompenses
 * Le commerçant peut modifier chaque paramètre
 */
const DEFAULT_REWARD_CONFIG = {
  enabled: true,
  // Visites
  visites_recompense_1: 10,
  label_recompense_1: 'Visiteur Fidèle',
  recompense_action_1: 'message',
  recompense_valeur_1: 'Félicitations ! Vous avez atteint 10 visites !',
  points_bonus_1: 0,
  // Visites 2
  visites_recompense_2: 25,
  label_recompense_2: 'Client Premium',
  recompense_action_2: 'bonus_points',
  recompense_valeur_2: 'Vous êtes un client premium !',
  points_bonus_2: 5,
  // Visites 3
  visites_recompense_3: 50,
  label_recompense_3: 'Ambassadeur',
  recompense_action_3: 'code_promo',
  recompense_valeur_3: 'Votre code promo exclusif',
  points_bonus_3: 10,
  // Reset automatique
  auto_reset: true,
  reset_message: 'Nouveau cycle de fidélité !',
  // Message personnalisé pour le client
  message_recompense: '🎁 Récompense débloquée !',
};

/**
 * Récupérer la config récompenses d'un commerçant
 */
async function getRewardConfig(commercantId, boutiqueId = null) {
  const { data, error } = await supabase
    .from('commercants')
    .select('reward_config, parametres')
    .eq('id', commercantId)
    .single();

  if (error || !data) {
    return { ...DEFAULT_REWARD_CONFIG };
  }

  // Try reward_config column first, then parametres.reward_config fallback
  const saved = data.reward_config || data?.parametres?.reward_config;
  if (!saved) {
    return { ...DEFAULT_REWARD_CONFIG };
  }

  return { ...DEFAULT_REWARD_CONFIG, ...saved };
}

/**
 * Sauvegarder la config récompenses
 */
async function saveRewardConfig(commercantId, config) {
  // Try to save in reward_config column; if column doesn't exist, store in parametres JSONB
  const { error } = await supabase
    .from('commercants')
    .update({
      reward_config: config,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commercantId);

  if (error) {
    // Column might not exist yet — try storing in parametres as fallback
    console.warn('reward_config column missing, trying parametres fallback:', error.message);
    const { error: err2 } = await supabase
      .from('commercants')
      .update({
        parametres: { reward_config: config },
        updated_at: new Date().toISOString(),
      })
      .eq('id', commercantId);
    if (err2) {
      // Last resort: just return the config without saving
      console.warn('Could not save reward config to DB, using in-memory only:', err2.message);
    }
  }
  return config;
}

/**
 * Vérifier si une récompense est débloquée après un scan
 * Appelé par le scanController après chaque scan
 */
async function checkRewardUnlocked(carteId, commercantId, newPoints, boutiqueId = null) {
  try {
    const client = await getRewardConfig(commercantId, boutiqueId);
    if (!client.enabled) return null;

    // Déterminer le nombre total de visites pour cette carte
    const { count: totalVisites, error: countError } = await supabase
      .from('visites')
      .select('id', { count: 'exact', head: true })
      .eq('carte_id', carteId);

    if (countError) throw countError;
    const visites = totalVisites || 0;

    // Vérifier chaque niveau de récompense
    const rewards = [];
    for (let i = 1; i <= 3; i++) {
      const seuil = client[`visites_recompense_${i}`];
      if (!seuil || seuil <= 0) continue;

      if (visites >= seuil) {
        // Vérifier si cette récompense a déjà été débloquée
        const { data: existing } = await supabase
          .from('recompenses_debloquees')
          .select('id')
          .eq('carte_id', carteId)
          .eq('niveau', i)
          .single();

        if (!existing) {
          // Nouvelle récompense débloquée !
          const reward = {
            niveau: i,
            type: 'visites',
            seuil,
            visites,
            label: client[`label_recompense_${i}`] || `Récompense niveau ${i}`,
            action: client[`recompense_action_${i}`] || 'message',
            valeur: client[`recompense_valeur_${i}`] || '',
            points_bonus: client[`points_bonus_${i}`] || 0,
          };

          // Enregistrer la récompense débloquée
          await supabase.from('recompenses_debloquees').insert({
            carte_id: carteId,
            commercant_id: commercantId,
            boutique_id: boutiqueId,
            niveau: i,
            type: 'visites',
            seuil,
            label: reward.label,
            action: reward.action,
            valeur: reward.valeur,
            points_bonus: reward.points_bonus,
            details: JSON.stringify({ visites, newPoints }),
          });

          // Exécuter l'action
          await executeRewardAction(carteId, commercantId, reward);

          rewards.push(reward);
        }
      }
    }

    // Vérifier si on doit faire un reset (cycle complet)
    if (client.auto_reset) {
      const maxSeuil = Math.max(
        client.visites_recompense_1 || 0,
        client.visites_recompense_2 || 0,
        client.visites_recompense_3 || 0
      );
      if (maxSeuil > 0 && visites >= maxSeuil) {
        // Vérifier si toutes les récompenses ont été débloquées
        const { data: unlocked } = await supabase
          .from('recompenses_debloquees')
          .select('niveau')
          .eq('carte_id', carteId);

        const unlockLevels = (unlocked || []).map(u => u.niveau);
        const allRewardsClaimed = [1, 2, 3].every(level => {
          const seuil = client[`visites_recompense_${level}`];
          return !seuil || seuil <= 0 || unlockLevels.includes(level);
        });

        if (allRewardsClaimed && client.auto_reset) {
          // Reset les points (nouveau cycle)
          await supabase
            .from('cartes')
            .update({ points: 0, updated_at: new Date().toISOString() })
            .eq('id', carteId);

          rewards.push({
            niveau: 0,
            type: 'reset',
            seuil: maxSeuil,
            visites,
            label: client.reset_message || 'Nouveau cycle !',
            action: 'reset_points',
            valeur: '',
            points_bonus: 0,
          });
        }
      }
    }

    return rewards.length > 0 ? rewards : null;
  } catch (err) {
    console.error('[Reward] Error checking rewards:', err);
    return null;
  }
}

/**
 * Exécuter l'action d'une récompense
 */
async function executeRewardAction(carteId, commercantId, reward) {
  try {
    switch (reward.action) {
      case 'message':
        // Juste afficher le message (pas d'action supplémentaire)
        console.log(`[Reward] Carte ${carteId}: ${reward.valeur}`);
        break;

      case 'bonus_points':
        if (reward.points_bonus > 0) {
          // Ajouter des points bonus
          const { data: carte } = await supabase
            .from('cartes')
            .select('points')
            .eq('id', carteId)
            .single();

          if (carte) {
            await supabase
              .from('cartes')
              .update({
                points: carte.points + reward.points_bonus,
                updated_at: new Date().toISOString(),
              })
              .eq('id', carteId);
          }
        }
        break;

      case 'code_promo':
        // Générer un code promo unique
        const codePromo = generatePromoCode(commercantId, reward.niveau);
        await supabase.from('codes_promo').insert({
          commercant_id: commercantId,
          carte_id: carteId,
          code: codePromo,
          type: 'fidelite',
          description: reward.label,
          utilise: false,
          date_expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
        });
        reward.code_genere = codePromo;
        break;

      case 'cadeau':
        // Marquer comme cadeau à réclamer au comptoir
        await supabase.from('cadeaux').insert({
          commercant_id: commercantId,
          carte_id: carteId,
          label: reward.label,
          description: reward.valeur,
          statut: 'en_attente', // en_attente, remis
        });
        break;

      case 'reset_points':
        // Le reset est géré dans checkRewardUnlocked
        break;
    }
  } catch (err) {
    console.error(`[Reward] Error executing action ${reward.action}:`, err);
  }
}

/**
 * Générer un code promo unique
 */
function generatePromoCode(commercantId, niveau) {
  const prefix = 'STAMP';
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${niveau}-${suffix}`;
}

/**
 * Récupérer les récompenses débloquées pour une carte
 */
async function getCarteRewards(carteId) {
  const { data, error } = await supabase
    .from('recompenses_debloquees')
    .select('*')
    .eq('carte_id', carteId)
    .order('niveau', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Récupérer les récompenses du commerçant (toutes les cartes)
 */
async function getMerchantRewards(commercantId, boutiqueId = null, limit = 50) {
  let query = supabase
    .from('recompenses_debloquees')
    .select(`
      id, niveau, type, seuil, label, action, valeur, points_bonus,
      created_at, details,
      cartes(pass_serial_number),
      boutiques(nom)
    `)
    .eq('commercant_id', commercantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (boutiqueId) {
    query = query.eq('boutique_id', boutiqueId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Statistiques des récompenses
 */
async function getRewardStats(commercantId, boutiqueId = null) {
  let query = supabase
    .from('recompenses_debloquees')
    .select('niveau, action')
    .eq('commercant_id', commercantId);

  if (boutiqueId) query = query.eq('boutique_id', boutiqueId);

  const { data, error } = await query;
  if (error) throw error;

  const stats = {
    total: data?.length || 0,
    par_niveau: { 1: 0, 2: 0, 3: 0 },
    par_action: {
      message: 0,
      bonus_points: 0,
      code_promo: 0,
      cadeau: 0,
      reset_points: 0,
    },
  };

  (data || []).forEach(r => {
    if (r.niveau >= 1 && r.niveau <= 3) stats.par_niveau[r.niveau]++;
    if (stats.par_action[r.action] !== undefined) stats.par_action[r.action]++;
  });

  return stats;
}

module.exports = {
  DEFAULT_REWARD_CONFIG,
  BADGE_LEVELS,
  getRewardConfig,
  saveRewardConfig,
  checkRewardUnlocked,
  getCarteRewards,
  getMerchantRewards,
  getRewardStats,
};
