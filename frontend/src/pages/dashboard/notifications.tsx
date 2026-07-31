import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChampNombre } from '@/components/ui/ChampNombre';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Toggle';
import { StatCard } from '@/components/ui/StatCard';
import { PageSpinner } from '@/components/ui/Spinner';
import { notificationsApi, type Notification, type NotifStats } from '@/services/api';
import { commercantApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { useAutoSave, SaveIndicator } from '@/hooks/useAutoSave';
import { formatDateTime, formatPercent, formatNumber } from '@/utils/format';
import { Bell, Send, Users, Eye, TrendingUp, CheckCircle, AlertCircle, Settings, Zap, Gift, Clock, Plus, Calendar } from 'lucide-react';

const schema = z.object({
  titre: z.string().min(1, 'Titre requis').max(80, '80 car. max'),
  message: z.string().min(1, 'Message requis').max(200, '200 car. max'),
  cible: z.enum(['tous', 'actifs', 'dormants']),
});
type FormData = z.infer<typeof schema>;

const cibleOptions = [
  { value: 'tous', label: 'Tous les clients' },
  { value: 'actifs', label: 'Clients actifs' },
  { value: 'dormants', label: 'Clients dormants' },
];

export default function NotificationsPage() {
  const { commercant, refreshUser } = useAuth();
  const { show: toast } = useToast();
  const [history, setHistory] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotifStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendResult, setSendResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { cible: 'tous' },
  });

  const [moduleEnabled, setModuleEnabled] = useState(true);
  const [maxPerDay, setMaxPerDay] = useState(3);
  const [heureDebut, setHeureDebut] = useState(8);
  const [heureFin, setHeureFin] = useState(22);
  const [templateDefaut, setTemplateDefaut] = useState('');
  const [notifTemplates, setNotifTemplates] = useState<Array<{ id: string; nom: string; titre: string; message: string }>>([]);
  const [modeSimulation, setModeSimulation] = useState(false); // sera écrasé par le useEffect

  // Relance & anniversaire
  const [relanceAuto, setRelanceAuto] = useState(false);
  const [relanceJours, setRelanceJours] = useState(14);
  const [anniversaireAuto, setAnniversaireAuto] = useState(false);
  const [anniversaireMessage, setAnniversaireMessage] = useState('Joyeux anniversaire ! 🎉 Profitez d\'une offre spéciale pour votre journée.');
  const [testRelanceLoading, setTestRelanceLoading] = useState(false);
  const [testAnnivLoading, setTestAnnivLoading] = useState(false);

  useEffect(() => {
    if (commercant) {
      setModuleEnabled(commercant.module_notifications ?? true);
      setMaxPerDay(commercant.notif_max_par_jour ?? 3);
      setHeureDebut(commercant.notif_heure_debut ?? 8);
      setHeureFin(commercant.notif_heure_fin ?? 22);
      setTemplateDefaut(commercant.notif_template_defaut ?? '');
      setNotifTemplates(((commercant as any).notif_templates as any[]) ?? []);
      setModeSimulation(commercant.notif_mode_simulation ?? false);
      setRelanceAuto(commercant?.relance_auto ?? false);
      setRelanceJours(commercant?.relance_jours ?? 14);
      setAnniversaireAuto(commercant?.anniversaire_auto ?? false);
      setAnniversaireMessage(commercant?.anniversaire_message ?? 'Joyeux anniversaire ! 🎉 Profitez d\'une offre spéciale pour votre journée.');
    }
  }, [commercant]);

  const handleAutoSaveSettings = useCallback(async () => {
    await commercantApi.update({
      module_notifications: moduleEnabled,
      notif_max_par_jour: maxPerDay,
      notif_heure_debut: heureDebut,
      notif_heure_fin: heureFin,
      notif_template_defaut: templateDefaut,
      notif_mode_simulation: modeSimulation,
      relance_auto: relanceAuto,
      relance_jours: relanceJours,
      anniversaire_auto: anniversaireAuto,
      anniversaire_message: anniversaireMessage,
    });
    // Pas de refreshUser ici — le state local est déjà à jour
  }, [moduleEnabled, maxPerDay, heureDebut, heureFin, templateDefaut, modeSimulation, relanceAuto, relanceJours, anniversaireAuto, anniversaireMessage]);

  const { status: saveStatusSettings } = useAutoSave({
    data: { moduleEnabled, maxPerDay, heureDebut, heureFin, templateDefaut, modeSimulation, relanceAuto, relanceJours, anniversaireAuto, anniversaireMessage },
    onSave: handleAutoSaveSettings,
    debounceMs: 800,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hist, st] = await Promise.all([notificationsApi.history(), notificationsApi.stats()]);
      setHistory(hist.notifications);
      setStats(st);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (data: FormData) => {
    setSendResult(null);
    try {
      const res = await notificationsApi.send(data.titre, data.message, data.cible);
      setSendResult({ success: true, message: `Envoyé à ${res.totalEnvoyes} client(s)${res.simulation ? ' (mode simulation)' : ''}` });
      reset();
      fetchData();
    } catch (e: any) {
      setSendResult({ success: false, message: e?.message || 'Erreur envoi' });
    }
  };

  const useTemplate = () => {
    if (templateDefaut) {
      const parts = templateDefaut.split('\n');
      setValue('titre', parts[0] || '');
      setValue('message', parts.slice(1).join('\n') || '');
    }
  };

  // Modèles nommés : un clic remplit le formulaire, prêt à envoyer
  const appliquerTemplate = (t: { titre: string; message: string }) => {
    setValue('titre', t.titre);
    setValue('message', t.message);
  };

  const enregistrerTemplate = async () => {
    const titre = (watch('titre') || '').trim();
    const message = (watch('message') || '').trim();
    if (!titre || !message) {
      toast('Écrivez un titre et un message avant de les enregistrer.', 'error');
      return;
    }
    const nom = window.prompt('Nom du modèle (ex. « Offre du weekend »)', titre.slice(0, 40));
    if (!nom) return;
    const nouveaux = [...notifTemplates, { id: String(Date.now()), nom, titre, message }];
    setNotifTemplates(nouveaux);
    try {
      await commercantApi.update({ notif_templates: nouveaux } as any);
      await refreshUser();
      toast('Modèle enregistré', 'success');
    } catch (e: any) {
      toast(e?.message || 'Erreur enregistrement', 'error');
    }
  };

  const supprimerTemplate = async (id: string) => {
    const nouveaux = notifTemplates.filter(t => t.id !== id);
    setNotifTemplates(nouveaux);
    try {
      await commercantApi.update({ notif_templates: nouveaux } as any);
      await refreshUser();
    } catch { /* non bloquant */ }
  };

  const cibleLabel: Record<string, string> = { tous: 'Tous', actifs: 'Actifs', dormants: 'Dormants' };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('stamply_token') : null;

  const handleTestRelance = async () => {
    setTestRelanceLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/relance/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      });
      const body = await res.json();
      toast(body?.data?.message || body?.message || 'Relance exécutée', 'success');
    } catch (e: any) {
      toast(e?.message || 'Erreur', 'error');
    } finally { setTestRelanceLoading(false); }
  };

  const handleTestAnniv = async () => {
    setTestAnnivLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/relance/anniversaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      });
      const body = await res.json();
      toast(body?.data?.message || body?.message || 'Anniversaires envoyés', 'success');
    } catch (e: any) {
      toast(e?.message || 'Erreur', 'error');
    } finally { setTestAnnivLoading(false); }
  };

  return (
    <DashboardLayout>
      <Head><title>Notifications — Stamply</title></Head>

      <div className="page-header">
        <h1 className="page-title">Notifications Push</h1>
        <p className="page-subtitle">Envoyez des messages ciblés à vos clients</p>
      </div>

      {loading ? <PageSpinner /> : (
        <div className="space-y-6">
          <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border ${moduleEnabled ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
            <Bell className={`h-5 w-5 ${moduleEnabled ? 'text-green-600' : 'text-gray-400'}`} />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Module notifications push</p>
              <p className="text-xs text-gray-500">{moduleEnabled ? 'Activé — vos clients reçoivent des notifications' : 'Désactivé — aucune notification ne sera envoyée'}</p>
            </div>
            <Toggle checked={moduleEnabled} onChange={async (val) => {
              const prev = moduleEnabled;
              setModuleEnabled(val);
              try {
                await commercantApi.update({ module_notifications: val });
                await refreshUser();
              } catch (e: any) {
                setModuleEnabled(prev);
                toast(e?.message || 'Erreur lors de la sauvegarde', 'error');
              }
            }} />
          </div>

          <div className="flex gap-2">
            {([
              { id: 'send', label: 'Envoyer', icon: Send },
              { id: 'history', label: 'Historique', icon: Eye },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
                <tab.icon className="h-4 w-4" /> {tab.label}
                {tab.id === 'history' && history.length > 0 && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{history.length}</span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'send' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader><CardTitle>Envoyer une notification</CardTitle></CardHeader>
                  <CardBody>
                    {sendResult && (
                      <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg mb-4 ${sendResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                        {sendResult.success
                          ? <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          : <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        }
                        <p className={`text-sm ${sendResult.success ? 'text-green-700' : 'text-red-600'}`}>{sendResult.message}</p>
                      </div>
                    )}
                    {notifTemplates.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Mes modèles</p>
                        <div className="flex flex-wrap gap-2">
                          {notifTemplates.map(t => (
                            <div key={t.id} className="group flex items-center gap-1 rounded-full border border-gray-200 pl-3 pr-1 py-1 hover:border-indigo-300 transition-colors">
                              <button type="button" onClick={() => appliquerTemplate(t)} className="text-xs text-gray-700 hover:text-indigo-600">
                                {t.nom}
                              </button>
                              <button type="button" onClick={() => supprimerTemplate(t.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity px-1" title="Supprimer">
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <Input label="Titre" placeholder="Offre spéciale ce weekend !" error={errors.titre?.message} {...register('titre')} />
                      <Textarea label="Message" placeholder="Profitez de -20% sur toute la carte…" rows={4} error={errors.message?.message} {...register('message')} />
                      <div className="grid grid-cols-2 gap-4">
                        <Select label="Destinataires" options={cibleOptions} {...register('cible')} />
                        {templateDefaut && (
                          <div className="flex items-end">
                            <Button type="button" variant="secondary" onClick={useTemplate} className="w-full">
                              <Zap className="h-4 w-4" /> Utiliser le template
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1" loading={isSubmitting} disabled={!moduleEnabled}>
                          <Send className="h-4 w-4" /> Envoyer
                        </Button>
                        <Button type="button" variant="secondary" onClick={enregistrerTemplate} title="Enregistrer comme modèle réutilisable">
                          <Plus className="h-4 w-4" /> Modèle
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
              </div>
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader><CardTitle>Statistiques</CardTitle></CardHeader>
                  <CardBody className="space-y-3">
                    <p className="text-xs text-gray-500">
                      Apple et Google ne transmettent aucun accusé de lecture sur les cartes Wallet :
                      seuls les envois réellement effectués sont comptés ici.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard label="Cartes touchées (total)" value={formatNumber(stats?.totalEnvoyes ?? 0)} icon={Send} iconBg="bg-blue-50" iconColor="text-blue-600" />
                      <StatCard label="Cartes joignables" value={formatNumber((stats as any)?.totalJoignables ?? 0)} icon={Bell} iconBg="bg-green-50" iconColor="text-green-600" />
                      <StatCard label="Envois ce mois-ci" value={formatNumber((stats as any)?.notifsCeMois ?? 0)} icon={Calendar} iconBg="bg-purple-50" iconColor="text-purple-600" />
                      <StatCard label="Cartes touchées ce mois" value={formatNumber((stats as any)?.envoyesCeMois ?? 0)} icon={TrendingUp} iconBg="bg-orange-50" iconColor="text-orange-600" />
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <Card>
              <CardHeader><CardTitle>Historique des envois</CardTitle></CardHeader>
              {history.length === 0 ? (
                <CardBody>
                  <div className="py-8 text-center">
                    <Bell className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Aucune notification envoyée</p>
                  </div>
                </CardBody>
              ) : (
                <div className="divide-y divide-gray-50">
                  {history.map((n) => {
                    const taux = n.total_envoyes > 0 ? Math.round((n.total_ouverts / n.total_envoyes) * 100) : 0;
                    return (
                      <div key={n.id} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{n.titre}</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{n.message}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant={n.simulation ? 'yellow' : 'blue'}>{cibleLabel[n.cible] || n.cible}</Badge>
                            {n.simulation && <Badge variant="gray">Simulation</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{n.total_envoyes} envoyés</span>
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{n.total_ouverts} ouverts ({taux}%)</span>
                          <span className="ml-auto">{formatDateTime(n.created_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}


        </div>
      )}
    </DashboardLayout>
  );
}
