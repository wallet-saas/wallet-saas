/**
 * Stamply — Panel Admin
 * 
 * Accessible via /admin?key=STAMPLY_ADMIN_KEY
 * 
 * Pages :
 *   /admin           — Dashboard stats + liste commerçants
 *   /admin/commercant/:id  — Fiche détaillée d'un commerçant
 *   /admin/feedbacks       — Feedbacks clients (<4 étoiles)
 *   /admin/logs            — Logs des actions admin
 */

import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Users, CreditCard, Store, TrendingUp,
  Search, ChevronRight, CheckCircle, XCircle,
  AlertTriangle, ArrowLeft
} from 'lucide-react';
import { adminApi, AdminStats, AdminCommercant } from '@/services/adminApi';

// ─── Auth guard ────────────────────────────────────────────────────────────────

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || 'stamply_admin_default_change_me';

function useAdminAuth() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (router.isReady) {
      const key = router.query.key as string;
      if (key && key === ADMIN_KEY) {
        setAuthed(true);
      } else {
        setAuthed(false);
      }
      setLoading(false);
    }
  }, [router.isReady, router.query.key]);

  return { authed, loading };
}

// ─── Main Admin Page ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const { authed, loading } = useAdminAuth();
  const router = useRouter();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>;
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Accès refusé</h1>
          <p className="text-gray-500 mb-4">Clé admin manquante ou invalide.</p>
          <p className="text-xs text-gray-400">Accédez via /admin?key=VOTRE_CLE_ADMIN</p>
        </div>
      </div>
    );
  }

  return <AdminDashboard key={router.asPath} />;
}

// ─── Sub-pages router ─────────────────────────────────────────────────────────

function AdminDashboard() {
  const router = useRouter();
  const { page } = router.query;

  // Sub-page: commercant detail
  if (page === 'commercant' && router.query.id) {
    return <AdminCommercantPage commercantId={router.query.id as string} />;
  }

  // Sub-page: feedbacks
  if (page === 'feedbacks') {
    return <AdminFeedbacksPage />;
  }

  // Sub-page: logs
  if (page === 'logs') {
    return <AdminLogsPage />;
  }

  // Default: stats + liste
  return <AdminStatsPage />;
}

// ─── Navigation ────────────────────────────────────────────────────────────────

