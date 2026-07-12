import { useEffect, useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { analyticsApi, notificationsApi, type ClientDormant } from '@/services/api';
import { formatNumber, formatPercent, formatDate } from '@/utils/format';
import {
  CreditCard, Users, Bell, Clock, Star, Tag,
  TrendingUp, BarChart3, Send
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [cards, setCards] = useState<any>(null);
  const [notifs, setNotifs] = useState<any>(null);
  const [dormants, setDormants] = useState<ClientDormant[]>([]);
  const [avisStats, setAvisStats] = useState<any>(null);
  const [offresStats, setOffresStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [relanceLoading, setRelanceLoading] = useState(false);

  // Données enrichies type Panthera
  const [commercantOverview, setCommercantOverview] = useState<any>(null);
  const [clientsActifs, setClientsActifs] = useState(0);
  const [clientsDormants, setClientsDormants] = useState(0);
  const [clientsPerdus, setClientsPerdus] = useState(0);
  const [tauxRetention, setTauxRetention] = useState(0);
  const [meilleursClients, setMeilleursClients] = useState<any[]>([]);
  const [clientsRecents, setClientsRecents] = useState<any[]>([]);

  useEffect(() => {
    Promise.allSettled([
      analyticsApi.overview(),
      analyticsApi.cards(),
      analyticsApi.notifications(),
      analyticsApi.clientsDormants(),
      analyticsApi.avis(),
      analyticsApi.offres(),
      analyticsApi.commercant(),
    ]).then(([ov, ca, no, do_, av, of_, co]) => {
      if (ov.status === 'fulfilled') setOverview(ov.value);
      if (ca.status === 'fulfilled') setCards(ca.value);
      if (no.status === 'fulfilled') setNotifs(no.value);
      if (do_.status === 'fulfilled') setDormants(do_.value.clients || []);
      if (av.status === 'fulfilled') setAvisStats(av.value);
      if (of_.status === 'fulfilled') setOffresStats(of_.value);
      if (co.status === 'fulfilled') {
        const data = co.value;
        setCommercantOverview(data);
        setClientsActifs(data?.clientsActifs ?? 0);
        setClientsDormants(data?.clientsDormants ?? 0);
        setClientsPerdus(data?.clientsPerdus ?? 0);
        setTauxRetention(data?.tauxRetention ?? 0);
        setMeilleursClients(data?.meilleursClients ?? []);
        setClientsRecents(data?.clientsRecents ?? []);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleRelance = async () => {
    setRelanceLoading(true);
    try {
      await notificationsApi.send(
        'On ne vous a pas vu depuis un moment 👋',
        'Votre fidélité compte pour nous ! Venez récupérer vos avantages.',
        'dormants'
      );
      alert('Notification de relance envoyée aux clients dormants !');
    } catch (e: any) {
      alert(e?.message);
    } finally { setRelanceLoading(false); }
  };

  return (
    <DashboardLayout>
      <Head><title>Analytics — Stamply</title></Head>

      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Vue détaillée des performances de votre programme</p>
      </div>

      {loading ? <PageSpinner /> : (
        <div className="space-y-6">
          {/* Overview KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total cartes" value={formatNumber(overview?.totalCartes ?? 0)} icon={CreditCard} iconBg="bg-primary-50" iconColor="text-primary-600" trend={{ value: `+${overview?.cartesInstalleesCetteSemaine ?? 0} cette semaine`, positive: true }} />
            <StatCard label="Visites (30j)" value={formatNumber(overview?.visitesLastMonth ?? 0)} icon={TrendingUp} iconBg="bg-green-50" iconColor="text-green-600" />
            <StatCard label="Notifications" value={formatNumber(overview?.totalNotifications ?? 0)} icon={Bell} iconBg="bg-blue-50" iconColor="text-blue-600" />
            <StatCard label="Clients dormants" value={formatNumber(overview?.clientsDormants ?? 0)} icon={Clock} iconBg="bg-orange-50" iconColor="text-orange-600" />
          </div>

          {/* Performances clés type Panthera */}
          {commercantOverview && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Chiffre d'affaires brut" value={`${formatNumber(commercantOverview.chiffreAffairesBrut || 0)} €`} icon={TrendingUp} iconBg="bg-green-50" iconColor="text-green-600" trend={commercantOverview.evolutionCA ? { value: `+${commercantOverview.evolutionCA}%`, positive: true } : undefined} />
              <StatCard label="Revenus de fidélité" value={`${formatNumber(commercantOverview.revenusFidelite || 0)} €`} icon={TrendingUp} iconBg="bg-blue-50" iconColor="text-blue-600" />
              <StatCard label="Valeur vie client" value={`${commercantOverview.valeurVieClient || 0} €`} icon={Users} iconBg="bg-purple-50" iconColor="text-purple-600" trend={commercantOverview.evolutionCLV ? { value: `+${commercantOverview.evolutionCLV}%`, positive: true } : undefined} />
              <StatCard label="ROI" value={`1 € → ${commercantOverview.roi || '0,00'} €`} icon={TrendingUp} iconBg="bg-orange-50" iconColor="text-orange-600" trend={commercantOverview.evolutionROI ? { value: `+${commercantOverview.evolutionROI}%`, positive: true } : undefined} />
            </div>
          )}

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cartes evolution */}
            <Card>
              <CardHeader><CardTitle>Évolution des cartes installées</CardTitle></CardHeader>
              <CardBody>
                {cards?.timeSeries?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={cards.timeSeries}>
                      <defs>
                        <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="cumul" name="Cartes" stroke="#6366f1" fill="url(#grad1)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <Empty label="Aucune donnée" />}
              </CardBody>
            </Card>

            {/* Visites par jour */}
            <Card>
              <CardHeader><CardTitle>Visites par jour (30j)</CardTitle></CardHeader>
              <CardBody>
                {cards?.visitesParJour?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={cards.visitesParJour}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Visites" fill="#22c55e" radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <Empty label="Aucune visite" />}
              </CardBody>
            </Card>
          </div>

          {/* Notifications stats */}
          {notifs && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Performances notifications</CardTitle>
                  <div className="flex gap-3 text-sm text-gray-500">
                    <span>Total : {formatNumber(notifs.totalEnvoyes ?? 0)} envoyés</span>
                    <span>Taux ouverture : {formatPercent(notifs.tauxOuverture ?? 0)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                {notifs.campagnes?.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {notifs.campagnes.map((c: any, i: number) => (
                      <div key={i} className="flex items-center justify-between px-6 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{c.titre}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{c.total_envoyes} envoyés</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">{formatPercent(c.taux_ouverture ?? 0)}</p>
                            <p className="text-xs text-gray-400">taux ouverture</p>
                          </div>
                          <Badge variant={c.simulation ? 'yellow' : 'blue'}>{c.cible}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-gray-400">Aucune campagne</div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Dormants */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Clients dormants ({dormants.length})</CardTitle>
                {dormants.length > 0 && (
                  <Button size="sm" loading={relanceLoading} onClick={handleRelance}>
                    <Send className="h-3.5 w-3.5" />
                    Relance automatique
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {dormants.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucun client dormant — bravo !</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {dormants.slice(0, 10).map((c, i) => (
                    <div key={c.id || i} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <p className="text-xs font-mono text-gray-600">{c.carte?.pass_serial_number || c.id.slice(0, 8) + '…'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {c.derniere_visite ? `Dernière visite : ${formatDate(c.derniere_visite)}` : 'Jamais visité'}
                        </p>
                      </div>
                      <Badge variant={c.jours_inactif > 60 ? 'red' : 'yellow'}>
                        {c.jours_inactif}j inactif
                      </Badge>
                    </div>
                  ))}
                  {dormants.length > 10 && (
                    <div className="px-6 py-3 text-xs text-gray-400 text-center">
                      + {dormants.length - 10} autres clients
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Avis stats */}
          {avisStats && !avisStats.moduleDesactive && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Distribution des avis</CardTitle></CardHeader>
                <CardBody>
                  {avisStats.distribution?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={avisStats.distribution} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="note" type="category" tick={{ fontSize: 11 }} tickFormatter={v => `${v}★`} />
                        <Tooltip />
                        <Bar dataKey="total" name="Avis" fill="#6366f1" radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <Empty label="Aucun avis" />}
                </CardBody>
              </Card>
              <Card>
                <CardHeader><CardTitle>Statistiques avis</CardTitle></CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Note moyenne</span>
                      <span className="text-sm font-semibold">{(avisStats.moyenneNote ?? 0).toFixed(1)} / 5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Taux de réponse</span>
                      <span className="text-sm font-semibold">{formatPercent(avisStats.tauxReponse ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total avis</span>
                      <span className="text-sm font-semibold">{avisStats.total ?? 0}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Offres stats */}
          {offresStats && !offresStats.moduleDesactive && !offresStats.tableManquante && (
            <Card>
              <CardHeader><CardTitle>Performances des offres flash</CardTitle></CardHeader>
              <CardBody>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total envoyées', value: formatNumber(offresStats.totalEnvoyes ?? 0) },
                    { label: 'Total utilisées', value: formatNumber(offresStats.totalUtilises ?? 0) },
                    { label: 'Taux conversion', value: formatPercent(offresStats.tauxUtilisation ?? 0) },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Rétention clients */}
          <Card>
            <CardHeader>
              <CardTitle>Rétention clients</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(clientsActifs)}</p>
                  <p className="text-xs text-gray-500 mt-1">Clients actifs (30j)</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">{formatNumber(clientsDormants)}</p>
                  <p className="text-xs text-gray-500 mt-1">Clients dormants</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{formatNumber(clientsPerdus)}</p>
                  <p className="text-xs text-gray-500 mt-1">Clients perdus</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-indigo-600">{formatNumber(tauxRetention)}%</p>
                  <p className="text-xs text-gray-500 mt-1">Taux de rétention</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Top clients */}
          {meilleursClients?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>🏆 Meilleurs clients</CardTitle></CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-gray-50">
                  {meilleursClients.map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-300">#{i + 1}</span>
                        <p className="text-sm font-medium text-gray-900">{c.nom || `Client #${i + 1}`}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{c.total_visites} visites</span>
                        <span className="font-semibold text-indigo-600">{c.tampons} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Clients récents */}
          {clientsRecents?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>👥 Clients récents</CardTitle></CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-gray-50">
                  {clientsRecents.slice(0, 10).map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between px-6 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{c.client_nom || 'Anonyme'}</p>
                        <p className="text-xs text-gray-400">{c.client_email || ''}{c.client_email && c.client_telephone ? ' · ' : ''}{c.client_telephone || ''}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{c.total_visites} visites</span>
                        <span className="font-semibold">{c.tampons} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">{label}</div>
  );
}
