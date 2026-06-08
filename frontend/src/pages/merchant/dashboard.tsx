import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { MobileLayout } from '@/components/layout/MobileLayout';

interface DashboardData {
  visites_aujourd_hui: number;
  visites_total: number;
  points_moyen: number;
  clients_actifs: number;
  derniers_scans: Array<{
    id: string;
    points: number;
    qr_type: string;
    created_at: string;
  }>;
}

export default function MobileDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [commercant, setCommercant] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const commercantStr = localStorage.getItem('commercant');
    if (!token || !commercantStr) {
      router.replace('/login');
      return;
    }
    setCommercant(JSON.parse(commercantStr));
    fetchDashboard(token);
  }, [router]);

  async function fetchDashboard(token: string) {
    try {
      // Fetch analytics dashboard
      const res = await fetch('/api/analytics/dashboard?periode=7d', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();

      if (result.success) {
        const d = result.data;
        setData({
          visites_aujourd_hui: Object.values(d.visites.par_jour || {})
            .reduce((a: any, b: any) => a + b, 0) as number,
          visites_total: d.visites.total,
          points_moyen: d.avis.moyenne || 0,
          clients_actifs: d.clients.uniques,
          derniers_scans: [],
        });
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <MobileLayout title="Chargement...">
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
          Chargement...
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title={`Bonjour ${commercant?.nom_enseigne || ''} 👋`}>
      {/* Quick stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        marginBottom: 20,
      }}>
        <StatCard
          icon="📱"
          label="Visites aujourd'hui"
          value={data?.visites_aujourd_hui || 0}
          color="#6C63FF"
        />
        <StatCard
          icon="📊"
          label="Visites 7 jours"
          value={data?.visites_total || 0}
          color="#10B981"
        />
        <StatCard
          icon="⭐"
          label="Note moyenne"
          value={data?.points_moyen?.toFixed(1) || '—'}
          color="#F59E0B"
        />
        <StatCard
          icon="👥"
          label="Clients actifs"
          value={data?.clients_actifs || 0}
          color="#EC4899"
        />
      </div>

      {/* Quick actions */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 12 }}>
          Actions rapides
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <QuickAction
            icon="📷"
            label="Scanner QR"
            onClick={() => router.push('/merchant/scan')}
            color="#6C63FF"
          />
          <QuickAction
            icon="🏪"
            label="Mes boutiques"
            onClick={() => router.push('/merchant/boutiques')}
            color="#10B981"
          />
          <QuickAction
            icon="🎁"
            label="Récompenses"
            onClick={() => router.push('/merchant/rewards')}
            color="#F59E0B"
          />
          <QuickAction
            icon="📊"
            label="Statistiques"
            onClick={() => router.push('/merchant/analytics')}
            color="#EC4899"
          />
        </div>
      </div>

      {/* Recent activity */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 12 }}>
          Activité récente
        </h3>
        {data?.derniers_scans?.length ? (
          data.derniers_scans.map((scan) => (
            <div key={scan.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 0', borderBottom: '1px solid #f3f4f6',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>
                  {scan.qr_type === 'dynamic' ? '📱' : '📷'}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                    Scan {scan.qr_type === 'dynamic' ? 'QR dynamique' : 'QR statique'}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                    {new Date(scan.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: 14, fontWeight: 700, color: '#6C63FF',
              }}>
                +{scan.points} pts
              </span>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 13 }}>
            Aucune activité récente
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: string; label: string; value: number | string; color: string;
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function QuickAction({ icon, label, onClick, color }: {
  icon: string; label: string; onClick: () => void; color: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: `${color}10`,
        border: 'none',
        borderRadius: 12,
        padding: '14px 10px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
    </button>
  );
}
