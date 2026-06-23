/**
 * Stamply — Panel Admin V2
 * 
 * Connexion directe par email + mot de passe
 * Liste des commerçants avec statuts d'abonnement
 */

import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Users, CreditCard, Store, TrendingUp,
  Search, ChevronRight, CheckCircle, XCircle,
  AlertTriangle, ArrowLeft, RefreshCw, Shield,
  Activity, ScanLine, Bell, FileText, Tag, Loader2
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';

// ─── Auth guard ────────────────────────────────────────────────────────────────

function useAdminAuth() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('stamply_admin_token');
    if (token) {
      // Verify token is still valid (basic check)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'admin' && payload.exp * 1000 > Date.now()) {
          setAuthed(true);
        } else {
          localStorage.removeItem('stamply_admin_token');
        }
      } catch {
        localStorage.removeItem('stamply_admin_token');
      }
    }
    setLoading(false);
  }, []);

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
    router.push('/admin/login');
    return null;
  }

  return <AdminDashboard key={router.asPath} />;
}

// ─── Sub-pages router ─────────────────────────────────────────────────────────

function AdminDashboard() {
  const router = useRouter();
  const { page } = router.query;

  if (page === 'commercant' && router.query.id) {
    return <AdminCommercantPage commercantId={router.query.id as string} />;
  }
  if (page === 'feedbacks') return <AdminFeedbacksPage />;
  if (page === 'logs') return <AdminLogsPage />;
  if (page === 'status') return <AdminStatusPage />;
  if (page === 'clients') return <AdminClientsPage />;
  if (page === 'scans') return <AdminScansPage />;
  if (page === 'notifications') return <AdminNotificationsPage />;
  if (page === 'templates') return <AdminTemplatesPage />;
  if (page === 'offres') return <AdminOffresPage />;

  return <AdminStatsPage />;
}

// ─── Navigation ────────────────────────────────────────────────────────────────

