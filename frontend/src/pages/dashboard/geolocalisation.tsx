import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Toggle';
import { ChampNombre } from '@/components/ui/ChampNombre';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { commercantApi, geolocationApi, type GeoStats } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { formatPercent, formatNumber } from '@/utils/format';
import { MapPin, Bell, TrendingUp, Radio, CheckCircle, XCircle, Info, Settings, BarChart3, Navigation, Clock, MessageSquare, Save, Loader2 } from 'lucide-react';
import { useAutoSave, SaveIndicator } from '@/hooks/useAutoSave';

type Tab = 'statistiques' | 'parametres';

export default function GeolocalisationPage() {
  const { commercant, refreshUser } = useAuth();
  const { show: toast } = useToast();
  const [stats, setStats] = useState<GeoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('statistiques');
  const [toggling, setToggling] = useState(false);

  // Settings state — synced from commercant
  const [rayon, setRayon] = useState(200);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  // Saisie par adresse (géocodage OpenStreetMap — gratuit, sans clé API)
  const [adresseGeo, setAdresseGeo] = useState('');
  const [adresseTrouvee, setAdresseTrouvee] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [frequenceJours, setFrequenceJours] = useState(3);
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
      setAdresseGeo([commercant.adresse, commercant.code_postal, commercant.ville].filter(Boolean).join(', '));
      setFrequenceJours((commercant as any).geoloc_frequence_jours ?? 3);
      setHeureDebut(commercant.geoloc_heure_debut ?? 8);
      setHeureFin(commercant.geoloc_heure_fin ?? 22);
    }
  }, [commercant?.id]); // Only re-sync when commercant ID changes (login), not on every refresh

  const handleAutoSaveSettings = useCallback(async () => {
    await commercantApi.update({
      rayon_geoloc_metres: rayon,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      geoloc_message: message,
      geoloc_heure_debut: heureDebut,
      geoloc_heure_fin: heureFin,
      geoloc_frequence_jours: frequenceJours,
    } as any);
    await refreshUser();
  }, [rayon, latitude, longitude, message, heureDebut, heureFin, frequenceJours, refreshUser]);

  const { status: saveStatusSettings } = useAutoSave({
    data: { rayon, latitude, longitude, message, heureDebut, heureFin, frequenceJours },
    onSave: handleAutoSaveSettings,
    debounceMs: 800,
  });

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

  // Adresse -> coordonnées (Nominatim OpenStreetMap, sans clé API ni coût)
  async function handleLocaliserAdresse() {
    if (!adresseGeo.trim()) {
      toast('Saisissez d\'abord l\'adresse de votre commerce.', 'error');
      return;
    }
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr&q=${encodeURIComponent(adresseGeo)}`,
        { headers: { 'Accept-Language': 'fr' } }
      );
      const results = await res.json();
      if (!results?.length) {
        toast('Adresse introuvable. Essayez avec le code postal et la ville.', 'error');
        return;
      }
      setLatitude(parseFloat(results[0].lat).toFixed(6));
      setLongitude(parseFloat(results[0].lon).toFixed(6));
      setAdresseTrouvee(results[0].display_name || adresseGeo);
      toast('Position trouvée — vérifiez le repère sur la carte.', 'success');
    } catch {
      toast('Impossible de localiser cette adresse pour le moment.', 'error');
    } finally {
      setGeocoding(false);
    }
  }

  // Coordonnées -> adresse (quand on utilise la position du navigateur)
  async function remplirAdresseDepuisCoords(lat: number, lon: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
        { headers: { 'Accept-Language': 'fr' } }
      );
      const data = await res.json();
      if (data?.display_name) {
        setAdresseGeo(data.display_name);
        setAdresseTrouvee(data.display_name);
      }
    } catch {
      // Non bloquant : les coordonnées sont déjà enregistrées
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
        remplirAdresseDepuisCoords(position.coords.latitude, position.coords.longitude);
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
                      ? `Rayon de détection : ${(stats as any).rayonMetres ?? rayon} m — Position ${stats.positionConfiguree ? 'configurée' : 'non configurée'}`
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
                <StatCard label="Rayon de détection" value={`${(stats as any)?.rayonMetres ?? rayon} m`} icon={Radio} iconBg="bg-blue-50" iconColor="text-blue-600" />
                <StatCard label="Fréquence maximum" value={frequenceJours === 1 ? '1 / jour' : `1 / ${frequenceJours} j`} icon={Bell} iconBg="bg-primary-50" iconColor="text-primary-600" />
                <StatCard label="Adresse du commerce" value={latitude && longitude ? 'Configurée' : 'À définir'} icon={MapPin} iconBg="bg-green-50" iconColor="text-green-600" />
                <StatCard label="Visites en boutique" value={formatNumber(stats?.totalVisitesGeoloc ?? 0)} icon={TrendingUp} iconBg="bg-purple-50" iconColor="text-purple-600" />
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-600 leading-relaxed">
                  <strong>Bon à savoir :</strong> le rappel de proximité s'affiche sur l'écran verrouillé des iPhone.
                  C'est iOS qui déclenche l'affichage, en local : ni Stamply ni vous ne recevez la position de vos clients,
                  et aucun compteur d'affichage ne peut donc être remonté. Sur Android, Google ne propose pas
                  l'équivalent sur les cartes de fidélité.
                </p>
              </div>

              <Card>
                <CardHeader><CardTitle>Comment ça fonctionne</CardTitle></CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { step: '1', title: 'Configuration', desc: 'Activez le module, saisissez l\'adresse de votre commerce et choisissez le rayon de détection (50m – 1000m).', color: 'bg-blue-50 text-blue-600' },
                      { step: '2', title: 'Rappel à proximité', desc: 'L\'adresse et le rayon sont intégrés dans la carte de fidélité. Quand un client passe à proximité, sa carte remonte sur l\'écran verrouillé de son iPhone avec votre message.', color: 'bg-primary-50 text-primary-600' },
                      { step: '3', title: 'Conversion visite', desc: 'Le client entre et présente sa carte : la visite est comptabilisée. Aucune position n\'est collectée par Stamply — tout est calculé sur le téléphone du client.', color: 'bg-green-50 text-green-600' },
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
                    <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                      Le rayon est transmis à la carte du client. iOS ajuste légèrement la portée réelle selon l'environnement (zone dense, intérieur…). Un changement s'applique aux cartes déjà installées après leur prochaine mise à jour.
                    </p>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary-600" /> Adresse de votre commerce</CardTitle>
                  <p className="text-xs text-gray-500 mt-1">
                    Saisissez votre adresse : nous plaçons le repère automatiquement. Vérifiez qu'il est au bon endroit sur la carte.
                  </p>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                      <div className="flex-1">
                        <Input
                          label="Adresse complète"
                          placeholder="12 rue de la Paix, 75002 Paris"
                          value={adresseGeo}
                          onChange={(e) => setAdresseGeo(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLocaliserAdresse(); } }}
                        />
                      </div>
                      <Button onClick={handleLocaliserAdresse} disabled={geocoding} className="sm:mb-0.5">
                        {geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                        {geocoding ? 'Recherche...' : 'Localiser'}
                      </Button>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <Button variant="secondary" size="sm" onClick={handleUseMyPosition} disabled={locating}>
                        {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                        {locating ? 'Localisation...' : 'Utiliser ma position'}
                      </Button>
                      {latitude && longitude ? (
                        <Badge variant="green">Position enregistrée</Badge>
                      ) : (
                        <Badge variant="gray">Position non définie</Badge>
                      )}
                    </div>

                    {latitude && longitude ? (
                      <div className="space-y-2">
                        <div className="rounded-xl overflow-hidden border border-gray-200">
                          <iframe
                            title="Position du commerce"
                            className="w-full h-64"
                            loading="lazy"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${(parseFloat(longitude) - 0.004).toFixed(6)},${(parseFloat(latitude) - 0.003).toFixed(6)},${(parseFloat(longitude) + 0.004).toFixed(6)},${(parseFloat(latitude) + 0.003).toFixed(6)}&layer=mapnik&marker=${latitude},${longitude}`}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <p className="text-xs text-gray-500">
                            {adresseTrouvee || 'Repère placé'} — rayon de {rayon} m autour de ce point.
                          </p>
                          <a
                            href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`}
                            target="_blank" rel="noreferrer"
                            className="text-xs text-primary-600 hover:underline"
                          >
                            Voir en plein écran
                          </a>
                        </div>
                        <details className="text-xs text-gray-400">
                          <summary className="cursor-pointer">Coordonnées précises (avancé)</summary>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                            <Input label="Latitude" type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
                            <Input label="Longitude" type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
                          </div>
                        </details>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
                        <MapPin className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">La carte s'affichera ici une fois votre adresse localisée.</p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary-600" /> Message & Horaires</CardTitle></CardHeader>
                <CardBody>
                  <div className="space-y-5">
                    <Input label="Message de notification personnalisé" placeholder="Ex: 🎉 Bonjour ! Passez nous voir, vous pouvez gagner des points !" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={90} />

                    <div className="flex flex-wrap gap-2">
                      {[
                        '🎁 Vous passez par là ? Votre carte de fidélité vous attend !',
                        '☕ Une petite pause ? On vous garde une place.',
                        '🔥 Offre du jour à deux pas de chez vous !',
                        '⭐ Plus que quelques points avant votre récompense !',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setMessage(suggestion)}
                          className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
                        >
                          {suggestion.length > 38 ? suggestion.slice(0, 36) + '…' : suggestion}
                        </button>
                      ))}
                    </div>

                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
                      <p className="text-[10px] uppercase tracking-wider text-indigo-500 font-semibold mb-2">Aperçu sur l'écran verrouillé</p>
                      <div className="rounded-lg bg-white border border-indigo-100 shadow-sm px-3 py-2.5">
                        <p className="text-xs font-semibold text-gray-900">{commercant?.nom_enseigne || 'Votre commerce'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {message || '🎁 Vous passez par là ? Votre carte de fidélité vous attend !'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="label flex items-center gap-1.5">
                        <Bell className="h-3.5 w-3.5 text-gray-400" /> Fréquence maximum par client
                      </label>
                      <select
                        value={frequenceJours}
                        onChange={(e) => setFrequenceJours(Number(e.target.value))}
                        className="input"
                      >
                        <option value={1}>Au maximum une fois par jour</option>
                        <option value={3}>Au maximum une fois tous les 3 jours (recommandé)</option>
                        <option value={7}>Au maximum une fois par semaine</option>
                        <option value={14}>Au maximum une fois toutes les 2 semaines</option>
                        <option value={30}>Au maximum une fois par mois</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1.5">
                        Un client qui passe trois fois devant votre commerce dans la journée ne sera notifié qu'une seule fois.
                        Évite l'effet spam et les suppressions de carte.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-gray-400" /> Heure début</label>
                        <ChampNombre value={heureDebut} onChange={setHeureDebut} min={0} max={23} suffixe="h" />
                      </div>
                      <div>
                        <label className="label flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-gray-400" /> Heure fin</label>
                        <ChampNombre value={heureFin} onChange={setHeureFin} min={0} max={23} suffixe="h" />
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <div className="flex justify-end">
                <div className="flex items-center gap-3">
                  <SaveIndicator status={saveStatusSettings} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
