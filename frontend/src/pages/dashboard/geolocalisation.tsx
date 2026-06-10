import { useEffect, useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Toggle';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { commercantApi, geolocationApi, type GeoStats } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { formatPercent, formatNumber } from '@/utils/format';
import { MapPin, Bell, TrendingUp, Radio, CheckCircle, XCircle, Info, Settings, BarChart3, Navigation, Clock, MessageSquare, Save, Loader2 } from 'lucide-react';

type Tab = 'statistiques' | 'parametres';

export default function GeolocalisationPage() {
  const { commercant, refreshUser } = useAuth();
  const { show: toast } = useToast();
  const [stats, setStats] = useState<GeoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('statistiques');
  const [toggling, setToggling] = useState(false);

  // Settings state — synced from commercant
  const [rayon, setRayon] = useState(200);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [message, setMessage] = useState('');
  const [heureDebut, setHeureDebut] = useState(8);
  const [heureFin, setHeureFin] = useState(22);
  const [locating, setLocating] = useState(false);

  // Sync settings state when commercant changes (only on first load)
  useEffect(() => {
    if (commercant) {
      setRayon(commercant.rayon_geoloc_metres ?? 200);
      setLatitude(commercant.latitude?.toString() ?? '');
      setLongitude(commercant.longitude?.toString() ?? '');
      setMessage(commercant.geoloc_message ?? '');
      setHeureDebut(commercant.geoloc_heure_debut ?? 8);
      setHeureFin(commercant.geoloc_heure_fin ?? 22);
    }
  }, [commercant?.id]); // Only re-sync when commercant ID changes (login), not on every refresh

  // Load stats
  useEffect(() => {
    geolocationApi.stats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleToggleModule(checked: boolean) {
    setToggling(true);
    try {
      await commercantApi.update({ module_geolocalisation: checked });
      await refreshUser();
      const newStats = await geolocationApi.stats();
      setStats(newStats);
    } catch (err: any) {
      toast(err.message || 'Erreur', 'error');
    } finally {
      setToggling(false);
    }
  }

  async function handleSaveSettings() {
    setSaving(true);
    try {
      await commercantApi.update({
        rayon_geoloc_metres: rayon,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        geoloc_message: message,
        geoloc_heure_debut: heureDebut,
        geoloc_heure_fin: heureFin,
      });
      await refreshUser();
      const newStats = await geolocationApi.stats();
      setStats(newStats);
      toast('Paramètres enregistrés');
    } catch (err: any) {
      toast(err.message || 'Erreur', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleUseMyPosition() {
    setLocating(true);
    if (!navigator.geolocation) {
      toast('La géolocalisation n\'est pas supportée par votre navigateur.', 'error');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast('Impossible d\'obtenir votre position.', 'error');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const moduleActive = commercant?.module_geolocalisation ?? false;

  return (
    <DashboardLayout>
      <Head><title>Géolocalisation — Stamply</title></Head>

      <div className="page-header">
        <h1 className="page-title">Géolocalisation</h1>
        <p className="page-subtitle">Notifications de proximité automatiques pour attirer vos clients en boutique</p>
      </div>

      {loading ? <PageSpinner /> : (
        <div className="space-y-6">
          {/* Module toggle */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Module Géolocalisation</p>
                    <p className="text-xs text-gray-500">
                      Activez ou désactivez les notifications de proximité
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={moduleActive ? 'green' : 'gray'}>
                    {moduleActive ? 'Actif' : 'Inactif'}
                  </Badge>
                  <Toggle
                    checked={moduleActive}
                    onChange={handleToggleModule}
                    disabled={toggling}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button type="button" onClick={() => setActiveTab('statistiques')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'statistiques' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <BarChart3 className="h-4 w-4" /> Statistiques
            </button>
            <button type="button" onClick={() => setActiveTab('parametres')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'parametres' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Settings className="h-4 w-4" /> Paramètres
            </button>
          </div>

          {/* Statistiques Tab */}
          {activeTab === 'statistiques' && (
            <div className="space-y-6">
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
                      : 'Activez le module pour envoyer des notifications de proximité'}
                  </p>
                </div>
                <div className="ml-auto">
                  <Badge variant={stats?.moduleActif ? 'green' : 'gray'}>
                    {stats?.moduleActif ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Rayon détection" value={`${stats?.rayon ?? rayon}m`} icon={Radio} iconBg="bg-blue-50" iconColor="text-blue-600" />
                <StatCard label="Notifications envoyées" value={formatNumber(stats?.totalNotifications ?? 0)} icon={Bell} iconBg="bg-primary-50" iconColor="text-primary-600" />
                <StatCard label="Visites générées" value={formatNumber(stats?.totalVisitesGeoloc ?? 0)} icon={MapPin} iconBg="bg-green-50" iconColor="text-green-600" />
                <StatCard label="Taux de conversion" value={formatPercent(stats?.tauxConversion ?? 0)} icon={TrendingUp} iconBg="bg-purple-50" iconColor="text-purple-600" />
              </div>

              <Card>
                <CardHeader><CardTitle>Comment ça fonctionne</CardTitle></CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { step: '1', title: 'Configuration', desc: 'Activez le module dans les Paramètres et définissez votre adresse GPS et le rayon de détection (50m – 1000m).', color: 'bg-blue-50 text-blue-600' },
                      { step: '2', title: 'Détection proximité', desc: 'Quand un client avec votre carte de fidélité s\'approche de votre commerce, une notification push est envoyée automatiquement.', color: 'bg-primary-50 text-primary-600' },
                      { step: '3', title: 'Conversion visite', desc: 'Le client entre dans votre commerce et présente sa carte pour valider ses points. La visite est comptabilisée.', color: 'bg-green-50 text-green-600' },
                    ].map(item => (
                      <div key={item.step} className="flex gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${item.color}`}>{item.step}</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">{item.title}</p>
                          <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Paramètres Tab */}
          {activeTab === 'parametres' && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Rayon de détection</CardTitle></CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Radio className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-gray-700">Distance de proximité</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{rayon}m</span>
                    </div>
                    <input type="range" min={50} max={1000} step={10} value={rayon} onChange={(e) => setRayon(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600" />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>50m</span><span>500m</span><span>1000m</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Navigation className="h-4 w-4 text-primary-600" /> Position GPS</CardTitle></CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Latitude" type="number" step="any" placeholder="Ex: 48.8584" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
                      <Input label="Longitude" type="number" step="any" placeholder="Ex: 2.2945" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
                    </div>
                    <Button variant="secondary" size="sm" onClick={handleUseMyPosition} disabled={locating}>
                      {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                      {locating ? 'Localisation...' : 'Utiliser ma position'}
                    </Button>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary-600" /> Message & Horaires</CardTitle></CardHeader>
                <CardBody>
                  <div className="space-y-5">
                    <Input label="Message de notification personnalisé" placeholder="Ex: 🎉 Bonjour ! Passez nous voir, vous pouvez gagner des points !" value={message} onChange={(e) => setMessage(e.target.value)} />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-gray-400" /> Heure début</label>
                        <input type="number" min={0} max={23} value={heureDebut} onChange={(e) => setHeureDebut(Number(e.target.value))} className="input text-center text-lg font-semibold" />
                      </div>
                      <div>
                        <label className="label flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-gray-400" /> Heure fin</label>
                        <input type="number" min={0} max={23} value={heureFin} onChange={(e) => setHeureFin(Number(e.target.value))} className="input text-center text-lg font-semibold" />
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={saving} className="min-w-[200px]">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
