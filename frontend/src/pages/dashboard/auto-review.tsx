import { useEffect, useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { PageSpinner } from '@/components/ui/Spinner';
import { autoReviewApi, type Avis } from '@/services/api';
import { Star, MessageSquare, Settings, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function AutoReviewPage() {
  const [settings, setSettings] = useState<{
    module_avis_google: boolean;
    delai_notif_avis_minutes: number;
    google_place_url: string;
    google_place_id: string;
  }>({
    module_avis_google: false,
    delai_notif_avis_minutes: 60,
    google_place_url: '',
    google_place_id: '',
  });
  const [feedback, setFeedback] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'feedback'>('settings');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
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
    } catch (e) {
      console.error('Erreur chargement:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await autoReviewApi.updateSettings({
        ...settings,
        google_place_url: settings.google_place_url || undefined,
        google_place_id: settings.google_place_id || undefined,
      });
      alert('Paramètres enregistrés !');
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout><PageSpinner /></DashboardLayout>;

  return (
    <DashboardLayout>
      <Head><title>Avis Google — Stamply</title></Head>

      <div className="page-header">
        <h1 className="page-title">Avis Google</h1>
        <p className="page-subtitle">Configurez les demandes d'avis automatiques après chaque visite</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Settings className="h-4 w-4" /> Paramètres
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'feedback' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <MessageSquare className="h-4 w-4" /> Feedback interne
          {feedback.length > 0 && (
            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{feedback.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Star className="h-4 w-4 text-gray-500" />
                </div>
                <CardTitle>Avis Google automatiques</CardTitle>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Activer les avis automatiques</p>
                    <p className="text-xs text-gray-500 mt-0.5">Envoie une notification au client après chaque visite</p>
                  </div>
                  <Toggle
                    checked={settings.module_avis_google}
                    onChange={(v) => setSettings({ ...settings, module_avis_google: v })}
                  />
                </div>

                <Input
                  label="URL de votre fiche Google"
                  placeholder="https://g.page/mon-commerce"
                  value={settings.google_place_url || ''}
                  onChange={(e) => setSettings({ ...settings, google_place_url: e.target.value })}
                  hint="Lien vers votre fiche Google — les clients avec 4+ étoiles seront redirigés ici"
                />

                <Input
                  label="Délai avant notification (minutes)"
                  type="number"
                  min={0}
                  value={settings.delai_notif_avis_minutes}
                  onChange={(e) => setSettings({ ...settings, delai_notif_avis_minutes: Number(e.target.value) })}
                  hint="Délai après le scan avant d'envoyer la demande d'avis (0 = immédiat)"
                />

                <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                  <p className="font-medium mb-1">💡 Comment ça marche ?</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Un client scanne son QR code en caisse</li>
                    <li>Après le délai configuré, il reçoit une notification</li>
                    <li>Il donne une note (1-5 étoiles)</li>
                    <li>4+ étoiles → redirigé vers votre fiche Google</li>
                    <li>Moins de 4 étoiles → formulaire de feedback privé</li>
                  </ol>
                </div>

                <Button onClick={handleSave} loading={saving}>
                  Enregistrer les paramètres
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'feedback' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-gray-500" />
              </div>
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
                          {a.note > 0 && (
                            <span className="text-sm">
                              {Array.from({ length: a.note }).map((_, i) => <span key={i}>⭐</span>)}
                            </span>
                          )}
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
