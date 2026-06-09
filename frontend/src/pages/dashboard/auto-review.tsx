import { useEffect, useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { PageSpinner } from '@/components/ui/Spinner';
import { autoReviewApi, type Avis } from '@/services/api';
import { commercantApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { Star, MessageSquare, Settings, AlertTriangle, CheckCircle, Clock, Save, Bell } from 'lucide-react';

function Stars({ note }: { note: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`h-4 w-4 ${i <= note ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

export default function AutoReviewPage() {
  const { commercant, refreshUser } = useAuth();
  const [settings, setSettings] = useState({
    module_avis_google: false,
    delai_notif_avis_minutes: 60,
    google_place_url: '',
    google_place_id: '',
  });
  const [feedback, setFeedback] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'feedback'>('settings');

  // Extended settings
  const [autoMessage, setAutoMessage] = useState('');
  const [seuilEtoiles, setSeuilEtoiles] = useState(4);
  const [alerteEmail, setAlerteEmail] = useState(false);

  useEffect(() => {
    if (commercant) {
      setSettings({
        module_avis_google: commercant.module_avis_google ?? false,
        delai_notif_avis_minutes: commercant.delai_notif_avis_minutes ?? 60,
        google_place_url: commercant.google_place_url ?? '',
        google_place_id: '',
      });
      setAutoMessage(commercant.auto_review_message ?? '');
      setSeuilEtoiles(commercant.auto_review_seuil_etoiles ?? 4);
      setAlerteEmail(commercant.auto_review_alerte_email ?? false);
    }
  }, [commercant]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, feedbackRes] = await Promise.all([
        autoReviewApi.settings(),
        autoReviewApi.feedback(20),
      ]);
      setSettings({
        module_avis_google: settingsRes.module_avis_google ?? false,
        delai_notif_avis_minutes: settingsRes.delai_notif_avis_minutes ?? 60,
        google_place_url: settingsRes.google_place_url ?? '',
        google_place_id: settingsRes.google_place_id ?? '',
      });
      setFeedback(feedbackRes.data || []);
    } catch (e) { console.error('Erreur chargement:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save via auto-review API for core settings
      await autoReviewApi.updateSettings({
        module_avis_google: settings.module_avis_google,
        delai_notif_avis_minutes: settings.delai_notif_avis_minutes,
        google_place_url: settings.google_place_url || undefined,
      });
      // Save extended settings via commercants API
      await commercantApi.update({
        module_avis_google: settings.module_avis_google,
        delai_notif_avis_minutes: settings.delai_notif_avis_minutes,
        google_place_url: settings.google_place_url,
        auto_review_message: autoMessage,
        auto_review_seuil_etoiles: seuilEtoiles,
        auto_review_alerte_email: alerteEmail,
      });
      await refreshUser();
      alert('Paramètres enregistrés !');
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally { setSaving(false); }
  };

  if (loading && !commercant) return <DashboardLayout><PageSpinner /></DashboardLayout>;

  return (
    <DashboardLayout>
      <Head><title>Avis automatiques — Stamply</title></Head>

      <div className="page-header">
        <h1 className="page-title">Avis automatiques</h1>
        <p className="page-subtitle">Configurez les demandes d'avis après chaque visite</p>
      </div>

      {/* Module toggle */}
      <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border mb-6 ${settings.module_avis_google ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
        <Bell className={`h-5 w-5 ${settings.module_avis_google ? 'text-green-600' : 'text-gray-400'}`} />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Module avis automatiques</p>
          <p className="text-xs text-gray-500">{settings.module_avis_google ? 'Activé — les clients reçoivent une demande d\'avis après chaque visite' : 'Désactivé — activez pour collecter automatiquement les avis'}</p>
        </div>
        <Toggle checked={settings.module_avis_google} onChange={(v) => setSettings(s => ({ ...s, module_avis_google: v }))} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([
          { id: 'settings', label: 'Paramétrage', icon: Settings },
          { id: 'feedback', label: 'Feedback interne', icon: MessageSquare },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
            {tab.id === 'feedback' && feedback.length > 0 && (
              <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{feedback.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Collecte des avis</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              <Input label="Délai avant notification (minutes)" type="number" min={0} value={settings.delai_notif_avis_minutes} onChange={e => setSettings(s => ({ ...s, delai_notif_avis_minutes: Number(e.target.value) }))} hint="Délai après le scan avant d'envoyer la demande (0 = immédiat)" />
              <Input label="URL de votre fiche Google" placeholder="https://g.page/mon-commerce" value={settings.google_place_url} onChange={e => setSettings(s => ({ ...s, google_place_url: e.target.value }))} hint="Les clients avec une bonne note seront redirigés ici" />
              <Input label="Seuil étoiles pour Google" type="number" min={1} max={5} value={seuilEtoiles} onChange={e => setSeuilEtoiles(Number(e.target.value))} hint={`Clients avec ${seuilEtoiles}+ étoiles → Google | Moins → feedback privé`} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Message et alertes</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              <Textarea label="Message personnalisé" placeholder="Merci pour votre visite ! Donnez-nous votre avis…" rows={4} value={autoMessage} onChange={e => setAutoMessage(e.target.value)} />
              <p className="text-xs text-gray-400 -mt-2">Message envoyé dans la notification d'avis</p>
              <div className="flex items-start justify-between p-3 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">Alerte email avis négatifs</p>
                  <p className="text-xs text-gray-500 mt-0.5">Recevoir une alerte pour les avis sous 3 étoiles</p>
                </div>
                <Toggle checked={alerteEmail} onChange={setAlerteEmail} />
              </div>
            </CardBody>
          </Card>

          <div className="lg:col-span-2">
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
              <p className="font-medium mb-2">💡 Comment ça marche ?</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Un client scanne son QR code en caisse</li>
                <li>Après le délai configuré ({settings.delai_notif_avis_minutes} min), il reçoit une notification</li>
                <li>Il donne une note ({seuilEtoiles}+ étoiles → Google | Moins → feedback privé)</li>
                <li>Vous pouvez répondre aux avis directement depuis la page Avis Google</li>
              </ol>
            </div>
          </div>

          <div className="lg:col-span-2">
            <Button onClick={handleSave} loading={saving} size="lg">
              <Save className="h-4 w-4" /> Enregistrer les paramètres
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-gray-500" />
              <CardTitle>Feedback interne ({feedback.length})</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {feedback.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle className="h-10 w-10 text-green-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Aucun feedback négatif — bravo !</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {feedback.map((a) => (
                  <div key={a.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {a.note > 0 && <Stars note={a.note} />}
                          <span className="text-xs text-gray-400">{a.source}</span>
                        </div>
                        {a.contenu && <p className="text-sm text-gray-700">{a.contenu}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(a.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </DashboardLayout>
  );
}
