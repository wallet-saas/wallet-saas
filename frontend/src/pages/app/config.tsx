import { useEffect, useState, useCallback } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';

interface RewardConfig {
  enabled: boolean;
  visites_recompense_1: number;
  visites_recompense_2: number;
  visites_recompense_3: number;
  label_recompense_1: string;
  label_recompense_2: string;
  label_recompense_3: string;
  recompense_action_1: string;
  recompense_action_2: string;
  recompense_action_3: string;
  points_bonus_1: number;
  points_bonus_2: number;
  points_bonus_3: number;
  auto_reset: boolean;
  reset_message: string;
}

interface AutoReviewConfig {
  enabled: boolean;
  seuil_avis: number;
  message_positif: string;
  message_negatif: string;
  delai_relance: number;
  canal: 'email' | 'sms' | 'push';
}

const DEFAULT_REWARD_CONFIG: RewardConfig = {
  enabled: true,
  visites_recompense_1: 5,
  visites_recompense_2: 10,
  visites_recompense_3: 20,
  label_recompense_1: 'Bronze',
  label_recompense_2: 'Argent',
  label_recompense_3: 'Or',
  recompense_action_1: 'Café offert',
  recompense_action_2: 'Réduction 10%',
  recompense_action_3: 'Produit gratuit',
  points_bonus_1: 50,
  points_bonus_2: 150,
  points_bonus_3: 300,
  auto_reset: false,
  reset_message: 'Vos points ont été réinitialisés.',
};

const DEFAULT_AUTO_REVIEW: AutoReviewConfig = {
  enabled: false,
  seuil_avis: 4,
  message_positif: 'Merci pour votre avis ! Laissez un avis en ligne ?',
  message_negatif: 'Nous sommes désolés. Comment améliorer nos services ?',
  delai_relance: 24,
  canal: 'email',
};