function AdminNav({ active }: { active: string }) {
  const router = useRouter();
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { key: 'commercants', label: 'Commerçants', icon: Users },
    { key: 'clients', label: 'Clients', icon: Users },
    { key: 'scans', label: 'Scans', icon: ScanLine },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'templates', label: 'Templates', icon: FileText },
    { key: 'offres', label: 'Offres', icon: Tag },
    { key: 'feedbacks', label: 'Feedbacks', icon: AlertTriangle },
    { key: 'logs', label: 'Logs', icon: CreditCard },
    { key: 'status', label: 'Santé', icon: Activity },
  ];

  const handleLogout = () => {
    localStorage.removeItem('stamply_admin_token');
    router.push('/admin/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-1 flex-wrap">
        <Shield className="h-5 w-5 text-indigo-600 mr-2" />
        <span className="text-lg font-bold text-indigo-600 mr-4">Stamply Admin</span>
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => {
              if (item.key === 'dashboard') router.push('/admin');
              else router.push(`/admin?page=${item.key}`);
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
      <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
        Déconnexion
      </button>
    </nav>
  );
}

// ─── Helper: Statut Badge ──────────────────────────────────────────────────────

function getStatutBadge(statut: string) {
  switch (statut) {
    case 'actif':
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700"><CheckCircle className="h-3 w-3" /> Actif</span>;
    case 'inactif':
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"><XCircle className="h-3 w-3" /> Inactif</span>;
    case 'past_due':
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700"><AlertTriangle className="h-3 w-3" /> Impayé</span>;
    case 'suspendu':
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700"><AlertTriangle className="h-3 w-3" /> Suspendu</span>;
    default:
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{statut || '—'}</span>;
  }
}

// ─── Stats Page ────────────────────────────────────────────────────────────────

function AdminStatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [commercants, setCommercants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/stats', {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('stamply_admin_token') }
    }).then(r => r.json()).then(d => setStats(d.data)).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (statutFilter) params.set('statut', statutFilter);

    fetch(`/api/admin/commercants?${params}`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('stamply_admin_token') }
    }).then(r => r.json()).then(d => {
      setCommercants(d.data.commerçants);
      setTotalPages(d.data.totalPages);
    }).catch(console.error).finally(() => setLoading(false));
  }, [page, search, statutFilter]);

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

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 p-4 flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={statutFilter}
            onChange={e => { setStatutFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="past_due">Impayé</option>
            <option value="suspendu">Suspendu</option>
          </select>
        </div>

        {/* Commerçants table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Chargement...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="px-6 py-3">Commerçant</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Inscrit le</th>
                  <th className="px-6 py-3">Abonnement</th>
                  <th className="px-6 py-3">Stripe</th>
                  <th className="px-6 py-3">Wallet</th>
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
                    <td className="px-6 py-4">{getStatutBadge(c.abonnement_statut)}</td>
                    <td className="px-6 py-4">
                      {c.stripe_customer_id ? (
                        <span className="text-xs text-green-600 font-medium">✓ Connecté</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {c.wallet_class_configured ? (
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">Configuré</span>
                      ) : (
                        <span className="text-xs text-gray-400">Non configuré</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/admin?page=commercant&id=${c.id}`)}
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

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: number; icon: any; color: string; sub?: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

// ─── Commercant Detail Page ────────────────────────────────────────────────────

function AdminCommercantPage({ commercantId }: { commercantId: string }) {
  const [commercant, setCommercant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetPw, setResetPw] = useState('');
  const router = useRouter();

  const refresh = async () => {
    const r = await fetch(`/api/admin/commercants/${commercantId}`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('stamply_admin_token') }
    });
    const d = await r.json();
    setCommercant(d.data);
  };

  useEffect(() => {
    refresh().catch(err => setMessage(err.message)).finally(() => setLoading(false));
  }, [commercantId]);

  const handleAction = async (action: string) => {
    try {
      setMessage('');
      const res = await fetch(`/api/admin/commercants/${commercantId}/${action}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('stamply_admin_token') }
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message || 'Action réussie.');
        await refresh();
      } else {
        setMessage(data.error || 'Erreur.');
      }
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
        <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>

        {message && <div className="mb-4 px-4 py-3 rounded-lg bg-indigo-50 text-indigo-700 text-sm">{message}</div>}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{commercant.nom_enseigne}</h1>
              <p className="text-gray-500 mt-1">{commercant.email}</p>
              {commercant.telephone && <p className="text-sm text-gray-400 mt-1">📞 {commercant.telephone}</p>}
            </div>
            <div className="flex items-center gap-2">
              {getStatutBadge(commercant.abonnement_statut)}
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
            {commercant.abonnement_statut === 'actif' ? (
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
            <button onClick={() => {
              if (!confirm('Supprimer définitivement ce commerçant ?')) return;
              fetch(`/api/admin/commercants/${commercantId}`, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + localStorage.getItem('stamply_admin_token') }
              }).then(r => r.json()).then(d => {
                if (d.success) router.push('/admin');
                else setMessage(d.error);
              });
            }} className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
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
              <button onClick={() => handleAction('reset-password')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
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
            <div><dt className="text-gray-500">Wallet configuré</dt><dd className="text-gray-700">{commercant.wallet_class_configured ? 'Oui' : 'Non'}</dd></div>
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
    fetch(`/api/admin/feedbacks?page=${page}`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('stamply_admin_token') }
    }).then(r => r.json()).then(d => setFeedbacks(d.data.feedbacks)).catch(console.error).finally(() => setLoading(false));
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

  useEffect(() => {
    fetch('/api/admin/logs', {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('stamply_admin_token') }
    }).then(r => r.json()).then(d => setLogs(d.data.logs)).catch(console.error).finally(() => setLoading(false));
  }, []);

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
                  <th className="px-6 py-3">Target</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{l.action}</td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-500">{l.target_id?.slice(0, 8)}...</td>
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

// ═══════════════════════════════════════════════════════════════════════════════
// NEW PAGES — V2 Admin Panel
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Status Page ───────────────────────────────────────────────────────────────

function AdminStatusPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.status()
      .then(setStatus)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'ok': return 'bg-green-50 border-green-200 text-green-700';
      case 'not_configured': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'error': return 'bg-red-50 border-red-200 text-red-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'ok': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'not_configured': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const services = [
    { key: 'google_wallet', label: 'Google Wallet' },
    { key: 'fcm', label: 'FCM' },
    { key: 'stripe', label: 'Stripe' },
    { key: 'apple_wallet', label: 'Apple Wallet' },
    { key: 'supabase', label: 'Supabase' },
    { key: 'backend', label: 'Backend' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>Admin — Santé des services</title></Head>
      <AdminNav active="status" />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Santé des services</h1>
          <button
            onClick={() => { setLoading(true); adminApi.status().then(setStatus).catch(err => setError(err.message)).finally(() => setLoading(false)); }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {error && <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-6 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : status ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(svc => {
              const svcData = status[svc.key];
              if (!svcData) return null;
              const isBackend = svc.key === 'backend';
              const uptimeHours = svcData.uptime ? Math.round(svcData.uptime / 3600) : null;
              return (
                <div key={svc.key} className={`rounded-xl border p-6 ${getStatusColor(svcData.status)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{svc.label}</h3>
                    {getStatusIcon(svcData.status)}
                  </div>
                  <p className="text-sm capitalize font-medium">{svcData.status.replace('_', ' ')}</p>
                  <p className="text-xs mt-2 opacity-80">{svcData.message}</p>
                  {isBackend && uptimeHours !== null && (
                    <p className="text-xs mt-2 font-medium">Uptime: {uptimeHours}h</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-12">Aucun statut disponible</div>
        )}
      </div>
    </div>
  );
}

// ─── Clients Page ──────────────────────────────────────────────────────────────

function AdminClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [commercantFilter, setCommercantFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    adminApi.listClients({ page, limit: 20, search, commercant_id: commercantFilter || undefined })
      .then(d => {
        setClients(d.clients);
        setTotalPages(d.totalPages);
        setTotal(d.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, commercantFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>Admin — Clients</title></Head>
      <AdminNav active="clients" />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Liste des clients <span className="text-gray-400 text-lg font-normal">({total})</span></h1>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 p-4 flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou N° carte..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <input
            type="text"
            placeholder="Filtrer par commerçant ID..."
            value={commercantFilter}
            onChange={e => { setCommercantFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Chargement...</div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Aucun client trouvé</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Commerçant</th>
                  <th className="px-6 py-3">Boutique</th>
                  <th className="px-6 py-3">N° Carte</th>
                  <th className="px-6 py-3">Points</th>
                  <th className="px-6 py-3">Inscrit le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{c.client_nom || '—'}</div>
                      <div className="text-xs text-gray-500">{c.client_email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.commercant_nom || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.boutique_nom || '—'}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500">{c.numero_carte || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        {c.solde_points || 0} pts
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">Page {page} sur {totalPages} ({total} clients)</span>
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

// ─── Scans Page ────────────────────────────────────────────────────────────────

function AdminScansPage() {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [today, setToday] = useState(0);
  const [orphelins, setOrphelins] = useState(0);

  useEffect(() => {
    setLoading(true);
    adminApi.listScans({ page, limit: 20 })
      .then(d => {
        setScans(d.scans);
        setTotalPages(d.totalPages);
        setTotal(d.total);
        setToday(d.scans_today);
        setOrphelins(d.scans_orphelins);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>Admin — Scans</title></Head>
      <AdminNav active="scans" />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Historique des scans</h1>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard label="Total scans" value={total} icon={ScanLine} color="indigo" />
          <StatCard label="Aujourd'hui" value={today} icon={TrendingUp} color="green" />
          <StatCard label="Orphelins" value={orphelins} icon={AlertTriangle} color="red" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Chargement...</div>
          ) : scans.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Aucun scan enregistré</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Boutique</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scans.map(s => {
                  const isOrphelin = !s.client_id;
                  return (
                    <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${isOrphelin ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-medium ${isOrphelin ? 'text-red-700' : 'text-gray-900'}`}>
                          {s.clients?.nom || '—'}
                        </div>
                        <div className="text-xs text-gray-500">{s.clients?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{s.boutiques?.nom || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {s.type_action || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(s.created_at).toLocaleString('fr-FR')}</td>
                    </tr>
                  );
                })}
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

// ─── Notifications Page ────────────────────────────────────────────────────────

function AdminNotificationsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    adminApi.notificationsStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePushTest = () => {
    const commercantId = prompt('ID du commerçant pour le test :');
    if (!commercantId) return;
    setSending(true);
    setMessage('');
    adminApi.pushTest(commercantId)
      .then(d => {
        setMessage(`Push envoyé avec succès (mode: ${d.mode})`);
      })
      .catch(err => setMessage(`Erreur: ${err.message}`))
      .finally(() => setSending(false));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>Admin — Notifications</title></Head>
      <AdminNav active="notifications" />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Statistiques Push</h1>
          <button
            onClick={handlePushTest}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Envoyer push test
          </button>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.startsWith('Erreur') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <StatCard label="Total" value={stats.total} icon={Bell} color="indigo" />
              <StatCard label="Aujourd'hui" value={stats.today} icon={TrendingUp} color="green" />
              <StatCard label="Push réels" value={stats.push_reels} icon={CheckCircle} color="blue" />
              <StatCard label="Simulation" value={stats.simulation} icon={AlertTriangle} color="amber" />
              <StatCard label="Mode" value={stats.mode} icon={Shield} color="purple" />
            </div>

            {/* Dernières notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 px-6 py-4 border-b border-gray-100">Dernières notifications</h2>
              {stats.recentes && stats.recentes.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      <th className="px-6 py-3">Titre</th>
                      <th className="px-6 py-3">Commerçant</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.recentes.map((n: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{n.titre || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{n.commercant_nom || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${n.mode === 'simulation' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                            {n.mode || 'réel'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(n.created_at).toLocaleString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-gray-400">Aucune notification récente</div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 py-12">Aucune statistique disponible</div>
        )}
      </div>
    </div>
  );
}

// ─── Templates Page ────────────────────────────────────────────────────────────

function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.listTemplates()
      .then(d => setTemplates(d.templates))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>Admin — Templates d'avis</title></Head>
      <AdminNav active="templates" />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Templates d'avis</h1>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-20" />
                  <div className="h-6 bg-gray-200 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-400">
            Aucun template configuré
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map(t => (
              <div key={t.commercant_id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">{t.commercant_nom}</h3>
                <div className="flex flex-wrap gap-2">
                  {t.templates && t.templates.length > 0 ? (
                    t.templates.map((tmpl: any, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                      >
                        {tmpl.nom || tmpl.type || `Template ${i + 1}`}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">Aucun template</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Offres Page ───────────────────────────────────────────────────────────────

function AdminOffresPage() {
  const [offres, setOffres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    titre: '',
    description: '',
    type_recompense: 'points',
    valeur: 10,
    date_fin: '',
    commercant_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadOffres = () => {
    setLoading(true);
    adminApi.listOffres({ page, limit: 20, statut: filter || undefined })
      .then(d => {
        setOffres(d.offres);
        setTotalPages(d.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOffres();
  }, [page, filter]);

  const handleCreate = async () => {
    if (!form.titre || !form.commercant_id) {
      setMessage('Le titre et le commerçant sont requis.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await adminApi.createOffre(form);
      setShowModal(false);
      setForm({ titre: '', description: '', type_recompense: 'points', valeur: 10, date_fin: '', commercant_id: '' });
      setMessage('Offre créée avec succès.');
      loadOffres();
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette offre ?')) return;
    try {
      await adminApi.deleteOffre(id);
      setMessage('Offre supprimée.');
      loadOffres();
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>Admin — Offres</title></Head>
      <AdminNav active="offres" />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des offres</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Tag className="h-4 w-4" />
            Créer une offre
          </button>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.includes('Erreur') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 p-4 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filtre:</span>
          <select
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Toutes</option>
            <option value="actives">Actives</option>
            <option value="expirees">Expirées</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Chargement...</div>
          ) : offres.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Aucune offre trouvée</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="px-6 py-3">Titre</th>
                  <th className="px-6 py-3">Commerçant</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Valeur</th>
                  <th className="px-6 py-3">Période</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {offres.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{o.titre}</div>
                      {o.description && <div className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{o.description}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{o.commercants?.nom_enseigne || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                        {o.type_recompense || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{o.valeur}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(o.date_debut).toLocaleDateString('fr-FR')} → {o.date_fin ? new Date(o.date_fin).toLocaleDateString('fr-FR') : '∞'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(o.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                      >
                        Supprimer
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

      {/* Modal Créer une offre */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Créer une offre</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={form.titre}
                  onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Double points week-end"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  placeholder="Description de l'offre..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type récompense</label>
                  <select
                    value={form.type_recompense}
                    onChange={e => setForm(f => ({ ...f, type_recompense: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="points">Points</option>
                    <option value="remise">Remise</option>
                    <option value="cadeau">Cadeau</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valeur</label>
                  <input
                    type="number"
                    value={form.valeur}
                    onChange={e => setForm(f => ({ ...f, valeur: Number(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                <input
                  type="date"
                  value={form.date_fin}
                  onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Commerçant *</label>
                <input
                  type="text"
                  value={form.commercant_id}
                  onChange={e => setForm(f => ({ ...f, commercant_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="uuid du commerçant"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
