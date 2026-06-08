import { useEffect, useState, useCallback } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';

interface Reward {
  id: string;
  client_nom: string;
  client_email?: string;
  niveau: 1 | 2 | 3;
  label_niveau: string;
  action: string;
  points: number;
  qr_type: 'dynamic' | 'static';
  created_at: string;
  boutique_nom?: string;
}

interface RewardStats {
  total_recompenses: number;
  par_niveau: { 1: number; 2: number; 3: number };
  par_action: Record<string, number>;
  points_total: number;
  clients_recompenses: number;
}

const LEVEL_COLORS: Record<number, string> = {
  1: '#CD7F32',
  2: '#C0C0C0',
  3: '#FFD700',
};

const LEVEL_ICONS: Record<number, string> = {
  1: '🥉',
  2: '🥈',
  3: '🥇',
};

const LEVEL_LABELS: Record<number, string> = {
  1: 'Bronze',
  2: 'Argent',
  3: 'Or',
};

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [stats, setStats] = useState<RewardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getToken = useCallback(() => {
    return localStorage.getItem('token');
  }, []);

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      setError('');

      const [rewardsRes, statsRes] = await Promise.all([
        fetch('/api/rewards', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch('/api/rewards/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
      ]);

      if (rewardsRes) {
        const result = await rewardsRes.json();
        if (result.success) {
          setRewards(result.data || []);
        }
      }
      if (statsRes) {
        const result = await statsRes.json();
        if (result.success) {
          setStats(result.data);
        }
      }
    } catch (err) {
      console.error('Rewards fetch error:', err);
      setError('Erreur lors du chargement des récompenses');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <MobileLayout title="Récompenses">
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🎁</div>
          Chargement des récompenses...
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Récompenses">
      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 12, padding: '12px 16px', marginBottom: 16,
          color: '#DC2626', fontSize: 13, fontWeight: 500,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats overview */}
      {stats && (
        <>
          {/* Total rewards card */}
          <div style={{
            background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)',
            borderRadius: 16, padding: 20, marginBottom: 16,
            color: 'white',
          }}>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>
              Total récompenses
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 4 }}>
              {stats.total_recompenses}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {stats.clients_recompenses} clients récompensés · {stats.points_total} points distribués
            </div>
          </div>

          {/* By level */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10, marginBottom: 16,
          }}>
            {([1, 2, 3] as const).map((level) => (
              <div
                key={level}
                style={{
                  background: 'white', borderRadius: 14, padding: 14,
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  borderTop: `3px solid ${LEVEL_COLORS[level]}`,
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>
                  {LEVEL_ICONS[level]}
                </div>
                <div style={{
                  fontSize: 20, fontWeight: 700, color: '#111827',
                }}>
                  {stats.par_niveau?.[level] || 0}
                </div>
                <div style={{
                  fontSize: 11, color: '#6B7280', fontWeight: 600,
                }}>
                  {LEVEL_LABELS[level]}
                </div>
              </div>
            ))}
          </div>

          {/* By action */}
          {stats.par_action && Object.keys(stats.par_action).length > 0 && (
            <div style={{
              background: 'white', borderRadius: 16, padding: 16,
              marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <h3 style={{
                fontSize: 14, fontWeight: 700, color: '#374151',
                marginBottom: 12, marginTop: 0,
              }}>
                📋 Par type de récompense
              </h3>
              {Object.entries(stats.par_action).map(([action, count]) => (
                <div
                  key={action}
                  style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '10px 0',
                    borderBottom: '1px solid #F3F4F6',
                  }}
                >
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                    {action}
                  </span>
                  <span style={{
                    fontSize: 14, fontWeight: 700, color: '#6C63FF',
                    }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Recent rewards list */}
      <div style={{
        background: 'white', borderRadius: 16, padding: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <h3 style={{
          fontSize: 14, fontWeight: 700, color: '#374151',
          marginBottom: 12, marginTop: 0,
        }}>
          🎁 Récompenses récentes
        </h3>

        {rewards.length > 0 ? (
          rewards.slice(0, 20).map((reward) => (
            <div
              key={reward.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0', borderBottom: '1px solid #F3F4F6',
              }}
            >
              {/* Badge icon */}
              <div style={{
                width: 42, height: 42, borderRadius: 21,
                background: `${LEVEL_COLORS[reward.niveau]}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>
                {LEVEL_ICONS[reward.niveau]}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 600, color: '#111827',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {reward.client_nom}
                </div>
                <div style={{
                  fontSize: 11, color: '#9CA3AF',
                  display: 'flex', alignItems: 'center', gap: 6, marginTop: 2,
                }}>
                  <span style={{
                    display: 'inline-block',
                    background: `${LEVEL_COLORS[reward.niveau]}20`,
                    color: LEVEL_COLORS[reward.niveau],
                    padding: '2px 6px', borderRadius: 4,
                    fontSize: 10, fontWeight: 700,
                  }}>
                    {reward.label_niveau || LEVEL_LABELS[reward.niveau]}
                  </span>
                  <span>{reward.action}</span>
                </div>
                <div style={{
                  fontSize: 10, color: '#9CA3AF', marginTop: 2,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span>
                    {reward.qr_type === 'dynamic' ? '📱 QR dynamique' : '📷 QR statique'}
                  </span>
                  <span>·</span>
                  <span>
                    {new Date(reward.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Points */}
              <div style={{
                fontSize: 16, fontWeight: 700, color: '#6C63FF',
                flexShrink: 0,
              }}>
                +{reward.points}
              </div>
            </div>
          ))
        ) : (
          <div style={{
            textAlign: 'center', padding: '30px 0', color: '#9CA3AF',
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎁</div>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              Aucune récompense
            </p>
            <p style={{ fontSize: 12 }}>
              Les récompenses apparaîtront ici après les scans QR
            </p>
          </div>
        )}
      </div>

      {/* Info about QR types */}
      <div style={{
        marginTop: 16, background: '#EEF2FF', borderRadius: 12,
        padding: '14px 16px',
      }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: '#4F46E5', marginBottom: 6,
        }}>
          💡 Types de QR codes supportés
        </div>
        <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.6 }}>
          <div><strong style={{ color: '#374151' }}>QR dynamique :</strong> Code unique par client, suit l'historique</div>
          <div><strong style={{ color: '#374151' }}>QR statique :</strong> Code fixe imprimé, compte les visites</div>
        </div>
      </div>
    </MobileLayout>
  );
}
