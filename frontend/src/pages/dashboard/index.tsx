import { useEffect, useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { analyticsApi, type AnalyticsOverview } from '@/services/api';
import { formatRelative, formatNumber } from '@/utils/format';
import {
  CreditCard, Users, Bell, Clock,
  TrendingUp, TrendingDown
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';

export default function DashboardPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [cardsData, setCardsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.overview(),
      analyticsApi.cards(),
    ]).then(([ov, cards]) => {
      setOverview(ov);
      setCardsData(cards);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <Head><title>Dashboard — Stamply</title></Head>

      <div className="page-header">
        <h1 className="page-title">Vue d'ensemble</h1>
        <p className="page-subtitle">Suivez les performances de votre programme de fidélité</p>
      </div>

      {loading ? <PageSpinner /> : (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Cartes installées"
              value={formatNumber(overview?.totalCartes ?? 0)}
              icon={CreditCard}
              iconBg="bg-primary-50"
              iconColor="text-primary-600"
              trend={{
                value: `+${overview?.cartesInstalleesCetteSemaine ?? 0} cette semaine`,
                positive: true,
              }}
            />
            <StatCard
              label="Visites (30j)"
              value={formatNumber(overview?.visitesLastMonth ?? 0)}
              icon={TrendingUp}
              iconBg="bg-green-50"
              iconColor="text-green-600"
            />
            <StatCard
              label="Notifications"
              value={formatNumber(overview?.totalNotifications ?? 0)}
              icon={Bell}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              label="Clients dormants"
              value={formatNumber(overview?.clientsDormants ?? 0)}
              icon={Clock}
              iconBg="bg-orange-50"
              iconColor="text-orange-600"
              trend={
                (overview?.clientsDormants ?? 0) > 0
                  ? { value: 'À relancer', positive: false }
                  : undefined
              }
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Évolution cartes */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution des cartes installées</CardTitle>
              </CardHeader>
              <CardBody>
                {cardsData?.timeSeries?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={cardsData.timeSeries}>
                      <defs>
                        <linearGradient id="colorCards" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="cumul"
                        name="Cartes"
                        stroke="#6366f1"
                        fill="url(#colorCards)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="Aucune donnée disponible" />
                )}
              </CardBody>
            </Card>

            {/* Visites par jour */}
            <Card>
              <CardHeader>
                <CardTitle>Visites (30 derniers jours)</CardTitle>
              </CardHeader>
              <CardBody>
                {cardsData?.visitesParJour?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={cardsData.visitesParJour}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Visites"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="Aucune visite enregistrée" />
                )}
              </CardBody>
            </Card>
          </div>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Générer une carte', href: '/dashboard/cartes', color: 'text-primary-600 bg-primary-50', icon: CreditCard },
                  { label: 'Scanner une carte', href: '/dashboard/scan', color: 'text-green-600 bg-green-50', icon: Users },
                  { label: 'Envoyer notification', href: '/dashboard/notifications', color: 'text-blue-600 bg-blue-50', icon: Bell },
                  { label: 'Voir analytics', href: '/dashboard/analytics', color: 'text-purple-600 bg-purple-50', icon: TrendingUp },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-center group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">{item.label}</span>
                  </a>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
      {label}
    </div>
  );
}
