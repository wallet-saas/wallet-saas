/**
 * Stamply — Dashboard Analytics Admin (style Whop)
 */

import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const API_URL = '/api/analytics/v2';

const COLORS = {
  primary: '#6366f1',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  purple: '#8b5cf6',
};

const formatEUR = (value: number | string) => `${Number(value).toLocaleString('fr-FR')} €`;
const formatPercent = (value: number | string) => `${Number(value)}%`;
const formatNumber = (value: number | string) => Number(value).toLocaleString('fr-FR');

interface AnalyticsData {
  mrr: { mrr: number; annual_run_rate: number; paying_customers: number };
  churn: { churn_rate: number; churned_30j: number; previous_actifs: number; current_actifs: number; net_change: number };
  ltv: { ltv: number; avg_lifetime_months: number; avg_lifetime_days: number; total_revenue_estimated: number; total_customers_ever: number; active_customers: number };
  arpu: { arpu_monthly: number; arpu_annual: number; paying_customers: number; mrr: number };
  signups: Array<{ month: string; month_index: number; total: number; new_signups: number; actifs: number }>;
  revenue: Array<{ month: string; month_index: number; revenue: number; paying_customers: number }>;
  retention: Array<{ month: string; signed: number; retained: number; retention_rate: number }>;
  scans: { scans_7j: number; scans_30j: number; avg_per_day_30j: number; daily: Array<{ day: string; scans: number }> };
  top_commercants: Array<{ id: number; nom: string; statut: string; cartes: number; visites: number; inscrit_le: string }>;
  projections: {
    current_mrr: number; current_customers: number; churn_rate: number; growth_assumption: number; ltv: number;
    projections: Array<{ month: string; month_index: number; projected_mrr: number; projected_customers: number; new_customers: number; lost_customers: number }>;
  };
  price_monthly: number;
  generated_at: string;
}

