import { useEffect, useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { geolocationApi, type GeoStats } from '@/services/api';
import { formatPercent, formatNumber } from '@/utils/format';
import { MapPin, Bell, TrendingUp, Radio, CheckCircle, XCircle, Info } from 'lucide-react';

export default function GeolocalisationPage() {
  const [stats, setStats] = useState<GeoStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    geolocationApi.stats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <Head><title>Géolocalisation — Stamply</title></Head>

      <div className="page-header">
        <h1 className="page-title">Géolocalisation</h1>
        <p className="page-subtitle">Notifications de proximité automatiques</p>
      </div>

      {loading ? <PageSpinner /> : (
        <div className="space-y-6">
          {/* Status banner */}
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border ${stats?.moduleActif ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
            {stats?.moduleActif
              ? <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              : <XCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
            }
            <div>
              <p className={`text-sm font-semibold ${stats?.moduleActif ? 'text-green-700' : 'text-gray-600'}`}>
                Module {stats?.moduleActif ? 'activé' : 'désactivé'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {stats?.moduleActif
                  ? `Rayon de détection : ${stats.rayon}m — Position ${stats.positionConfiguree ? 'configurée' : 'non configurée'}`
                  : 'Activez le module dans les Paramètres pour envoyer des notifications de proximité'
                }
              </p>
            </div>
            <div className="ml-auto">
              <Badge variant={stats?.moduleActif ? 'green' : 'gray'}>
                {stats?.moduleActif ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Rayon détection"
              value={`${stats?.rayon ?? 200}m`}
              icon={Radio}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              label="Notifications envoyées"
              value={formatNumber(stats?.totalNotifications ?? 0)}
              icon={Bell}
              iconBg="bg-primary-50"
              iconColor="text-primary-600"
            />
            <StatCard
              label="Visites générées"
              value={formatNumber(stats?.totalVisitesGeoloc ?? 0)}
              icon={MapPin}
              iconBg="bg-green-50"
              iconColor="text-green-600"
            />
            <StatCard
              label="Taux de conversion"
              value={formatPercent(stats?.tauxConversion ?? 0)}
              icon={TrendingUp}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
            />
          </div>

          {/* How it works */}
          <Card>
            <CardHeader><CardTitle>Comment ça fonctionne</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    step: '1',
                    title: 'Configuration',
                    desc: 'Activez le module dans les Paramètres et définissez votre adresse GPS et le rayon de détection (50m – 500m).',
                    color: 'bg-blue-50 text-blue-600',
                  },
                  {
                    step: '2',
                    title: 'Détection proximité',
                    desc: 'Quand un client avec votre carte de fidélité s\'approche de votre commerce, une notification push est envoyée automatiquement.',
                    color: 'bg-primary-50 text-primary-600',
                  },
                  {
                    step: '3',
                    title: 'Conversion visite',
                    desc: 'Le client entre dans votre commerce et présente sa carte pour valider ses points. La visite est comptabilisée.',
                    color: 'bg-green-50 text-green-600',
                  },
                ].map(item => (
                  <div key={item.step} className="flex gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${item.color}`}>
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">{item.title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Info box */}
          <div className="flex items-start gap-3 bg-blue-50 rounded-xl px-5 py-4 border border-blue-100">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-700">Position GPS et rayon de détection</p>
              <p className="text-xs text-blue-600 mt-1">
                Configurez la latitude/longitude de votre commerce et le rayon de détection dans la section{' '}
                <a href="/dashboard/parametres" className="underline font-medium">Paramètres → Géolocalisation</a>.
                Un rayon de 100-200m est recommandé en ville, 300-500m en zone péri-urbaine.
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
