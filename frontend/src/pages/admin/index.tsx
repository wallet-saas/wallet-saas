/**
 * Stamply Admin — console d'administration.
 *
 * Refonte : uniquement des données réelles, lues dans les tables Supabase.
 * Trois vues :
 *   1. Vue d'ensemble  — chiffres consolidés de la plateforme
 *   2. Commerçants     — recherche, fiche détaillée, activation/retrait d'abonnement
 *   3. Journal         — historique tracé des actions d'administration
 *
 * Toute action sur un abonnement est enregistrée dans admin_logs.
 */
import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Shield, Users, CreditCard, TrendingUp, Search, CheckCircle, XCircle,
  Loader2, ScrollText, RefreshCw, ArrowLeft, Bell, Star,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function adminToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('stamply_admin_token') : null;
}

async function adminFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken()}`,
      ...(options.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Erreur ${res.status}`);
  }
  return json.data ?? json;
}

/* ── Éléments d'interface ─────────────────────────────────────────────────── */

function Stat({ label, value, sub, icon: Icon, tone = 'indigo' }: {
  label: string; value: string | number; sub?: string; icon: any; tone?: string;
}) {
  const tones: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 uppercase tracking-wider truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function StatutBadge({ statut }: { statut?: string }) {
  const actif = statut === 'actif';
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
      actif ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
    }`}>
      {actif ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {actif ? 'Abonné' : statut === 'suspendu' ? 'Suspendu' : 'Sans abonnement'}
    </span>
  );
}

/* ── Vue d'ensemble ───────────────────────────────────────────────────────── */

function VueEnsemble() {
  const [stats, setStats] = useState<any>(null);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(() => {
    setChargement(true);
    adminFetch('/stats')
      .then(setStats)
      .catch(e => setErreur(e.message))
      .finally(() => setChargement(false));
  }, []);

  useEffect(charger, [charger]);

  if (chargement) return <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500 mx-auto" /></div>;
  if (erreur) return <p className="text-sm text-red-600 py-8">{erreur}</p>;

  const c = stats?.['commerçants'] || {};
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Chiffres de la plateforme</h2>
        <button onClick={charger} className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1">
          <RefreshCw className="h-3 w-3" /> Actualiser
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Commerçants" value={c.total ?? 0} sub={`${c.nouveaux_30j ?? 0} inscrits ce mois`} icon={Users} />
        <Stat label="Abonnements actifs" value={c.actifs ?? 0} sub={`${c.inactifs ?? 0} sans abonnement`} icon={CheckCircle} tone="green" />
        <Stat label="Revenu mensuel estimé" value={`${stats?.mrr_estime ?? 0} €`} sub="abonnés actifs × 49 €" icon={TrendingUp} tone="green" />
        <Stat label="Cartes installées" value={stats?.cartes ?? 0} sub={`${stats?.cartes_30j ?? 0} ce mois`} icon={CreditCard} tone="blue" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Cartes joignables" value={stats?.cartes_joignables ?? 0} sub="canal Wallet actif" icon={Bell} tone="blue" />
        <Stat label="Visites (7 jours)" value={stats?.visites_7j ?? 0} icon={TrendingUp} tone="orange" />
        <Stat label="Visites (30 jours)" value={stats?.visites_30j ?? 0} icon={TrendingUp} tone="orange" />
        <Stat label="Avis collectés" value={stats?.avis_total ?? 0} icon={Star} tone="indigo" />
      </div>

      <p className="text-xs text-gray-400">
        Tous ces chiffres sont comptés directement dans la base : commerçants, cartes, visites,
        notifications et avis. Aucune estimation, hors le revenu mensuel qui multiplie
        simplement les abonnés actifs par le tarif de 49 €.
      </p>
    </div>
  );
}

/* ── Fiche commerçant ─────────────────────────────────────────────────────── */

function FicheCommercant({ id, onRetour, onMaj }: { id: string; onRetour: () => void; onMaj: () => void }) {
  const [fiche, setFiche] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [action, setAction] = useState(false);
  const [message, setMessage] = useState('');

  const charger = useCallback(() => {
    setChargement(true);
    adminFetch(`/commercants/${id}`)
      .then(setFiche)
      .catch(e => setMessage(e.message))
      .finally(() => setChargement(false));
  }, [id]);

  useEffect(charger, [charger]);

  const changerAbonnement = async (actif: boolean) => {
    const verbe = actif ? "activer l'abonnement de" : "retirer l'abonnement de";
    if (!window.confirm(`Confirmer : ${verbe} ${fiche?.nom_enseigne} ?`)) return;
    setAction(true);
    setMessage('');
    try {
      await adminFetch(`/commercants/${id}/abonnement`, {
        method: 'POST',
        body: JSON.stringify({ actif, motif: 'Action manuelle depuis la console admin' }),
      });
      setMessage(actif ? 'Abonnement activé.' : 'Abonnement retiré.');
      charger();
      onMaj();
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setAction(false);
    }
  };

  if (chargement) return <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500 mx-auto" /></div>;
  if (!fiche) return <p className="text-sm text-red-600 py-8">{message || 'Commerçant introuvable.'}</p>;

  const actif = fiche.abonnement_statut === 'actif';

  return (
    <div className="space-y-6">
      <button onClick={onRetour} className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Retour à la liste
      </button>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{fiche.nom_enseigne || 'Sans nom'}</h2>
            <p className="text-sm text-gray-500">{fiche.email}</p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <StatutBadge statut={fiche.abonnement_statut} />
              {fiche.whop_subscription_id && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Payant via Whop</span>
              )}
              <span className="text-xs text-gray-400">
                Inscrit le {new Date(fiche.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => changerAbonnement(true)}
              disabled={action || actif}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {action ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Activer l'abonnement
            </button>
            <button
              onClick={() => changerAbonnement(false)}
              disabled={action || !actif}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Retirer l'abonnement
            </button>
          </div>
        </div>

        {message && (
          <p className="mt-3 text-sm text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2">{message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Cartes installées" value={fiche.stats?.cartes ?? 0} icon={CreditCard} tone="blue" />
        <Stat label="Visites (30 j)" value={fiche.stats?.visites_30j ?? 0} icon={TrendingUp} tone="orange" />
        <Stat label="Boutiques" value={fiche.stats?.boutiques ?? 0} icon={Users} />
        <Stat label="Programme" value={fiche.carte_type || 'tampons'} icon={Star} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Coordonnées et configuration</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            ['Téléphone', fiche.telephone],
            ['Adresse', [fiche.adresse, fiche.code_postal, fiche.ville].filter(Boolean).join(', ')],
            ['Carte Wallet configurée', fiche.wallet_class_configured ? 'Oui' : 'Non'],
            ['Module avis Google', fiche.module_avis_google ? 'Activé' : 'Désactivé'],
            ['Module géolocalisation', fiche.module_geolocalisation ? 'Activé' : 'Désactivé'],
            ['Fiche Google', fiche.google_place_url || '—'],
          ].map(([label, valeur]) => (
            <div key={label as string}>
              <dt className="text-xs text-gray-400 uppercase tracking-wider">{label}</dt>
              <dd className="text-gray-800 break-words">{valeur || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/* ── Liste des commerçants ────────────────────────────────────────────────── */

function ListeCommercants({ onOuvrir }: { onOuvrir: (id: string) => void }) {
  const [liste, setListe] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState('');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const charger = useCallback(() => {
    setChargement(true);
    const params = new URLSearchParams({ limit: '100' });
    if (recherche.trim()) params.set('search', recherche.trim());
    if (filtre) params.set('statut', filtre);
    adminFetch(`/commercants?${params}`)
      .then(d => { setListe(d['commerçants'] || []); setTotal(d.total || 0); setErreur(''); })
      .catch(e => setErreur(e.message))
      .finally(() => setChargement(false));
  }, [recherche, filtre]);

  useEffect(() => {
    const t = setTimeout(charger, 300);
    return () => clearTimeout(t);
  }, [charger]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher par enseigne ou email…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
        <select value={filtre} onChange={e => setFiltre(e.target.value)} className="rounded-lg border border-gray-200 text-sm px-3 py-2">
          <option value="">Tous les statuts</option>
          <option value="actif">Abonnés</option>
          <option value="inactif">Sans abonnement</option>
          <option value="suspendu">Suspendus</option>
        </select>
        <span className="text-xs text-gray-400">{total} commerçant{total > 1 ? 's' : ''}</span>
      </div>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {chargement ? (
          <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500 mx-auto" /></div>
        ) : liste.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">Aucun commerçant trouvé.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {liste.map(c => (
              <button
                key={c.id}
                onClick={() => onOuvrir(c.id)}
                className="w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.nom_enseigne || 'Sans nom'}</p>
                  <p className="text-xs text-gray-500 truncate">{c.email}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-xs text-gray-400 hidden sm:block">{c.nb_cartes} carte{c.nb_cartes > 1 ? 's' : ''}</span>
                  <span className="text-xs text-gray-400 hidden md:block">{c.nb_visites_30j} visite{c.nb_visites_30j > 1 ? 's' : ''} / 30 j</span>
                  <StatutBadge statut={c.abonnement_statut} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Journal des actions ──────────────────────────────────────────────────── */

function Journal() {
  const [logs, setLogs] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    adminFetch('/logs?limit=100')
      .then(d => setLogs(d.logs || d || []))
      .catch(e => setErreur(e.message))
      .finally(() => setChargement(false));
  }, []);

  if (chargement) return <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500 mx-auto" /></div>;
  if (erreur) return <p className="text-sm text-red-600 py-8">{erreur}</p>;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-700">Actions d'administration</h3>
        <p className="text-xs text-gray-400 mt-0.5">Chaque activation ou retrait d'abonnement est tracé ici.</p>
      </div>
      {logs.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">Aucune action enregistrée.</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {logs.map((l: any, i: number) => (
            <div key={l.id || i} className="px-5 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-800">{l.action}</span>
                <span className="text-xs text-gray-400">
                  {l.created_at ? new Date(l.created_at).toLocaleString('fr-FR') : ''}
                </span>
              </div>
              {l.details && (
                <p className="text-xs text-gray-500 mt-1 break-words">
                  {typeof l.details === 'string' ? l.details : JSON.stringify(l.details)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [vue, setVue] = useState<'ensemble' | 'commercants' | 'journal'>('ensemble');
  const [ficheId, setFicheId] = useState<string | null>(null);
  const [rafraichir, setRafraichir] = useState(0);

  useEffect(() => {
    if (!adminToken()) { setAuthed(false); return; }
    adminFetch('/stats').then(() => setAuthed(true)).catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (authed === false) router.replace('/admin/login');
  }, [authed, router]);

  if (authed !== true) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
    </div>;
  }

  const onglets = [
    { id: 'ensemble' as const, label: "Vue d'ensemble", icon: TrendingUp },
    { id: 'commercants' as const, label: 'Commerçants', icon: Users },
    { id: 'journal' as const, label: 'Journal', icon: ScrollText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>Administration — Stamply</title></Head>

      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 flex-wrap">
          <Shield className="h-5 w-5 text-indigo-600 mr-2" />
          <span className="text-lg font-bold text-indigo-600 mr-4">Stamply Admin</span>
          {onglets.map(o => (
            <button
              key={o.id}
              onClick={() => { setVue(o.id); setFicheId(null); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                vue === o.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <o.icon className="h-4 w-4" /> {o.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => { localStorage.removeItem('stamply_admin_token'); router.push('/admin/login'); }}
          className="text-sm text-gray-500 hover:text-red-600"
        >
          Déconnexion
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {vue === 'ensemble' && <VueEnsemble key={rafraichir} />}
        {vue === 'commercants' && (
          ficheId
            ? <FicheCommercant id={ficheId} onRetour={() => setFicheId(null)} onMaj={() => setRafraichir(n => n + 1)} />
            : <ListeCommercants key={rafraichir} onOuvrir={setFicheId} />
        )}
        {vue === 'journal' && <Journal key={rafraichir} />}
      </main>
    </div>
  );
}