function AdminNav({ active }: { active: string }) {
  const router = useRouter();
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { key: 'commercants', label: 'Commerçants', icon: Users },
    { key: 'feedbacks', label: 'Feedbacks', icon: AlertTriangle },
    { key: 'logs', label: 'Logs', icon: CreditCard },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center gap-1">
        <span className="text-lg font-bold text-indigo-600 mr-4">🛡️ Stamply Admin</span>
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => {
              if (item.key === 'dashboard') router.push('/admin?key=' + ADMIN_KEY);
              else router.push(`/admin?key=${ADMIN_KEY}&page=${item.key}`);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              active === item.key
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── Stats Page ────────────────────────────────────────────────────────────────

function AdminStatsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [commercants, setCommercants] = useState<AdminCommercant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  useEffect(() => {
    adminApi.stats().then(setStats).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    adminApi.listCommerçants({ page, limit: 20, search })
      .then(res => {
        setCommercants(res.commerçants);
        setTotalPages(res.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>Admin — Stamply</title></Head>
      <AdminNav active="dashboard" />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Commerçants" value={stats.commerçants.total} icon={Users} color="indigo" sub={`${stats.commerçants.actifs} actifs`} />
            <StatCard label="Cartes" value={stats.cartes} icon={CreditCard} color="green" />
            <StatCard label="Visites (30j)" value={stats.visites_30j} icon={TrendingUp} color="blue" />
            <StatCard label="Boutiques" value={stats.boutiques} icon={Store} color="purple" />
          </div>
        )}

        {/* Commerçants table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Commerçants</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">Chargement...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Commerçant</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Inscrit le</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Stripe</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commercants.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{c.nom_enseigne || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4">
                      {c.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          <CheckCircle className="h-3 w-3" /> Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                          <XCircle className="h-3 w-3" /> Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {c.stripe_customer_id ? (
                        <span className="text-xs text-green-600">✓ Connecté</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/admin?key=${ADMIN_KEY}&page=commercant&id=${c.id}`)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                      >
                        Détails <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">Page {page} sur {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">Précédent</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">Suivant</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Commercant Detail Page ────────────────────────────────────────────────────

function AdminCommercantPage({ commercantId }: { commercantId: string }) {
  const [commercant, setCommercant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resetPw, setResetPw] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    adminApi.getCommercant(commercantId)
      .then(setCommercant)
      .catch(err => setMessage(err.message))
      .finally(() => setLoading(false));
  }, [commercantId]);

  const handleAction = async (action: string) => {
    try {
      setMessage('');
      switch (action) {
        case 'suspendre':
          await adminApi.suspendreCommercant(commercantId);
          setMessage('Commerçant suspendu.');
          break;
        case 'reactiver':
          await adminApi.reactiverCommercant(commercantId);
          setMessage('Commerçant réactivé.');
          break;
        case 'reset_pw':
          if (!resetPw || resetPw.length < 8) { setMessage('Mot de passe: 8 caractères min.'); return; }
          await adminApi.resetPassword(commercantId, resetPw);
          setMessage('Mot de passe réinitialisé.');
          setShowReset(false);
          setResetPw('');
          break;
        case 'supprimer':
          if (!confirm('Supprimer définitivement ce commerçant ?')) return;
          await adminApi.supprimerCommercant(commercantId);
          router.push('/admin?key=' + ADMIN_KEY);
          return;
      }
      // Refresh
      const updated = await adminApi.getCommercant(commercantId);
      setCommercant(updated);
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50"><AdminNav active="commercants" /><div className="p-8 text-center">Chargement...</div></div>;
  if (!commercant) return <div className="min-h-screen bg-gray-50"><AdminNav active="commercants" /><div className="p-8 text-center text-red-500">{message || 'Introuvable'}</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>Admin — {commercant.nom_enseigne}</title></Head>
      <AdminNav active="commercants" />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <button onClick={() => router.push('/admin?key=' + ADMIN_KEY)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>

        {message && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-indigo-50 text-indigo-700 text-sm">{message}</div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{commercant.nom_enseigne}</h1>
              <p className="text-gray-500 mt-1">{commercant.email}</p>
              {commercant.telephone && <p className="text-sm text-gray-400 mt-1">📞 {commercant.telephone}</p>}
            </div>
            <div className="flex items-center gap-2">
              {commercant.is_active ? (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">Actif</span>
              ) : (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700">Suspendu</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{commercant.stats?.boutiques || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Boutiques</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{commercant.stats?.cartes || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Cartes</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{commercant.stats?.visites_30j || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Visites (30j)</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {commercant.is_active ? (
              <button onClick={() => handleAction('suspendre')} className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors">
                Suspendre
              </button>
            ) : (
              <button onClick={() => handleAction('reactiver')} className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
                Réactiver
              </button>
            )}

            <button onClick={() => setShowReset(!showReset)} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
              Reset mot de passe
            </button>

            <button onClick={() => handleAction('supprimer')} className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
              Supprimer
            </button>
          </div>

          {showReset && (
            <div className="mt-4 flex gap-3">
              <input
                type="password"
                placeholder="Nouveau mot de passe (8+ caractères)"
                value={resetPw}
                onChange={e => setResetPw(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button onClick={() => handleAction('reset_pw')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                Confirmer
              </button>
            </div>
          )}
        </div>

        {/* Infos détaillées */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-gray-500">ID</dt><dd className="font-mono text-xs text-gray-700">{commercant.id}</dd></div>
            <div><dt className="text-gray-500">Inscrit le</dt><dd className="text-gray-700">{new Date(commercant.created_at).toLocaleString('fr-FR')}</dd></div>
            <div><dt className="text-gray-500">Stripe Customer</dt><dd className="font-mono text-xs text-gray-700">{commercant.stripe_customer_id || '—'}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}

// ─── Feedbacks Page ────────────────────────────────────────────────────────────

function AdminFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    adminApi.feedbacks({ page, limit: 20 })
      .then(res => setFeedbacks(res.feedbacks))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>Admin — Feedbacks</title></Head>
      <AdminNav active="feedbacks" />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Feedbacks clients (&lt;4 étoiles)</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Chargement...</div>
          ) : feedbacks.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Aucun feedback négatif 🎉</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Commerçant</th>
                  <th className="px-6 py-3">Note</th>
                  <th className="px-6 py-3">Commentaire</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feedbacks.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{f.commercants?.nom_enseigne || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${f.note <= 2 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                        {'⭐'.repeat(f.note)} {f.note}/5
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{f.commentaire || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(f.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Logs Page ─────────────────────────────────────────────────────────────────

function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    adminApi.logs({ page, limit: 50 })
      .then(res => setLogs(res.logs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>Admin — Logs</title></Head>
      <AdminNav active="logs" />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Logs d'administration</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Chargement...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Aucun log</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Cible</th>
                  <th className="px-6 py-3">Détails</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{l.action}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{l.target_type || '—'}</td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono max-w-xs truncate">{JSON.stringify(l.details) || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(l.created_at).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card Component ───────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string;
  value: number;
  icon: any;
  color: string;
  sub?: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.indigo}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{label}</div>
          {sub && <div className="text-xs text-gray-400">{sub}</div>}
        </div>
      </div>
    </div>
  );
}
