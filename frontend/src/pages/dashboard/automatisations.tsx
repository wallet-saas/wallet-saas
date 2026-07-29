/**
 * Module Automatisations — les notifications qui partent toutes seules.
 *
 * Deux automatisations, chacune entièrement paramétrable :
 *   • Relance des clients dormants (après X jours sans visite)
 *   • Anniversaires (le jour J, une seule fois par an)
 *
 * Le commerçant règle le titre, le message et les conditions, avec un aperçu
 * du rendu réel sur la carte du client et des variables insérables en un clic.
 */
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { useAutoSave, SaveIndicator } from '@/hooks/useAutoSave';
import { useAuth } from '@/hooks/useAuth';
import { commercantApi } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Zap, Cake, Clock, Info, Send } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const VARIABLES = [
  { cle: '{{nom}}', desc: 'prénom du client' },
  { cle: '{{nom_enseigne}}', desc: 'nom de votre commerce' },
];

/** Aperçu de la notification telle qu'elle arrive sur la carte du client. */
function ApercuNotification({ titre, message, enseigne, prenomExemple = 'Marie' }: {
  titre: string; message: string; enseigne: string; prenomExemple?: string;
}) {
  const rendu = (txt: string) => (txt || '')
    .replace(/\{\{nom\}\}/g, prenomExemple)
    .replace(/\{\{nom_enseigne\}\}/g, enseigne || 'Votre commerce');

  return (
    <div className="rounded-xl bg-gray-900 p-4">
      <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">
        Aperçu sur le téléphone du client
      </p>
      <div className="rounded-lg bg-white/10 backdrop-blur px-3 py-2.5">
        <p className="text-xs font-semibold text-white">{rendu(titre) || 'Titre de la notification'}</p>
        <p className="text-xs text-white/70 mt-0.5">{rendu(message) || 'Contenu du message…'}</p>
      </div>
    </div>
  );
}

/** Boutons d'insertion des variables dans un champ. */
function BoutonsVariables({ onInsert }: { onInsert: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {VARIABLES.map(v => (
        <button
          key={v.cle}
          type="button"
          onClick={() => onInsert(v.cle)}
          className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
          title={`Insérer ${v.desc}`}
        >
          {v.cle}
        </button>
      ))}
    </div>
  );
}

