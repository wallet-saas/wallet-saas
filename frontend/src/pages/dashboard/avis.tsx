import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { StatCard } from '@/components/ui/StatCard';
import { PageSpinner } from '@/components/ui/Spinner';
import { avisApi, type Avis, type AvisTemplate, type AvisTemplatesFilled } from '@/services/api';
import { commercantApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { useAutoSave, SaveIndicator } from '@/hooks/useAutoSave';
import { formatDate } from '@/utils/format';
import { Star, MessageSquare, Send, CheckCircle, Filter, Settings, AlertTriangle, Plus, Trash2, Edit3, FileText } from 'lucide-react';

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

// Templates par défaut proposés au premier chargement
const DEFAULT_TEMPLATES: AvisTemplate[] = [
  { id: 'positif', nom: '⭐ Avis positif (4-5★)', texte: 'Merci {prenom_client} pour votre avis {note}/5 ! Nous sommes ravis que votre expérience chez {nom_commerce} vous ait plu. À très bientôt !' },
  { id: 'negatif', nom: '😔 Avis négatif (1-3★)', texte: 'Bonjour {prenom_client}, merci pour votre retour. Nous sommes désolés que votre expérience n\'ait pas été à la hauteur. Nous aimerions en savoir plus pour nous améliorer — n\'hésitez pas à nous contacter.' },
  { id: 'remerciement', nom: '🙏 Simple remerciement', texte: 'Merci {prenom_client} pour votre avis ! Votre retour est précieux pour nous. À bientôt chez {nom_commerce} !' },
];

export default function AvisPage() {
  const { commercant, refreshUser } = useAuth();
  const { show: toast } = useToast();
  const [avis, setAvis] = useState<Avis[]>([]);
  const [total, setTotal] = useState(0);
  const [moyenne, setMoyenne] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterNote, setFilterNote] = useState<number | undefined>();
  const [modal, setModal] = useState<{ open: boolean; avis?: Avis; reponse?: string; templates?: AvisTemplatesFilled; selectedTemplateId?: string; sending?: boolean; loadingTemplates?: boolean }>({ open: false });
  const [activeTab, setActiveTab] = useState<'avis' | 'templates'>('avis');

  // Templates state
  const [templates, setTemplates] = useState<AvisTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<AvisTemplate | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateForm, setTemplateForm] = useState({ nom: '', texte: '' });

  // Settings
  const [moduleEnabled, setModuleEnabled] = useState(false);
  const [googlePlaceUrl, setGooglePlaceUrl] = useState('');

  useEffect(() => {
    if (commercant) {
      setModuleEnabled(commercant.module_avis_google ?? false);
      setGooglePlaceUrl(commercant.google_place_url ?? '');
      // Charger les templates du commerçant, ou utiliser les defaults
      const saved = (commercant as any).avis_templates;
      if (saved && Array.isArray(saved) && saved.length > 0) {
        setTemplates(saved);
      } else {
        setTemplates(DEFAULT_TEMPLATES);
      }
    }
  }, [commercant]);

  const handleAutoSaveSettings = useCallback(async () => {
    await commercantApi.update({
      module_avis_google: moduleEnabled,
      google_place_url: googlePlaceUrl,
    });
    await refreshUser();
  }, [moduleEnabled, googlePlaceUrl, refreshUser]);

  const { status: saveStatusSettings } = useAutoSave({
    data: { moduleEnabled, googlePlaceUrl },
    onSave: handleAutoSaveSettings,
    debounceMs: 800,
  });

  // Auto-save templates when they change
  const handleSaveTemplates = useCallback(async (newTemplates: AvisTemplate[]) => {
    try {
      await avisApi.saveTemplates(newTemplates);
    } catch (e: any) {
      console.error('Erreur sauvegarde templates:', e.message);
    }
  }, []);

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

  const openModal = async (a: Avis) => {
    setModal({ open: true, avis: a, reponse: a.reponse_envoyee || '', loadingTemplates: true });
    try {
      const result = await avisApi.getTemplates(a.id);
      setModal(m => ({ ...m, templates: result, loadingTemplates: false, selectedTemplateId: result.templates?.[0]?.id }));
    } catch (e: any) {
      toast(e?.message || 'Erreur chargement templates', 'error');
      setModal(m => ({ ...m, loadingTemplates: false }));
    }
  };

  const selectTemplate = (templateId: string) => {
    const t = modal.templates?.templates.find(t => t.id === templateId);
    if (t) {
      setModal(m => ({ ...m, selectedTemplateId: templateId, reponse: t.texte_rempli }));
    }
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

  // Template CRUD
  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ nom: '', texte: '' });
    setShowTemplateForm(true);
  };

  const handleEditTemplate = (t: AvisTemplate) => {
    setEditingTemplate(t);
    setTemplateForm({ nom: t.nom, texte: t.texte });
    setShowTemplateForm(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.nom.trim() || !templateForm.texte.trim()) {
      toast('Nom et texte requis', 'error');
      return;
    }
    let newTemplates: AvisTemplate[];
    if (editingTemplate) {
      newTemplates = templates.map(t => t.id === editingTemplate.id ? { ...t, nom: templateForm.nom, texte: templateForm.texte } : t);
    } else {
      const newId = 'tpl-' + Date.now();
      newTemplates = [...templates, { id: newId, nom: templateForm.nom, texte: templateForm.texte }];
    }
    setTemplates(newTemplates);
    await handleSaveTemplates(newTemplates);
    setShowTemplateForm(false);
    toast('Template sauvegardé');
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Supprimer ce template ?')) return;
    const newTemplates = templates.filter(t => t.id !== id);
    setTemplates(newTemplates);
    await handleSaveTemplates(newTemplates);
    toast('Template supprimé');
  };

  const repondus = avis.filter(a => a.reponse_envoyee).length;
  const noteColors: Record<number, 'green' | 'yellow' | 'red'> = { 5: 'green', 4: 'green', 3: 'yellow', 2: 'red', 1: 'red' };

  return (
    <DashboardLayout>
      <Head><title>Avis — Stamply</title></Head>

      <div className="page-header">
        <h1 className="page-title">Avis</h1>
        <p className="page-subtitle">Gérez les avis de vos clients et répondez avec vos templates personnalisés</p>
      </div>

      <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border mb-6 ${moduleEnabled ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
        <Star className={`h-5 w-5 ${moduleEnabled ? 'text-green-600' : 'text-gray-400'}`} />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Collecte d'avis</p>
          <p className="text-xs text-gray-500">{moduleEnabled ? 'Activé — les avis sont collectés via QR code' : 'Désactivé — activez pour collecter les avis'}</p>
        </div>
        <Badge variant={moduleEnabled ? 'green' : 'gray'}>{moduleEnabled ? 'Actif' : 'Inactif'}</Badge>
      </div>

      <div className="flex gap-2 mb-6">
        {([
          { id: 'avis', label: 'Avis reçus', icon: MessageSquare, count: total },
          { id: 'templates', label: 'Mes templates', icon: FileText, count: templates.length },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
            {tab.count > 0 && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{tab.count}</span>}
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
                    <p className="text-sm text-gray-400">Aucun avis reçu pour le moment</p>
                    <p className="text-xs text-gray-300 mt-1">Activez la collecte d'avis et partagez votre QR code</p>
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

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Créez vos modèles de réponses avec des variables automatiques : <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{'{prenom_client}'}</code> <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{'{nom_commerce}'}</code> <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{'{note}'}</code> <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{'{contenu_avis}'}</code></p>
                </div>
                <Button onClick={handleAddTemplate}><Plus className="h-4 w-4" /> Nouveau template</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.length === 0 ? (
                  <div className="md:col-span-2 card p-8 text-center">
                    <FileText className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 mb-3">Aucun template</p>
                    <Button onClick={handleAddTemplate}><Plus className="h-4 w-4" /> Créer mon premier template</Button>
                  </div>
                ) : templates.map(t => (
                  <Card key={t.id}>
                    <CardBody>
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-gray-900">{t.nom}</p>
                        <div className="flex gap-1">
                          <button onClick={() => handleEditTemplate(t)} className="p-1.5 rounded-lg hover:bg-gray-100"><Edit3 className="h-4 w-4 text-gray-400" /></button>
                          <button onClick={() => handleDeleteTemplate(t.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="h-4 w-4 text-red-400" /></button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 font-mono text-xs">{t.texte}</p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de réponse à un avis */}
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title="Répondre à l'avis" size="lg">
        {modal.avis && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <Stars note={modal.avis.note} size="md" />
              {modal.avis.contenu && <p className="text-sm text-gray-700 mt-2">"{modal.avis.contenu}"</p>}
            </div>

            {modal.loadingTemplates ? (
              <div className="py-4 text-center text-sm text-gray-400">Chargement des templates...</div>
            ) : modal.templates && modal.templates.templates.length > 0 ? (
              <div>
                <label className="label">Choisir un template</label>
                <div className="grid grid-cols-1 gap-2 mb-4">
                  {modal.templates.templates.map(t => (
                    <button key={t.id} onClick={() => selectTemplate(t.id)}
                      className={`text-left p-3 rounded-lg border transition-colors ${modal.selectedTemplateId === t.id ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className="text-sm font-medium text-gray-900">{t.nom}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.texte_rempli}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-gray-400">
                Aucun template configuré — <button onClick={() => { setModal({ open: false }); setActiveTab('templates'); }} className="text-indigo-600 underline">créez-en un</button>
              </div>
            )}

            <Textarea label="Votre réponse" value={modal.reponse || ''} onChange={e => setModal(m => ({ ...m, reponse: e.target.value }))} rows={5} placeholder="Sélectionnez un template ou écrivez votre réponse..." />

            <div className="flex gap-2">
              <Button onClick={handleSend} loading={modal.sending} disabled={!modal.reponse} className="flex-1">
                <Send className="h-4 w-4" /> Envoyer
              </Button>
              <Button variant="secondary" onClick={() => setModal({ open: false })}>Annuler</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal d'édition de template */}
      <Modal open={showTemplateForm} onClose={() => setShowTemplateForm(false)} title={editingTemplate ? 'Modifier le template' : 'Nouveau template'} size="md">
        <div className="space-y-4">
          <Input label="Nom du template" placeholder="Ex: Réponse avis positif" value={templateForm.nom} onChange={e => setTemplateForm({ ...templateForm, nom: e.target.value })} />
          <Textarea label="Texte du template" placeholder="Merci {prenom_client} pour votre avis {note}/5..." rows={5} value={templateForm.texte} onChange={e => setTemplateForm({ ...templateForm, texte: e.target.value })} />
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            <p className="font-semibold mb-1">Variables disponibles :</p>
            <p><code>{'{prenom_client}'}</code> — Nom du client</p>
            <p><code>{'{nom_commerce}'}</code> — Nom de votre commerce</p>
            <p><code>{'{note}'}</code> — Note de l'avis (1-5)</p>
            <p><code>{'{contenu_avis}'}</code> — Texte de l'avis</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveTemplate} className="flex-1">{editingTemplate ? 'Enregistrer' : 'Créer'}</Button>
            <Button variant="secondary" onClick={() => setShowTemplateForm(false)}>Annuler</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
