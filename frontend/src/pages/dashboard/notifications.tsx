import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Toggle';
import { StatCard } from '@/components/ui/StatCard';
import { PageSpinner } from '@/components/ui/Spinner';
import { notificationsApi, type Notification, type NotifStats } from '@/services/api';
import { commercantApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime, formatPercent, formatNumber } from '@/utils/format';
import { Bell, Send, Users, Eye, TrendingUp, CheckCircle, AlertCircle, Settings, Zap } from 'lucide-react';

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
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'history' | 'settings'>('send');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { cible: 'tous' },
  });

  const [moduleEnabled, setModuleEnabled] = useState(true);
  const [maxPerDay, setMaxPerDay] = useState(3);
  const [heureDebut, setHeureDebut] = useState(8);
  const [heureFin, setHeureFin] = useState(22);
  const [templateDefaut, setTemplateDefaut] = useState('');

  useEffect(() => {
    if (commercant) {
      setModuleEnabled(commercant.module_notifications ?? true);
      setMaxPerDay(commercant.notif_max_par_jour ?? 3);
      setHeureDebut(commercant.notif_heure_debut ?? 8);
      setHeureFin(commercant.notif_heure_fin ?? 22);
      setTemplateDefaut(commercant.notif_template_defaut ?? '');
    }
  }, [commercant]);

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

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await commercantApi.update({
        module_notifications: moduleEnabled,
        notif_max_par_jour: maxPerDay,
        notif_heure_debut: heureDebut,
        notif_heure_fin: heureFin,
        notif_template_defaut: templateDefaut,
      });
      await refreshUser();
      toast('Paramètres enregistrés');
    } catch (e: any) {
      toast(e?.message || 'Erreur', 'error');
    } finally { setSaving(false); }
  };

  const useTemplate = () => {
    if (templateDefaut) {
      const parts = templateDefaut.split('\n');
      setValue('titre', parts[0] || '');
      setValue('message', parts.slice(1).join('\n') || '');
    }
  };

  const cibleLabel: Record<string, string> = { tous: 'Tous', actifs: 'Actifs', dormants: 'Dormants' };

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
            <Toggle checked={moduleEnabled} onChange={setModuleEnabled} />
          </div>

          <div className="flex gap-2">
            {([
              { id: 'send', label: 'Envoyer', icon: Send },
              { id: 'history', label: 'Historique', icon: Eye },
              { id: 'settings', label: 'Paramètres', icon: Settings },
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
                      <Button type="submit" className="w-full" loading={isSubmitting} disabled={!moduleEnabled}>
                        <Send className="h-4 w-4" /> Envoyer
                      </Button>
                    </form>
                  </CardBody>
                </Card>
              </div>
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader><CardTitle>Statistiques</CardTitle></CardHeader>
                  <CardBody className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard label="Total envoyés" value={formatNumber(stats?.totalEnvoyes ?? 0)} icon={Send} iconBg="bg-blue-50" iconColor="text-blue-600" />
                      <StatCard label="Taux d'ouverture" value={formatPercent(stats?.tauxOuverture ?? 0)} icon={TrendingUp} iconBg="bg-purple-50" iconColor="text-purple-600" />
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

          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Limites anti-spam</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  <Input label="Max notifications par client par jour" type="number" min={1} max={20} value={maxPerDay} onChange={e => setMaxPerDay(Number(e.target.value))} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Ne pas envoyer avant (h)" type="number" min={0} max={23} value={heureDebut} onChange={e => setHeureDebut(Number(e.target.value))} />
                    <Input label="Ne pas envoyer après (h)" type="number" min={0} max={23} value={heureFin} onChange={e => setHeureFin(Number(e.target.value))} />
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader><CardTitle>Template par défaut</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  <Textarea label="Message pré-rempli" placeholder="Bonjour ! Nouvelle offre spéciale…" rows={6} value={templateDefaut} onChange={e => setTemplateDefaut(e.target.value)} />
                </CardBody>
              </Card>

              <div className="lg:col-span-2">
                <Button onClick={handleSaveSettings} loading={saving} size="lg">
                  <Settings className="h-4 w-4" /> Enregistrer les paramètres
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
