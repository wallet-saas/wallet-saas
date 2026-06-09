import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Toggle';
import { Modal } from '@/components/ui/Modal';
import { PageSpinner } from '@/components/ui/Spinner';
import { offresApi, type Offre } from '@/services/api';
import { commercantApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/utils/format';
import { Plus, Send, Tag, Percent, Euro, Calendar, BarChart2, Settings, Bell, Zap } from 'lucide-react';

const schema = z.object({
  titre: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  code_promo: z.string().optional(),
  reduction_pourcentage: z.string().optional().transform(v => v ? parseFloat(v) : undefined),
  reduction_montant: z.string().optional().transform(v => v ? parseFloat(v) : undefined),
  date_debut: z.string().optional(),
  date_fin: z.string().optional(),
}).refine(d => d.reduction_pourcentage || d.reduction_montant, { message: 'Indiquez une réduction', path: ['reduction_pourcentage'] });
type FormData = z.infer<typeof schema>;

const cibleOptions = [
  { value: 'tous', label: 'Tous les clients' },
  { value: 'actifs', label: 'Clients actifs' },
  { value: 'dormants', label: 'Clients dormants' },
];

export default function OffresPage() {
  const { commercant, refreshUser } = useAuth();
  const { show: toast } = useToast();
  const [offres, setOffres] = useState<Offre[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean }>({ open: false });
  const [sendModal, setSendModal] = useState<{ open: boolean; offre?: Offre }>({ open: false });
  const [statsModal, setStatsModal] = useState<{ open: boolean; offre?: Offre; stats?: any }>({ open: false });
  const [sendCible, setSendCible] = useState('tous');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'offres' | 'settings'>('offres');
  const [saving, setSaving] = useState(false);

  const [moduleEnabled, setModuleEnabled] = useState(true);
  const [dureeDefaut, setDureeDefaut] = useState(7);
  const [limiteClient, setLimiteClient] = useState(1);
  const [notifAuto, setNotifAuto] = useState(true);
  const [codeAuto, setCodeAuto] = useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (commercant) {
      setModuleEnabled(commercant.module_offres_flash ?? true);
      setDureeDefaut(commercant.offres_duree_defaut ?? 7);
      setLimiteClient(commercant.offres_limite_client ?? 1);
      setNotifAuto(commercant.offres_notif_auto ?? true);
      setCodeAuto(commercant.offres_code_auto ?? true);
    }
  }, [commercant]);

  const fetchOffres = async () => {
    setLoading(true);
    try { const data = await offresApi.list(); setOffres(data.offres); }
    catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOffres(); }, []);

  const onSubmit = async (data: FormData) => {
    try {
      await offresApi.create(data as any);
      setModal({ open: false }); reset(); fetchOffres();
    } catch (e: any) { toast(e?.message || 'Erreur', 'error'); }
  };

  const handleSend = async () => {
    if (!sendModal.offre) return;
    setSending(true);
    try { await offresApi.send(sendModal.offre.id, sendCible); setSendModal({ open: false }); fetchOffres(); }
    catch (e: any) { toast(e?.message || 'Erreur', 'error'); }
    finally { setSending(false); }
  };

  const handleStats = async (offre: Offre) => {
    try { const stats = await offresApi.stats(offre.id); setStatsModal({ open: true, offre, stats }); }
    catch (e: any) { toast(e?.message || 'Erreur', 'error'); }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await commercantApi.update({
        module_offres_flash: moduleEnabled,
        offres_duree_defaut: dureeDefaut,
        offres_limite_client: limiteClient,
        offres_notif_auto: notifAuto,
        offres_code_auto: codeAuto,
      });
      await refreshUser();
      toast('Paramètres enregistrés');
    } catch (e: any) { toast(e?.message || 'Erreur', 'error'); }
    finally { setSaving(false); }
  };

  const actives = offres.filter(o => !o.expiree);
  const expirees = offres.filter(o => o.expiree);

  return (
    <DashboardLayout>
      <Head><title>Offres Flash — Stamply</title></Head>

      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Offres Flash</h1>
            <p className="page-subtitle">{actives.length} offre{actives.length !== 1 ? 's' : ''} active{actives.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={() => { reset(); setModal({ open: true }); }}>
            <Plus className="h-4 w-4" /> Nouvelle offre
          </Button>
        </div>
      </div>

      <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border mb-6 ${moduleEnabled ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
        <Tag className={`h-5 w-5 ${moduleEnabled ? 'text-green-600' : 'text-gray-400'}`} />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Module Offres Flash</p>
          <p className="text-xs text-gray-500">{moduleEnabled ? 'Activé — vous pouvez créer des offres' : 'Désactivé — aucune offre ne peut être créée'}</p>
        </div>
        <Toggle checked={moduleEnabled} onChange={setModuleEnabled} />
      </div>

      <div className="flex gap-2 mb-6">
        {([
          { id: 'offres', label: 'Mes offres', icon: Tag },
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
          {activeTab === 'offres' && (
            offres.length === 0 ? (
              <Card><CardBody><div className="py-12 text-center">
                <Tag className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-4">Aucune offre créée</p>
                <Button onClick={() => setModal({ open: true })}><Plus className="h-4 w-4" /> Créer la première offre</Button>
              </div></CardBody></Card>
            ) : (
              <div className="space-y-6">
                {actives.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Offres actives</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {actives.map(o => <OffreCard key={o.id} offre={o} onSend={() => setSendModal({ open: true, offre: o })} onStats={() => handleStats(o)} />)}
                    </div>
                  </div>
                )}
                {expirees.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Expirées</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                      {expirees.map(o => <OffreCard key={o.id} offre={o} onStats={() => handleStats(o)} />)}
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Réglages par défaut</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  <Input label="Durée par défaut (jours)" type="number" min={1} max={90} value={dureeDefaut} onChange={e => setDureeDefaut(Number(e.target.value))} />
                  <Input label="Limite par client par mois" type="number" min={1} max={20} value={limiteClient} onChange={e => setLimiteClient(Number(e.target.value))} />
                </CardBody>
              </Card>

              <Card>
                <CardHeader><CardTitle>Automatisations</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  <div className="flex items-start justify-between p-3 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Notification automatique</p>
                      <p className="text-xs text-gray-500 mt-0.5">Notifier les clients quand une offre est créée</p>
                    </div>
                    <Toggle checked={notifAuto} onChange={setNotifAuto} />
                  </div>
                  <div className="flex items-start justify-between p-3 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Code promo automatique</p>
                      <p className="text-xs text-gray-500 mt-0.5">Générer un code promo unique pour chaque offre</p>
                    </div>
                    <Toggle checked={codeAuto} onChange={setCodeAuto} />
                  </div>
                </CardBody>
              </Card>

              <div className="lg:col-span-2">
                <Button onClick={handleSaveSettings} loading={saving} size="lg">
                  <Settings className="h-4 w-4" /> Enregistrer les paramètres
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title="Nouvelle offre flash" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Titre" placeholder="Weekend -20% !" error={errors.titre?.message} {...register('titre')} />
          <Textarea label="Description" placeholder="Détails de l'offre…" rows={2} {...register('description')} />
          <Input label="Code promo (optionnel)" placeholder="PROMO20" {...register('code_promo')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Réduction (%)" type="number" min="0" max="100" placeholder="20" error={errors.reduction_pourcentage?.message} {...register('reduction_pourcentage')} />
            <Input label="Ou montant (€)" type="number" step="0.01" placeholder="5.00" {...register('reduction_montant')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date début" type="date" {...register('date_debut')} />
            <Input label="Date fin" type="date" {...register('date_fin')} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setModal({ open: false })}>Annuler</Button>
            <Button type="submit" loading={isSubmitting}>Créer l'offre</Button>
          </div>
        </form>
      </Modal>

      <Modal open={sendModal.open} onClose={() => setSendModal({ open: false })} title="Envoyer l'offre par notification" size="sm">
        {sendModal.offre && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-900">{sendModal.offre.titre}</p>
            </div>
            <Select label="Destinataires" options={cibleOptions} value={sendCible} onChange={e => setSendCible(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setSendModal({ open: false })}>Annuler</Button>
              <Button className="flex-1" loading={sending} onClick={handleSend}><Send className="h-4 w-4" /> Envoyer</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={statsModal.open} onClose={() => setStatsModal({ open: false })} title="Statistiques de l'offre" size="sm">
        {statsModal.offre && statsModal.stats && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-900">{statsModal.offre.titre}</p>
            <div className="grid grid-cols-3 gap-3">
              {[{ label: 'Envoyés', value: statsModal.stats.total_envoyes }, { label: 'Utilisés', value: statsModal.stats.total_utilises }, { label: 'Taux', value: `${statsModal.stats.taux_utilisation}%` }].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

function OffreCard({ offre, onSend, onStats }: { offre: Offre; onSend?: () => void; onStats: () => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardBody>
        <div className="flex items-start justify-between mb-3">
          <div><p className="text-sm font-semibold text-gray-900">{offre.titre}</p>{offre.description && <p className="text-xs text-gray-500 mt-0.5">{offre.description}</p>}</div>
          <Badge variant={offre.expiree ? 'gray' : 'green'}>{offre.expiree ? 'Expirée' : 'Active'}</Badge>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {offre.reduction_pourcentage && <span className="flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full"><Percent className="h-3 w-3" />{offre.reduction_pourcentage}%</span>}
          {offre.reduction_montant && <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full"><Euro className="h-3 w-3" />{offre.reduction_montant}€</span>}
          {offre.code_promo && <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-mono">{offre.code_promo}</span>}
          {offre.date_fin && <span className="flex items-center gap-1 text-xs text-gray-400"><Calendar className="h-3 w-3" />Fin: {formatDate(offre.date_fin)}</span>}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-3">
          <span>{offre.total_envoyes} envoyés · {offre.total_utilises} utilisés</span>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" onClick={onStats}><BarChart2 className="h-3.5 w-3.5" /></Button>
            {onSend && !offre.expiree && <Button variant="secondary" size="sm" onClick={onSend}><Send className="h-3.5 w-3.5" /> Envoyer</Button>}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
