import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Toggle';
import { Modal } from '@/components/ui/Modal';
import { StatCard } from '@/components/ui/StatCard';
import { PageSpinner } from '@/components/ui/Spinner';
import { avisApi, type Avis } from '@/services/api';
import { commercantApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { useAutoSave, SaveIndicator } from '@/hooks/useAutoSave';
import { formatDate } from '@/utils/format';
import { Star, MessageSquare, Send, Sparkles, CheckCircle, Filter, Settings, AlertTriangle } from 'lucide-react';

function Stars({ note, size = 'sm' }: { note: number; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`${s} ${i <= note ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

export default function AvisPage() {
  const { commercant, refreshUser } = useAuth();
  const { show: toast } = useToast();
  const [avis, setAvis] = useState<Avis[]>([]);
  const [total, setTotal] = useState(0);
  const [moyenne, setMoyenne] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterNote, setFilterNote] = useState<number | undefined>();
  const [modal, setModal] = useState<{ open: boolean; avis?: Avis; reponse?: string; aiLoading?: boolean; sending?: boolean }>({ open: false });
  const [activeTab, setActiveTab] = useState<'avis' | 'settings'>('avis');

  // Settings
  const [moduleEnabled, setModuleEnabled] = useState(false);
  const [googlePlaceUrl, setGooglePlaceUrl] = useState('');
  const [seuilReponse, setSeuilReponse] = useState(3);
  const [templateAuto, setTemplateAuto] = useState('');
  const [reponseAuto, setReponseAuto] = useState(false);

  useEffect(() => {
    if (commercant) {
      setModuleEnabled(commercant.module_avis_google ?? false);
      setGooglePlaceUrl(commercant.google_place_url ?? '');
      setSeuilReponse(commercant.avis_seuil_reponse ?? 3);
      setTemplateAuto(commercant.avis_template_auto ?? '');
      setReponseAuto(commercant.avis_reponse_auto ?? false);
    }
  }, [commercant]);

  const handleAutoSaveSettings = useCallback(async () => {
    await commercantApi.update({
      module_avis_google: moduleEnabled,
      google_place_url: googlePlaceUrl,
      avis_seuil_reponse: seuilReponse,
      avis_template_auto: templateAuto,
      avis_reponse_auto: reponseAuto,
    });
    await refreshUser();
  }, [moduleEnabled, googlePlaceUrl, seuilReponse, templateAuto, reponseAuto, refreshUser]);

  const { status: saveStatusSettings } = useAutoSave({
    data: { moduleEnabled, googlePlaceUrl, seuilReponse, templateAuto, reponseAuto },
    onSave: handleAutoSaveSettings,
    debounceMs: 800,
  });

  const fetchAvis = async (note?: number) => {
    setLoading(true);
    try {
      const data = await avisApi.list(note ? { note } : {});
      setAvis(data.avis ?? []);
      setTotal(data.total ?? 0);
      setMoyenne(data.moyenneNote ?? 0);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAvis(); }, []);

  const handleFilterNote = (n: number | undefined) => { setFilterNote(n); fetchAvis(n); };

  const openModal = (a: Avis) => {
    setModal({ open: true, avis: a, reponse: a.reponse_suggeree || a.reponse_envoyee || '' });
  };

  const handleAI = async () => {
    if (!modal.avis) return;
    setModal(m => ({ ...m, aiLoading: true }));
    try {
      const { reponse_suggeree } = await avisApi.suggestResponse(modal.avis.id);
      setModal(m => ({ ...m, reponse: reponse_suggeree, aiLoading: false }));
    } catch (e: any) { toast(e?.message || 'Erreur IA', 'error'); setModal(m => ({ ...m, aiLoading: false })); }
  };

  const handleSend = async () => {
    if (!modal.avis || !modal.reponse) return;
    setModal(m => ({ ...m, sending: true }));
    try {
      await avisApi.sendResponse(modal.avis.id, modal.reponse);
      setModal({ open: false });
      fetchAvis(filterNote);
    } catch (e: any) { toast(e?.message || 'Erreur envoi', 'error'); setModal(m => ({ ...m, sending: false })); }
  };

  const repondus = avis.filter(a => a.reponse_envoyee).length;
  const noteColors: Record<number, 'green' | 'yellow' | 'red'> = { 5: 'green', 4: 'green', 3: 'yellow', 2: 'red', 1: 'red' };

  return (
    <DashboardLayout>
      <Head><title>Avis Google — Stamply</title></Head>

      <div className="page-header">
        <h1 className="page-title">Avis Google</h1>
        <p className="page-subtitle">Gérez et répondez aux avis clients</p>
      </div>

      <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border mb-6 ${moduleEnabled ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
        <Star className={`h-5 w-5 ${moduleEnabled ? 'text-green-600' : 'text-gray-400'}`} />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Module Avis Google</p>
          <p className="text-xs text-gray-500">{moduleEnabled ? 'Activé — les avis sont collectés et analysés' : 'Désactivé — activez pour collecter les avis'}</p>
        </div>
        <Toggle
          checked={moduleEnabled}
          onChange={async (val: boolean) => {
            setModuleEnabled(val);
            try {
              await commercantApi.update({ module_avis_google: val });
              await refreshUser();
            } catch (e: any) {
              setModuleEnabled(!val);
              toast(e?.message || 'Erreur lors de la mise à jour du module', 'error');
            }
          }}
        />
      </div>

      <div className="flex gap-2 mb-6">
        {([
          { id: 'avis', label: 'Avis reçus', icon: MessageSquare },
          { id: 'settings', label: 'Paramètres', icon: Settings },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : (
        <>
          {activeTab === 'avis' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Note moyenne" value={`${moyenne.toFixed(1)} / 5`} icon={Star} iconBg="bg-yellow-50" iconColor="text-yellow-600" />
                <StatCard label="Total avis" value={total} icon={MessageSquare} iconBg="bg-blue-50" iconColor="text-blue-600" />
                <StatCard label="Répondus" value={repondus} icon={CheckCircle} iconBg="bg-green-50" iconColor="text-green-600" />
                <StatCard label="Sans réponse" value={total - repondus} icon={AlertTriangle} iconBg="bg-orange-50" iconColor="text-orange-600" />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500 flex items-center gap-1.5"><Filter className="h-4 w-4" /> Filtrer :</span>
                <Button variant={!filterNote ? 'primary' : 'secondary'} size="sm" onClick={() => handleFilterNote(undefined)}>Toutes</Button>
                {[5,4,3,2,1].map(n => (
                  <Button key={n} variant={filterNote === n ? 'primary' : 'secondary'} size="sm" onClick={() => handleFilterNote(n)}>
                    {'★'.repeat(n)} {n}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {avis.length === 0 ? (
                  <div className="md:col-span-2 card p-12 text-center">
                    <Star className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Aucun avis trouvé</p>
                  </div>
                ) : avis.map(a => (
                  <Card key={a.id} className="hover:shadow-md transition-shadow">
                    <CardBody>
                      <div className="flex items-start justify-between mb-3">
                        <Stars note={a.note} />
                        <div className="flex items-center gap-2">
                          <Badge variant={noteColors[a.note] || 'gray'}>{a.note}/5</Badge>
                          {a.reponse_envoyee && <Badge variant="green">Répondu</Badge>}
                        </div>
                      </div>
                      {a.contenu && <p className="text-sm text-gray-700 mb-3 line-clamp-3">"{a.contenu}"</p>}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="gray">{a.source}</Badge>
                          <span className="text-xs text-gray-400">{formatDate(a.created_at)}</span>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => openModal(a)}>
                          <MessageSquare className="h-3.5 w-3.5" /> Répondre
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Collecte des avis</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  <Input label="URL de votre fiche Google" placeholder="https://g.page/mon-commerce" value={googlePlaceUrl} onChange={e => setGooglePlaceUrl(e.target.value)} />
                  <Input label="Seuil de réponse automatique (étoiles)" type="number" min={1} max={5} value={seuilReponse} onChange={e => setSeuilReponse(Number(e.target.value))} />
                </CardBody>
              </Card>

              <Card>
                <CardHeader><CardTitle>Réponses automatiques</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  <div className="flex items-start justify-between p-3 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Réponse automatique par IA</p>
                      <p className="text-xs text-gray-500 mt-0.5">Génère et envoie automatiquement une réponse aux avis sous le seuil</p>
                    </div>
                    <Toggle checked={reponseAuto} onChange={setReponseAuto} />
                  </div>
                  <Textarea label="Template de réponse" placeholder="Merci pour votre avis ! Nous prenons en compte vos retours…" rows={5} value={templateAuto} onChange={e => setTemplateAuto(e.target.value)} />
                </CardBody>
              </Card>

              <div className="lg:col-span-2">
                <div className="flex items-center">
                  <SaveIndicator status={saveStatusSettings} />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title="Répondre à l'avis" size="md">
        {modal.avis && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <Stars note={modal.avis.note} size="md" />
              {modal.avis.contenu && <p className="text-sm text-gray-700 mt-2">"{modal.avis.contenu}"</p>}
            </div>
            <Textarea label="Votre réponse" value={modal.reponse || ''} onChange={e => setModal(m => ({ ...m, reponse: e.target.value }))} rows={5} placeholder="Rédigez votre réponse…" />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleAI} loading={modal.aiLoading} className="flex-1">
                <Sparkles className="h-4 w-4" /> Générer avec IA
              </Button>
              <Button onClick={handleSend} loading={modal.sending} disabled={!modal.reponse} className="flex-1">
                <Send className="h-4 w-4" /> Envoyer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