export default function ConfigPage() {
  const [rewardConfig, setRewardConfig] = useState<RewardConfig>(DEFAULT_REWARD_CONFIG);
  const [autoReview, setAutoReview] = useState<AutoReviewConfig>(DEFAULT_AUTO_REVIEW);
  const [loading, setLoading] = useState(true);
  const [savingRewards, setSavingRewards] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [rewardMsg, setRewardMsg] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');
  const [error, setError] = useState('');

  const getToken = useCallback(() => {
    return localStorage.getItem('token');
  }, []);

  const fetchConfigs = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      setError('');
      const [rewardRes, reviewRes] = await Promise.all([
        fetch('/api/rewards/config', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch('/api/auto-review/settings', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
      ]);

      if (rewardRes) {
        const result = await rewardRes.json();
        if (result.success && result.data) {
          setRewardConfig({ ...DEFAULT_REWARD_CONFIG, ...result.data });
        }
      }
      if (reviewRes) {
        const result = await reviewRes.json();
        if (result.success && result.data) {
          setAutoReview({ ...DEFAULT_AUTO_REVIEW, ...result.data });
        }
      }
    } catch (err) {
      console.error('Config fetch error:', err);
      setError('Erreur lors du chargement de la configuration');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  async function saveRewardConfig() {
    const token = getToken();
    if (!token) return;

    setSavingRewards(true);
    setRewardMsg('');

    try {
      const res = await fetch('/api/rewards/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rewardConfig),
      });
      const result = await res.json();

      if (result.success) {
        setRewardMsg('✅ Configuration enregistrée');
        setTimeout(() => setRewardMsg(''), 3000);
      } else {
        setRewardMsg('❌ Erreur lors de l\'enregistrement');
      }
    } catch (err) {
      console.error('Save reward config error:', err);
      setRewardMsg('❌ Erreur de connexion');
    } finally {
      setSavingRewards(false);
    }
  }

  async function saveAutoReview() {
    const token = getToken();
    if (!token) return;

    setSavingReview(true);
    setReviewMsg('');

    try {
      const res = await fetch('/api/auto-review/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(autoReview),
      });
      const result = await res.json();

      if (result.success) {
        setReviewMsg('✅ Configuration enregistrée');
        setTimeout(() => setReviewMsg(''), 3000);
      } else {
        setReviewMsg('❌ Erreur lors de l\'enregistrement');
      }
    } catch (err) {
      console.error('Save auto review error:', err);
      setReviewMsg('❌ Erreur de connexion');
    } finally {
      setSavingReview(false);
    }
  }

  if (loading) {
    return (
      <MobileLayout title="Configuration">
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⚙️</div>
          Chargement de la configuration...
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Configuration">
      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 12, padding: '12px 16px', marginBottom: 16,
          color: '#DC2626', fontSize: 13, fontWeight: 500,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Reward Configuration */}
      <div style={{
        background: 'white', borderRadius: 16, padding: 16,
        marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 16,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
            🎁 Récompenses
          </h3>
          <ToggleSwitch
            checked={rewardConfig.enabled}
            onChange={(v) => setRewardConfig({ ...rewardConfig, enabled: v })}
          />
        </div>

        <p style={{
          fontSize: 12, color: '#6B7280', marginBottom: 16,
          lineHeight: 1.5,
        }}>
          Configurez les paliers de récompenses pour fidéliser vos clients.
          Chaque palier est atteint après un certain nombre de visites.
        </p>

        {/* Level 1 */}
        <RewardLevelCard
          level={1}
          label={rewardConfig.label_recompense_1}
          visits={rewardConfig.visites_recompense_1}
          action={rewardConfig.recompense_action_1}
          points={rewardConfig.points_bonus_1}
          color="#CD7F32"
          onLabelChange={(v) => setRewardConfig({ ...rewardConfig, label_recompense_1: v })}
          onVisitsChange={(v) => setRewardConfig({ ...rewardConfig, visites_recompense_1: v })}
          onActionChange={(v) => setRewardConfig({ ...rewardConfig, recompense_action_1: v })}
          onPointsChange={(v) => setRewardConfig({ ...rewardConfig, points_bonus_1: v })}
        />

        {/* Level 2 */}
        <RewardLevelCard
          level={2}
          label={rewardConfig.label_recompense_2}
          visits={rewardConfig.visites_recompense_2}
          action={rewardConfig.recompense_action_2}
          points={rewardConfig.points_bonus_2}
          color="#C0C0C0"
          onLabelChange={(v) => setRewardConfig({ ...rewardConfig, label_recompense_2: v })}
          onVisitsChange={(v) => setRewardConfig({ ...rewardConfig, visites_recompense_2: v })}
          onActionChange={(v) => setRewardConfig({ ...rewardConfig, recompense_action_2: v })}
          onPointsChange={(v) => setRewardConfig({ ...rewardConfig, points_bonus_2: v })}
        />

        {/* Level 3 */}
        <RewardLevelCard
          level={3}
          label={rewardConfig.label_recompense_3}
          visits={rewardConfig.visites_recompense_3}
          action={rewardConfig.recompense_action_3}
          points={rewardConfig.points_bonus_3}
          color="#FFD700"
          onLabelChange={(v) => setRewardConfig({ ...rewardConfig, label_recompense_3: v })}
          onVisitsChange={(v) => setRewardConfig({ ...rewardConfig, visites_recompense_3: v })}
          onActionChange={(v) => setRewardConfig({ ...rewardConfig, recompense_action_3: v })}
          onPointsChange={(v) => setRewardConfig({ ...rewardConfig, points_bonus_3: v })}
        />

        {/* Auto reset */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '12px 0',
          borderTop: '1px solid #F3F4F6', marginTop: 8,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
              Réinitialisation auto
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>
              Réinitialiser les points annuellement
            </div>
          </div>
          <ToggleSwitch
            checked={rewardConfig.auto_reset}
            onChange={(v) => setRewardConfig({ ...rewardConfig, auto_reset: v })}
          />
        </div>

        {/* Save button + message */}
        {rewardMsg && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 10,
            background: rewardMsg.startsWith('✅') ? '#D1FAE5' : '#FEE2E2',
            fontSize: 13, fontWeight: 600,
            color: rewardMsg.startsWith('✅') ? '#059669' : '#DC2626',
          }}>
            {rewardMsg}
          </div>
        )}

        <button
          onClick={saveRewardConfig}
          disabled={savingRewards}
          style={{
            width: '100%', marginTop: 12,
            background: savingRewards ? '#9CA3AF' : '#6C63FF',
            color: 'white', border: 'none', borderRadius: 12,
            padding: '14px 20px', fontSize: 15, fontWeight: 700,
            cursor: savingRewards ? 'not-allowed' : 'pointer',
          }}
        >
          {savingRewards ? 'Enregistrement...' : '💾 Enregistrer les récompenses'}
        </button>
      </div>

      {/* Auto Review Configuration */}
      <div style={{
        background: 'white', borderRadius: 16, padding: 16,
        marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 16,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
            ⭐ Avis automatiques
          </h3>
          <ToggleSwitch
            checked={autoReview.enabled}
            onChange={(v) => setAutoReview({ ...autoReview, enabled: v })}
          />
        </div>

        <p style={{
          fontSize: 12, color: '#6B7280', marginBottom: 16,
          lineHeight: 1.5,
        }}>
          Envoyez automatiquement des demandes d'avis après une visite.
          Supporte QR dynamique et statique.
        </p>

        <div style={{ marginBottom: 12 }}>
          <label style={{
            display: 'block', fontSize: 12, fontWeight: 600,
            color: '#6B7280', marginBottom: 6,
          }}>
            Seuil d'avis (étoiles)
          </label>
          <input
            type="number"
            min="1"
            max="5"
            value={autoReview.seuil_avis}
            onChange={(e) => setAutoReview({ ...autoReview, seuil_avis: parseInt(e.target.value) || 1 })}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: '1px solid #E5E7EB', fontSize: 14,
              background: '#F9FAFB', color: '#111827',
              boxSizing: 'border-box',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{
            display: 'block', fontSize: 12, fontWeight: 600,
            color: '#6B7280', marginBottom: 6,
          }}>
            Message avis positif
          </label>
          <textarea
            value={autoReview.message_positif}
            onChange={(e) => setAutoReview({ ...autoReview, message_positif: e.target.value })}
            rows={2}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: '1px solid #E5E7EB', fontSize: 14,
              background: '#F9FAFB', color: '#111827',
              boxSizing: 'border-box', resize: 'vertical',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{
            display: 'block', fontSize: 12, fontWeight: 600,
            color: '#6B7280', marginBottom: 6,
          }}>
            Message avis négatif
          </label>
          <textarea
            value={autoReview.message_negatif}
            onChange={(e) => setAutoReview({ ...autoReview, message_negatif: e.target.value })}
            rows={2}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: '1px solid #E5E7EB', fontSize: 14,
              background: '#F9FAFB', color: '#111827',
              boxSizing: 'border-box', resize: 'vertical',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{
            display: 'block', fontSize: 12, fontWeight: 600,
            color: '#6B7280', marginBottom: 6,
          }}>
            Délai de relance (heures)
          </label>
          <input
            type="number"
            min="1"
            max="168"
            value={autoReview.delai_relance}
            onChange={(e) => setAutoReview({ ...autoReview, delai_relance: parseInt(e.target.value) || 24 })}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: '1px solid #E5E7EB', fontSize: 14,
              background: '#F9FAFB', color: '#111827',
              boxSizing: 'border-box',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block', fontSize: 12, fontWeight: 600,
            color: '#6B7280', marginBottom: 6,
          }}>
            Canal d'envoi
          </label>
          <select
            value={autoReview.canal}
            onChange={(e) => setAutoReview({ ...autoReview, canal: e.target.value as 'email' | 'sms' | 'push' })}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: '1px solid #E5E7EB', fontSize: 14,
              background: 'white', color: '#111827',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            <option value="email">📧 Email</option>
            <option value="sms">📱 SMS</option>
            <option value="push">🔔 Notification push</option>
          </select>
        </div>

        {reviewMsg && (
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: reviewMsg.startsWith('✅') ? '#D1FAE5' : '#FEE2E2',
            fontSize: 13, fontWeight: 600,
            color: reviewMsg.startsWith('✅') ? '#059669' : '#DC2626',
          }}>
            {reviewMsg}
          </div>
        )}

        <button
          onClick={saveAutoReview}
          disabled={savingReview}
          style={{
            width: '100%', marginTop: 12,
            background: savingReview ? '#9CA3AF' : '#6C63FF',
            color: 'white', border: 'none', borderRadius: 12,
            padding: '14px 20px', fontSize: 15, fontWeight: 700,
            cursor: savingReview ? 'not-allowed' : 'pointer',
          }}
        >
          {savingReview ? 'Enregistrement...' : '💾 Enregistrer les avis auto'}
        </button>
      </div>
    </MobileLayout>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 48, height: 28, borderRadius: 14,
        background: checked ? '#6C63FF' : '#D1D5DB',
        border: 'none', cursor: 'pointer', position: 'relative',
        padding: 0, transition: 'background 0.2s',
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: 11,
        background: 'white', position: 'absolute', top: 3,
        left: checked ? 23 : 3,
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </button>
  );
}

