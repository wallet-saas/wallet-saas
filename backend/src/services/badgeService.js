const { supabase } = require('../config/supabase');

/**
 * Vérifier et attribuer des badges à un client
 * Appelé après chaque scan
 */
const checkAndAssignBadges = async (carteId, commercantId, points) => {
  try {
    // Définir les badges disponibles
    const BADGES = [
      { id: 'premiere_visite', label: 'Première visite', condition: (p) => p >= 1, icon: '🌟' },
      { id: 'regular_5', label: 'Régulier', condition: (p) => p >= 5, icon: '⭐' },
      { id: 'regular_10', label: 'Fidèle', condition: (p) => p >= 10, icon: '🏆' },
      { id: 'regular_25', label: 'Super Fidèle', condition: (p) => p >= 25, icon: '👑' },
      { id: 'regular_50', label: 'Légende', condition: (p) => p >= 50, icon: '💎' },
    ];

    // Récupérer les badges déjà attribués
    const { data: existingBadges } = await supabase
      .from('client_badges')
      .select('badge_id')
      .eq('carte_id', carteId);

    const existingIds = new Set((existingBadges || []).map((b) => b.badge_id));

    // Vérifier quels badges doivent être attribués
    const newBadges = BADGES.filter(
      (badge) => badge.condition(points) && !existingIds.has(badge.id)
    );

    if (newBadges.length === 0) return [];

    // Insérer les nouveaux badges
    const insertData = newBadges.map((badge) => ({
      carte_id: carteId,
      commercant_id: commercantId,
      badge_id: badge.id,
      badge_label: badge.label,
      badge_icon: badge.icon,
      points_atribution: points,
    }));

    await supabase.from('client_badges').insert(insertData);

    return newBadges;
  } catch (err) {
    console.error('[badges] Erreur:', err.message);
    return [];
  }
};

/**
 * Récupérer les badges d'un client
 */
const getClientBadges = async (carteId, commercantId) => {
  try {
    const { data, error } = await supabase
      .from('client_badges')
      .select('id, badge_id, badge_label, badge_icon, points_atribution, created_at')
      .eq('carte_id', carteId)
      .eq('commercant_id', commercantId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
};

/**
 * Récupérer les statistiques de badges d'un commerçant
 */
const getBadgeStats = async (commercantId) => {
  try {
    const { data, error } = await supabase
      .from('client_badges')
      .select('badge_id, badge_label, badge_icon')
      .eq('commercant_id', commercantId);

    if (error) return [];

    const stats = {};
    (data || []).forEach((b) => {
      if (!stats[b.badge_id]) {
        stats[b.badge_id] = { ...b, count: 0 };
      }
      stats[b.badge_id].count++;
    });

    return Object.values(stats);
  } catch {
    return [];
  }
};

module.exports = { checkAndAssignBadges, getClientBadges, getBadgeStats };
