import { useEffect, useState, useCallback } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';

interface DashboardData {
  visites: {
    total: number;
    par_jour: Record<string, number>;
  };
  clients: {
    uniques: number;
  };
  avis: {
    moyenne: number;
    total: number;
  };
}

interface WeeklyVisit {
  jour: string;
  visites: number;
}

interface TopClient {
  id: string;
  nom: string;
  visites: number;
  points: number;
}

interface RevenueData {
  total: number;
  par_jour: Record<string, number>;
  devise: string;
}

const DAYS_FR: Record<string, string> = {
  Monday: 'Lun',
  Tuesday: 'Mar',
  Wednesday: 'Mer',
  Thursday: 'Jeu',
  Friday: 'Ven',
  Saturday: 'Sam',
  Sunday: 'Dim',
};

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [weeklyVisits, setWeeklyVisits] = useState<WeeklyVisit[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getToken = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return token;
  }, []);

  const fetchAll = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      setError('');

      const [dashRes, visitsRes, clientsRes, revenueRes] = await Promise.all([
        fetch('/api/analytics/dashboard?periode=7d', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch('/api/analytics/visites-hebdo', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch('/api/analytics/clients-top', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch('/api/analytics/revenus-estimes', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
      ]);

      if (dashRes) {
        const result = await dashRes.json();
        if (result.success) setDashboard(result.data);
      }
      if (visitsRes) {
        const result = await visitsRes.json();
        if (result.success) setWeeklyVisits(result.data || []);
      }
      if (clientsRes) {
        const result = await clientsRes.json();
        if (result.success) setTopClients(result.data || []);
      }
      if (revenueRes) {
        const result = await revenueRes.json();
        if (result.success) setRevenue(result.data);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <MobileLayout title="Statistiques">
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>📊</div>
          Chargement des statistiques...
        </div>
      </MobileLayout>
    );
  }

  const maxVisits = Math.max(
    ...weeklyVisits.map((v) => v.visites),
    1
  );

  return (
    <MobileLayout title="Statistiques">
      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 12, padding: '12px 16px', marginBottom: 16,
          color: '#DC2626', fontSize: 13, fontWeight: 500,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Summary cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 12, marginBottom: 20,
      }}>
        <StatCard
          icon="📱"
          label="Visites 7j"
          value={dashboard?.visites?.total || 0}
          color="#6C63FF"
        />
        <StatCard
          icon="👥"
          label="Clients uniques"
          value={dashboard?.clients?.uniques || 0}
          color="#10B981"
        />
        <StatCard
          icon="⭐"
          label="Note moyenne"
          value={dashboard?.avis?.moyenne?.toFixed(1) || '—'}
          color="#F59E0B"
        />
        <StatCard
          icon="💰"
          label="Revenu estimé"
          value={`${revenue?.total?.toFixed(0) || 0} ${revenue?.devise || '€'}`}
          color="#EC4899"
        />
      </div>

      {/* Weekly visits bar chart */}
      <div style={{
        background: 'white', borderRadius: 16, padding: 16,
        marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <h3 style={{
          fontSize: 14, fontWeight: 700, color: '#374151',
          marginBottom: 16, marginTop: 0,
        }}>
          📈 Visites de la semaine
        </h3>

        {weeklyVisits.length > 0 ? (
          <div style={{
            display: 'flex', alignItems: 'flex-end',
            justifyContent: 'space-between', gap: 6, height: 140,
          }}>
            {weeklyVisits.map((v) => {
              const height = maxVisits > 0 ? (v.visites / maxVisits) * 100 : 0;
              const dayLabel = DAYS_FR[v.jour] || v.jour.substring(0, 3);
              return (
                <div
                  key={v.jour}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'flex-end',
                    height: '100%',
                  }}
                >
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: '#6C63FF',
                    marginBottom: 4,
                  }}>
                    {v.visites}
                  </span>
                  <div
                    style={{
                      width: '100%', maxWidth: 36,
                      height: `${Math.max(height, 4)}%`,
                      background: 'linear-gradient(180deg, #6C63FF 0%, #4F46E5 100%)',
                      borderRadius: '6px 6px 2px 2px',
                      minHeight: 4,
                      transition: 'height 0.3s ease',
                    }}
                  />
                  <span style={{
                    fontSize: 10, color: '#9CA3AF', marginTop: 6,
                    fontWeight: 500,
                  }}>
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '20px 0',
            color: '#9CA3AF', fontSize: 13,
          }}>
            Aucune donnée disponible
          </div>
        )}
      </div>

      {/* Top clients */}
      <div style={{
        background: 'white', borderRadius: 16, padding: 16,
        marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <h3 style={{
          fontSize: 14, fontWeight: 700, color: '#374151',
          marginBottom: 12, marginTop: 0,
        }}>
          🏆 Top clients
        </h3>

        {topClients.length > 0 ? (
          topClients.slice(0, 5).map((client, index) => (
            <div
              key={client.id}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '12px 0', borderBottom: '1px solid #F3F4F6',
                gap: 12,
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 16,
                background: index === 0 ? '#FEF3C7' : index === 1 ? '#E5E7EB' : index === 2 ? '#FED7AA' : '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 14, fontWeight: 600, color: '#111827',
                }}>
                  {client.nom}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                  {client.visites} visites · {client.points} points
                </div>
              </div>
              <div style={{
                fontSize: 14, fontWeight: 700, color: '#6C63FF',
              }}>
                {client.points} pts
              </div>
            </div>
          ))
        ) : (
          <div style={{
            textAlign: 'center', padding: '20px 0',
            color: '#9CA3AF', fontSize: 13,
          }}>
            Aucun client pour le moment
          </div>
        )}
      </div>

      {/* Revenue estimate */}
      {revenue && (
        <div style={{
          background: 'white', borderRadius: 16, padding: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <h3 style={{
            fontSize: 14, fontWeight: 700, color: '#374151',
            marginBottom: 12, marginTop: 0,
          }}>
            💰 Revenus estimés
          </h3>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 24,
              background: '#EC489910',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>
              💵
            </div>
            <div>
              <div style={{
                fontSize: 24, fontWeight: 700, color: '#111827',
              }}>
                {revenue.total.toFixed(2)} {revenue.devise || '€'}
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                Estimation sur 7 jours
              </div>
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: string; label: string; value: number | string; color: string;
}) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>{label}</div>
    </div>
  );
}