function KPICard({ title, value, subtitle, icon, color = 'primary', trend = null }: {
  title: string; value: string; subtitle?: string; icon: string;
  color?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'purple'; trend?: number | null;
}) {
  const colorClasses: Record<string, string> = {
    primary: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    danger: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };
  const icons: Record<string, string> = {
    '💰': '💰', '📈': '📈', '👥': '👥', '🔄': '🔄', '⏱️': '⏱️', '🎯': '🎯',
    '📊': '📊', '💳': '💳', '🔥': '🔥', '📉': '📉', '🏆': '🏆', '🔮': '🔮',
  };
  return (
    <div className={`rounded-xl border-2 p-5 ${colorClasses[color] || colorClasses.primary} transition-shadow hover:shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-80">{title}</span>
        <span className="text-2xl">{icons[icon] || '📊'}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
      {subtitle && <div className="text-sm mt-1 opacity-70">{subtitle}</div>}
      {trend !== null && (
        <div className={`text-sm mt-2 font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs mois dernier
        </div>
      )}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { fetchAnalytics(); }, []);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token') || localStorage.getItem('stamply_admin_token') || '';
      const res = await fetch(`${API_URL}/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data as AnalyticsData);
      } else {
        setError(json.error || 'Erreur inconnue');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-lg text-gray-500 animate-pulse">Chargement des analytics...</div></div>;
  }
  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700"><p className="font-medium">❌ Erreur : {error}</p><button onClick={fetchAnalytics} className="mt-3 px-4 py-2 bg-red-100 rounded-lg hover:bg-red-200">Réessayer</button></div>;
  }
  if (!data) return null;

  const { mrr, churn, ltv, arpu, signups, revenue, retention, scans, top_commercants, projections, price_monthly } = data;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📊 Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">Mis à jour : {new Date(data.generated_at).toLocaleString('fr-FR')}</p>
        </div>
        <button onClick={fetchAnalytics} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-medium text-sm">🔄 Actualiser</button>
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-0 flex-wrap">
        {(['overview', 'revenue', 'retention', 'engagement', 'projections'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab === 'overview' && "📊 Vue d'ensemble"}
            {tab === 'revenue' && '💰 Revenus'}
            {tab === 'retention' && '🔄 Rétention'}
            {tab === 'engagement' && '🎯 Engagement'}
            {tab === 'projections' && '🔮 Projections'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="MRR" value={formatEUR(mrr.mrr)} subtitle={`ARR: ${formatEUR(mrr.annual_run_rate)}`} icon="💰" color="primary" />
            <KPICard title="Clients payants" value={formatNumber(mrr.paying_customers)} subtitle={`ARPU: ${formatEUR(arpu.arpu_monthly)}/mois`} icon="👥" color="success" />
            <KPICard title="Churn Rate" value={formatPercent(churn.churn_rate)} subtitle={`${churn.churned_30j} perdus (30j)`} icon="📉" color={churn.churn_rate > 5 ? 'danger' : 'warning'} />
            <KPICard title="LTV" value={formatEUR(ltv.ltv)} subtitle={`Durée moy.: ${ltv.avg_lifetime_months} mois`} icon="🎯" color="purple" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Évolution du MRR (12 mois)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v: number | string) => `${v}€`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatEUR(Number(value))} />
                <Area type="monotone" dataKey="revenue" stroke={COLORS.primary} fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Inscriptions par mois</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={signups}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="new_signups" name="Nouveaux" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actifs" name="Actifs" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top 10 Commerçants</h3>
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {top_commercants.map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-300 w-6">#{i + 1}</span>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{c.nom}</div>
                        <div className="text-xs text-gray-500">{c.visites} visites · {c.cartes} cartes</div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.statut === 'actif' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{c.statut}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard title="MRR Mensuel" value={formatEUR(mrr.mrr)} subtitle="Revenu mensuel récurrent" icon="💰" color="primary" />
            <KPICard title="ARR Annualisé" value={formatEUR(mrr.annual_run_rate)} subtitle="Projection annuelle" icon="📈" color="success" />
            <KPICard title="Revenu total estimé" value={formatEUR(ltv.total_revenue_estimated)} subtitle={`${ltv.total_customers_ever} clients total`} icon="💳" color="info" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Revenus mensuels</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient id="colorRev2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v: number | string) => `${v}€`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatEUR(Number(value))} />
                <Area type="monotone" dataKey="revenue" name="MRR" stroke={COLORS.success} fill="url(#colorRev2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Détail mensuel</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Mois</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Clients</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">MRR</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">/ client</th>
                </tr></thead>
                <tbody>
                  {revenue.slice().reverse().map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{row.month}</td>
                      <td className="py-3 px-4 text-right">{row.paying_customers}</td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600">{formatEUR(row.revenue)}</td>
                      <td className="py-3 px-4 text-right text-gray-500">{formatEUR(price_monthly)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'retention' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard title="Churn Rate" value={formatPercent(churn.churn_rate)} subtitle={`${churn.churned_30j} clients perdus (30j)`} icon="📉" color={churn.churn_rate > 5 ? 'danger' : 'success'} />
            <KPICard title="Net Change (30j)" value={churn.net_change > 0 ? `+${churn.net_change}` : `${churn.net_change}`} subtitle={`${churn.previous_actifs} → ${churn.current_actifs}`} icon="🔄" color={churn.net_change >= 0 ? 'success' : 'danger'} />
            <KPICard title="LTV Moyen" value={formatEUR(ltv.ltv)} subtitle={`${ltv.avg_lifetime_months} mois moyen`} icon="⏱️" color="purple" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔄 Rétention par cohorte</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={retention}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip /><Legend />
                <Bar dataKey="signed" name="Inscrits" fill={COLORS.info} radius={[4, 4, 0, 0]} />
                <Bar dataKey="retained" name="Retenus" fill={COLORS.success} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Taux de rétention</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Cohorte</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Inscrits</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Retenus</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Taux</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Visualisation</th>
                </tr></thead>
                <tbody>
                  {retention.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{row.month}</td>
                      <td className="py-3 px-4 text-right">{row.signed}</td>
                      <td className="py-3 px-4 text-right">{row.retained}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-semibold ${row.retention_rate >= 70 ? 'text-emerald-600' : row.retention_rate >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{row.retention_rate}%</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${row.retention_rate >= 70 ? 'bg-emerald-500' : row.retention_rate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, row.retention_rate)}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'engagement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard title="Scans 7j" value={formatNumber(scans.scans_7j)} subtitle={`${scans.avg_per_day_30j}/j en moyenne`} icon="🔥" color="warning" />
            <KPICard title="Scans 30j" value={formatNumber(scans.scans_30j)} subtitle="Total 30 derniers jours" icon="📊" color="primary" />
            <KPICard title="Moyenne/jour" value={`${scans.avg_per_day_30j}`} subtitle="Sur 30 jours" icon="📈" color="success" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Scans quotidiens (30j)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={scans.daily}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="scans" name="Scans" stroke={COLORS.warning} fill="url(#colorScans)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Classement engagement</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top_commercants.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="nom" type="category" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="visites" name="Visites" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'projections' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">🔮 Projections 12 mois</h3>
            <p className="text-sm opacity-80">Basé sur {projections.current_customers} clients actifs, {formatEUR(projections.current_mrr)} MRR, {projections.churn_rate}% churn, et {projections.growth_assumption}% croissance mensuelle.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard title="MRR actuel" value={formatEUR(projections.current_mrr)} subtitle={`${projections.current_customers} clients`} icon="💰" color="primary" />
            <KPICard title="Churn mensuel" value={formatPercent(projections.churn_rate)} subtitle="Taux de perte" icon="📉" color="danger" />
            <KPICard title="Croissance" value={`+${projections.growth_assumption}%/mois`} subtitle="Hypothèse" icon="📈" color="success" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Projection MRR (12 mois)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={projections.projections}>
                <defs>
                  <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v: number | string) => `${v}€`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatEUR(Number(value))} />
                <Area type="monotone" dataKey="projected_mrr" name="MRR Projeté" stroke={COLORS.purple} fill="url(#colorProj)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Détail projections</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Mois</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">MRR</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Clients</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">+Nouveaux</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">-Perdus</th>
                </tr></thead>
                <tbody>
                  {projections.projections.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{row.month}</td>
                      <td className="py-3 px-4 text-right font-semibold text-purple-600">{formatEUR(row.projected_mrr)}</td>
                      <td className="py-3 px-4 text-right">{row.projected_customers}</td>
                      <td className="py-3 px-4 text-right text-emerald-600">+{row.new_customers}</td>
                      <td className="py-3 px-4 text-right text-red-600">-{row.lost_customers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
