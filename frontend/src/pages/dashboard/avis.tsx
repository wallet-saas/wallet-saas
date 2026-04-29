import { useEffect, useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { StatCard } from '@/components/ui/StatCard';
import { PageSpinner } from '@/components/ui/Spinner';
import { avisApi, type Avis } from '@/services/api';
import { formatDate } from '@/utils/format';
import { Star, MessageSquare, Send, Sparkles, CheckCircle, Filter } from 'lucide-react';

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
  const [avis, setAvis] = useState<Avis[]>([]);
  const [total, setTotal] = useState(0);
  const [moyenne, setMoyenne] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterNote, setFilterNote] = useState<number | undefined>();
  const [modal, setModal] = useState<{ open: boolean; avis?: Avis; reponse?: string; aiLoading?: boolean; sending?: boolean }>({ open: false });

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

  const handleFilterNote = (n: number | undefined) => {
    setFilterNote(n);
    fetchAvis(n);
  };

  const openModal = (a: Avis) => {
    setModal({ open: true, avis: a, reponse: a.reponse_suggeree || a.reponse_envoyee || '' });
  };

  const handleAI = async () => {
    if (!modal.avis) return;
    setModal(m => ({ ...m, aiLoading: true }));
    try {
      const { reponse_suggeree } = await avisApi.suggestResponse(modal.avis.id);
      setModal(m => ({ ...m, reponse: reponse_suggeree, aiLoading: false }));
    } catch (e: any) {
      alert(e?.message);
      setModal(m => ({ ...m, aiLoading: false }));
    }
  };

  const handleSend = async () => {
    if (!modal.avis || !modal.reponse) return;
    setModal(m => ({ ...m, sending: true }));
    try {
      await avisApi.sendResponse(modal.avis.id, modal.reponse);
      setModal({ open: false });
      fetchAvis(filterNote);
    } catch (e: any) {
      alert(e?.message);
      setModal(m => ({ ...m, sending: false }));
    }
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

      {loading ? <PageSpinner /> : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Note moyenne" value={`${moyenne.toFixed(1)} / 5`} icon={Star} iconBg="bg-yellow-50" iconColor="text-yellow-600" />
            <StatCard label="Total avis" value={total} icon={MessageSquare} iconBg="bg-blue-50" iconColor="text-blue-600" />
            <StatCard label="Répondus" value={repondus} icon={CheckCircle} iconBg="bg-green-50" iconColor="text-green-600" />
            <StatCard label="Sans réponse" value={total - repondus} icon={MessageSquare} iconBg="bg-orange-50" iconColor="text-orange-600" />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500 flex items-center gap-1.5">
              <Filter className="h-4 w-4" /> Filtrer :
            </span>
            <Button
              variant={!filterNote ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleFilterNote(undefined)}
            >Toutes</Button>
            {[5,4,3,2,1].map(n => (
              <Button
                key={n}
                variant={filterNote === n ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleFilterNote(n)}
              >
                {'★'.repeat(n)} {n}
              </Button>
            ))}
          </div>

          {/* Avis list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {avis.length === 0 ? (
              <div className="md:col-span-2 card p-12 text-center">
                <Star className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Aucun avis trouvé</p>
              </div>
            ) : (
              avis.map(a => (
                <Card key={a.id} className="hover:shadow-md transition-shadow">
                  <CardBody>
                    <div className="flex items-start justify-between mb-3">
                      <Stars note={a.note} />
                      <div className="flex items-center gap-2">
                        <Badge variant={noteColors[a.note] || 'gray'}>{a.note}/5</Badge>
                        {a.reponse_envoyee && <Badge variant="green">Répondu</Badge>}
                      </div>
                    </div>

                    {a.contenu && (
                      <p className="text-sm text-gray-700 mb-3 line-clamp-3">"{a.contenu}"</p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="gray">{a.source}</Badge>
                        <span className="text-xs text-gray-400">{formatDate(a.created_at)}</span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openModal(a)}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Répondre
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Response modal */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title="Répondre à l'avis"
        size="md"
      >
        {modal.avis && (
          <div className="space-y-4">
            {/* Avis recap */}
            <div className="bg-gray-50 rounded-xl p-4">
              <Stars note={modal.avis.note} size="md" />
              {modal.avis.contenu && (
                <p className="text-sm text-gray-700 mt-2">"{modal.avis.contenu}"</p>
              )}
            </div>

            {/* AI response */}
            <Textarea
              label="Votre réponse"
              value={modal.reponse || ''}
              onChange={e => setModal(m => ({ ...m, reponse: e.target.value }))}
              rows={5}
              placeholder="Rédigez votre réponse…"
            />

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleAI}
                loading={modal.aiLoading}
                className="flex-1"
              >
                <Sparkles className="h-4 w-4" />
                Générer avec IA
              </Button>
              <Button
                onClick={handleSend}
                loading={modal.sending}
                disabled={!modal.reponse}
                className="flex-1"
              >
                <Send className="h-4 w-4" />
                Envoyer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
