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
import { StatCard } from '@/components/ui/StatCard';
import { PageSpinner } from '@/components/ui/Spinner';
import { notificationsApi, type Notification, type NotifStats } from '@/services/api';
import { formatDateTime, formatPercent, formatNumber } from '@/utils/format';
import { Bell, Send, Users, Eye, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

const schema = z.object({
  titre: z.string().min(1, 'Titre requis').max(80, '80 caractères max'),
  message: z.string().min(1, 'Message requis').max(200, '200 caractères max'),
  cible: z.enum(['tous', 'actifs', 'dormants']),
});
type FormData = z.infer<typeof schema>;

const cibleOptions = [
  { value: 'tous', label: 'Tous les clients' },
  { value: 'actifs', label: 'Clients actifs (visites récentes)' },
  { value: 'dormants', label: 'Clients dormants (inactifs)' },
];

export default function NotificationsPage() {
  const [history, setHistory] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotifStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendResult, setSendResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { cible: 'tous' },
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
      setSendResult({
        success: true,
        message: `Envoyé à ${res.totalEnvoyes} client(s)${res.simulation ? ' (mode simulation)' : ''}`,
      });
      reset();
      fetchData();
    } catch (e: any) {
      setSendResult({ success: false, message: e?.message || 'Erreur envoi' });
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
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total envoyés" value={formatNumber(stats?.totalEnvoyes ?? 0)} icon={Send} iconBg="bg-blue-50" iconColor="text-blue-600" />
            <StatCard label="Total ouverts" value={formatNumber(stats?.totalOuverts ?? 0)} icon={Eye} iconBg="bg-green-50" iconColor="text-green-600" />
            <StatCard label="Taux d'ouverture" value={formatPercent(stats?.tauxOuverture ?? 0)} icon={TrendingUp} iconBg="bg-purple-50" iconColor="text-purple-600" />
            <StatCard
              label="Providers actifs"
              value={[stats?.apns && 'APNS', stats?.fcm && 'FCM'].filter(Boolean).join(' + ') || 'Simulation'}
              icon={Bell}
              iconBg="bg-orange-50"
              iconColor="text-orange-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Send form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader><CardTitle>Envoyer une notification</CardTitle></CardHeader>
                <CardBody>
                  {sendResult && (
                    <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg mb-4 ${sendResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                      {sendResult.success
                        ? <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        : <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      }
                      <p className={`text-sm ${sendResult.success ? 'text-green-700' : 'text-red-600'}`}>
                        {sendResult.message}
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                      label="Titre"
                      placeholder="Offre spéciale ce weekend !"
                      error={errors.titre?.message}
                      {...register('titre')}
                    />
                    <Textarea
                      label="Message"
                      placeholder="Profitez de -20% sur toute la carte…"
                      rows={4}
                      error={errors.message?.message}
                      {...register('message')}
                    />
                    <Select
                      label="Destinataires"
                      options={cibleOptions}
                      {...register('cible')}
                    />
                    <Button type="submit" className="w-full" loading={isSubmitting}>
                      <Send className="h-4 w-4" />
                      Envoyer
                    </Button>
                  </form>
                </CardBody>
              </Card>
            </div>

            {/* History */}
            <div className="lg:col-span-3">
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
                      const taux = n.total_envoyes > 0
                        ? Math.round((n.total_ouverts / n.total_envoyes) * 100)
                        : 0;
                      return (
                        <div key={n.id} className="px-6 py-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{n.titre}</p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">{n.message}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant={n.simulation ? 'yellow' : 'blue'}>
                                {cibleLabel[n.cible] || n.cible}
                              </Badge>
                              {n.simulation && <Badge variant="gray">Simulation</Badge>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {n.total_envoyes} envoyés
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {n.total_ouverts} ouverts ({taux}%)
                            </span>
                            <span className="ml-auto">{formatDateTime(n.created_at)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