export default function AutomatisationsPage() {
  const { commercant, refreshUser } = useAuth();
  const { show: toast } = useToast();
  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('stamply_token') : null);

  // Relance des dormants
  const [relanceAuto, setRelanceAuto] = useState(false);
  const [relanceJours, setRelanceJours] = useState(30);
  const [relanceTitre, setRelanceTitre] = useState('');
  const [relanceMessage, setRelanceMessage] = useState('');

  // Anniversaires
  const [annivAuto, setAnnivAuto] = useState(false);
  const [annivTitre, setAnnivTitre] = useState('');
  const [annivMessage, setAnnivMessage] = useState('');

  useEffect(() => {
    if (!commercant) return;
    const c = commercant as any;
    setRelanceAuto(c.relance_auto ?? false);
    setRelanceJours(c.relance_jours ?? 30);
    setRelanceTitre(c.relance_titre ?? '{{nom_enseigne}} vous attend !');
    setRelanceMessage(c.relance_message ?? 'Revenez nous voir ! Profitez de vos tampons et offres spéciales.');
    setAnnivAuto(c.anniversaire_auto ?? false);
    setAnnivTitre(c.anniversaire_titre ?? '🎂 Joyeux anniversaire {{nom}} !');
    setAnnivMessage(c.anniversaire_message ?? "Joyeux anniversaire de la part de {{nom_enseigne}} ! Venez profiter d'une offre spéciale pour votre journée 🎉");
  }, [commercant]);

  const sauvegarder = useCallback(async () => {
    await commercantApi.update({
      relance_auto: relanceAuto,
      relance_jours: relanceJours,
      relance_titre: relanceTitre,
      relance_message: relanceMessage,
      anniversaire_auto: annivAuto,
      anniversaire_titre: annivTitre,
      anniversaire_message: annivMessage,
    } as any);
    await refreshUser();
  }, [relanceAuto, relanceJours, relanceTitre, relanceMessage, annivAuto, annivTitre, annivMessage, refreshUser]);

  const { status } = useAutoSave({
    data: { relanceAuto, relanceJours, relanceTitre, relanceMessage, annivAuto, annivTitre, annivMessage },
    onSave: sauvegarder,
    debounceMs: 900,
  });

  // Tests manuels : déclencher l'envoi tout de suite pour vérifier le rendu
  const [testRelance, setTestRelance] = useState(false);
  const [testAnniv, setTestAnniv] = useState(false);

  const lancerTest = async (chemin: string, setLoading: (v: boolean) => void, defaut: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}${chemin}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      });
      const body = await res.json();
      toast(body?.data?.message || body?.message || defaut, 'success');
    } catch (e: any) {
      toast(e?.message || 'Erreur', 'error');
    } finally {
      setLoading(false);
    }
  };

  const enseigne = (commercant as any)?.nom_enseigne || 'Votre commerce';

  return (
    <DashboardLayout>
      <Head><title>Automatisations — Stamply</title></Head>

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Automatisations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Les notifications qui partent toutes seules, sans que vous ayez à y penser.
          </p>
        </div>
        <SaveIndicator status={status} />
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 mb-6 flex gap-2.5">
        <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          Ces envois sont déclenchés automatiquement plusieurs fois par jour. Chaque client
          ne reçoit jamais deux fois le même message : une relance au maximum par semaine,
          un message d'anniversaire une fois par an.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Relance des clients dormants ── */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <CardTitle>Relance des clients dormants</CardTitle>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Un rappel aux clients qui ne sont pas revenus depuis un moment.
                  </p>
                </div>
              </div>
              <Toggle checked={relanceAuto} onChange={setRelanceAuto} />
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <Input
                label="Déclencher après (jours sans visite)"
                type="number" min={3} max={365}
                value={relanceJours}
                onChange={e => setRelanceJours(Number(e.target.value) || 30)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Un client sans visite depuis {relanceJours} jours recevra ce message.
              </p>
            </div>

            <Input
              label="Titre de la notification"
              value={relanceTitre}
              onChange={e => setRelanceTitre(e.target.value)}
              placeholder="{{nom_enseigne}} vous attend !"
            />

            <div>
              <Textarea
                label="Message"
                rows={3}
                value={relanceMessage}
                onChange={e => setRelanceMessage(e.target.value)}
                placeholder="Revenez nous voir ! Profitez de vos tampons et offres spéciales."
              />
              <div className="mt-2">
                <BoutonsVariables onInsert={v => setRelanceMessage(m => `${m}${m.endsWith(' ') || !m ? '' : ' '}${v}`)} />
              </div>
            </div>

            <ApercuNotification titre={relanceTitre} message={relanceMessage} enseigne={enseigne} />

            <Button
              variant="secondary" size="sm" loading={testRelance}
              onClick={() => lancerTest('/api/relance/run', setTestRelance, 'Relance exécutée')}
            >
              <Send className="h-3.5 w-3.5" /> Lancer la relance maintenant
            </Button>
          </CardBody>
        </Card>

        {/* ── Anniversaires ── */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-pink-50 flex items-center justify-center">
                  <Cake className="h-4 w-4 text-pink-600" />
                </div>
                <div>
                  <CardTitle>Anniversaires</CardTitle>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Un message le jour J, pour les clients ayant renseigné leur date de naissance.
                  </p>
                </div>
              </div>
              <Toggle checked={annivAuto} onChange={setAnnivAuto} />
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Titre de la notification"
              value={annivTitre}
              onChange={e => setAnnivTitre(e.target.value)}
              placeholder="🎂 Joyeux anniversaire {{nom}} !"
            />

            <div>
              <Textarea
                label="Message"
                rows={3}
                value={annivMessage}
                onChange={e => setAnnivMessage(e.target.value)}
                placeholder="Joyeux anniversaire de la part de {{nom_enseigne}} !"
              />
              <div className="mt-2">
                <BoutonsVariables onInsert={v => setAnnivMessage(m => `${m}${m.endsWith(' ') || !m ? '' : ' '}${v}`)} />
              </div>
            </div>

            <ApercuNotification titre={annivTitre} message={annivMessage} enseigne={enseigne} />

            <Button
              variant="secondary" size="sm" loading={testAnniv}
              onClick={() => lancerTest('/api/relance/anniversaire', setTestAnniv, 'Anniversaires envoyés')}
            >
              <Send className="h-3.5 w-3.5" /> Envoyer les anniversaires du jour
            </Button>

            <p className="text-xs text-gray-500">
              Pensez à annoncer une offre concrète (une part de gâteau, une réduction…) :
              un message d'anniversaire sans contrepartie fait revenir peu de monde.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <Zap className="h-4 w-4 text-indigo-500" />
            <CardTitle>Les autres envois automatiques</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <ul className="space-y-2.5 text-sm text-gray-600">
            <li className="flex gap-2.5">
              <span className="text-gray-300">•</span>
              <span><strong>Demande d'avis</strong> après une visite — réglable dans le module Avis Google.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="text-gray-300">•</span>
              <span><strong>Rappel de proximité</strong> quand un client passe devant — réglable dans Géolocalisation.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="text-gray-300">•</span>
              <span><strong>Mise à jour des points</strong> à chaque passage en caisse — automatique, rien à régler.</span>
            </li>
          </ul>
        </CardBody>
      </Card>
    </DashboardLayout>
  );
}