function RewardLevelCard({
  level, label, visits, action, points, color,
  onLabelChange, onVisitsChange, onActionChange, onPointsChange,
}: {
  level: number; label: string; visits: number; action: string;
  points: number; color: string;
  onLabelChange: (v: string) => void;
  onVisitsChange: (v: number) => void;
  onActionChange: (v: string) => void;
  onPointsChange: (v: number) => void;
}) {
  return (
    <div style={{
      background: '#F9FAFB', borderRadius: 12, padding: 14,
      marginBottom: 10, border: `2px solid ${color}20`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
      }}>
        <span style={{ fontSize: 20 }}>
          {level === 1 ? '🥉' : level === 2 ? '🥈' : '🥇'}
        </span>
        <h4 style={{
          fontSize: 14, fontWeight: 700, color: '#111827', margin: 0,
        }}>
          Niveau {level} — {label || 'Palier'}
        </h4>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 600,
            color: '#9CA3AF', marginBottom: 4,
          }}>
            Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 8,
              border: '1px solid #E5E7EB', fontSize: 13,
              background: 'white', color: '#111827',
              boxSizing: 'border-box',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          />
        </div>
        <div>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 600,
            color: '#9CA3AF', marginBottom: 4,
          }}>
            Visites requises
          </label>
          <input
            type="number"
            min="1"
            value={visits}
            onChange={(e) => onVisitsChange(parseInt(e.target.value) || 1)}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 8,
              border: '1px solid #E5E7EB', fontSize: 13,
              background: 'white', color: '#111827',
              boxSizing: 'border-box',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          />
        </div>
        <div>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 600,
            color: '#9CA3AF', marginBottom: 4,
          }}>
            Récompense
          </label>
          <input
            type="text"
            value={action}
            onChange={(e) => onActionChange(e.target.value)}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 8,
              border: '1px solid #E5E7EB', fontSize: 13,
              background: 'white', color: '#111827',
              boxSizing: 'border-box',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          />
        </div>
        <div>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 600,
            color: '#9CA3AF', marginBottom: 4,
          }}>
            Points bonus
          </label>
          <input
            type="number"
            min="0"
            value={points}
            onChange={(e) => onPointsChange(parseInt(e.target.value) || 0)}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 8,
              border: '1px solid #E5E7EB', fontSize: 13,
              background: 'white', color: '#111827',
              boxSizing: 'border-box',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          />
        </div>
      </div>
    </div>
  );
}
