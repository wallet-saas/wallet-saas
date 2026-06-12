import { useEffect, useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { boutiquesApi, type Boutique } from '@/services/api';
import { commercantApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { Store, Plus, Edit3, Trash2, Star, Settings, Info, Check } from 'lucide-react';

export default function BoutiquesPage() {
  const { commercant, refreshUser } = useAuth();
  const { show: toast } = useToast();
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Boutique | null>(null);
  const [form, setForm] = useState({
    nom: '', adresse: '', ville: '', code_postal: '', telephone: '',
    google_place_url: '', carte_couleur_primaire: '#6366f1', carte_couleur_secondaire: '#764ba2',
    carte_programme_nom: '', points_recompense: 10, module_avis_google: true, delai_notif_avis_minutes: 60,
  });
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'list' | 'settings'>('list');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [savingDefault, setSavingDefault] = useState(false);

  useEffect(() => { loadBoutiques(); }, []);

  const loadBoutiques = async () => {
    try {
      const res = await boutiquesApi.list();
      setBoutiques(res.data || []);
      const statsMap: Record<string, any> = {};
      for (const b of (res.data || [])) {
        try { const s = await boutiquesApi.stats(b.id); statsMap[b.id] = s; }
        catch { statsMap[b.id] = null; }
      }
      setStats(statsMap);
    } catch (e) { console.error('Erreur chargement boutiques:', e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim()) { toast('Le nom de la boutique est requis', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        await boutiquesApi.update(editing.id, form);
      } else {
        await boutiquesApi.create(form);
      }
      setShowForm(false); setEditing(null); resetForm(); await loadBoutiques();
    } catch (err: any) { toast(err.message || 'Erreur', 'error'); }
    finally { setSaving(false); }
  };

  const handleEdit = (b: Boutique) => {
    setEditing(b);
    setForm({
      nom: b.nom, adresse: b.adresse || '', ville: b.ville || '', code_postal: b.code_postal || '',
      telephone: b.telephone || '', google_place_url: b.google_place_url || '',
      carte_couleur_primaire: b.carte_couleur_primaire, carte_couleur_secondaire: b.carte_couleur_secondaire,
      carte_programme_nom: b.carte_programme_nom || '', points_recompense: b.points_recompense,
      module_avis_google: b.module_avis_google, delai_notif_avis_minutes: b.delai_notif_avis_minutes,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Désactiver cette boutique ?')) return;
    setDeleting(id);
    try { await boutiquesApi.delete(id); await loadBoutiques(); }
    catch (err: any) { toast(err.message || 'Erreur', 'error'); }
    finally { setDeleting(null); }
  };

  const handleSetDefault = async (id: string) => {
    setSavingDefault(true);
    try {
      await commercantApi.update({ boutique_defaut_id: id });
      await refreshUser();
      toast('Boutique principale mise à jour');
    } catch (err: any) { toast(err.message || 'Erreur', 'error'); }
    finally { setSavingDefault(false); }
  };

  const resetForm = () => {
    setForm({
      nom: '', adresse: '', ville: '', code_postal: '', telephone: '',
      google_place_url: '', carte_couleur_primaire: '#6366f1', carte_couleur_secondaire: '#764ba2',
      carte_programme_nom: '', points_recompense: 10, module_avis_google: true, delai_notif_avis_minutes: 60,
    });
  };

  if (loading) return <DashboardLayout><PageSpinner /></DashboardLayout>;

  const defautId = commercant?.boutique_defaut_id;

  return (
    <DashboardLayout>
      <Head><title>Mes boutiques — Stamply</title></Head>

      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Mes boutiques</h1>
            <p className="page-subtitle">{boutiques.length} boutique{boutiques.length !== 1 ? 's' : ''} — 1 gratuite, illimitées en Pro</p>
          </div>
          <Button onClick={() => { setShowForm(true); setEditing(null); resetForm(); }}>
            <Plus className="h-4 w-4" /> Ajouter une boutique
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {([
          { id: 'list', label: 'Mes boutiques', icon: Store },
          { id: 'settings', label: 'Paramètres', icon: Settings },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'list' && (
        boutiques.length === 0 ? (
          <Card><CardBody className="py-12 text-center">
            <Store className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Aucune boutique configurée</p>
            <Button onClick={() => { setShowForm(true); resetForm(); }}><Plus className="h-4 w-4" /> Ajouter ma première boutique</Button>
          </CardBody></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boutiques.map((b) => {
              const s = stats[b.id];
              const isDefault = defautId === b.id;
              return (
                <Card key={b.id} className={isDefault ? 'ring-2 ring-indigo-200' : ''}>
                  <CardBody>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: b.carte_couleur_primaire }}>
                          {b.nom.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{b.nom}</p>
                            {isDefault && <span className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full font-medium">Principale</span>}
                          </div>
                          {b.ville && <p className="text-xs text-gray-400">{b.ville}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {!isDefault && (
                          <button onClick={() => handleSetDefault(b.id)} className="p-1.5 rounded-lg hover:bg-yellow-50" title="Définir comme principale">
                            <Star className="h-4 w-4 text-yellow-400" />
                          </button>
                        )}
                        <button onClick={() => handleEdit(b)} className="p-1.5 rounded-lg hover:bg-gray-100"><Edit3 className="h-4 w-4 text-gray-400" /></button>
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg hover:bg-red-50" disabled={deleting === b.id}><Trash2 className="h-4 w-4 text-red-400" /></button>
                      </div>
                    </div>
                    {s && (
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        {[{ v: s.totalCartes, l: 'Cartes' }, { v: s.totalVisites, l: 'Visites' }, { v: s.totalAvis, l: 'Avis' }, { v: s.totalOffres, l: 'Offres' }].map(x => (
                          <div key={x.l} className="text-center bg-gray-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-gray-900">{x.v}</p>
                            <p className="text-xs text-gray-400">{x.l}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Freemium</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-start justify-between p-3 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">Plan actuel</p>
                  <p className="text-xs text-gray-500 mt-0.5">1 boutique gratuite • Boutiques illimitées en Pro</p>
                </div>
                <span className="bg-green-50 text-green-600 text-xs px-2 py-0.5 rounded-full font-medium">Gratuit</span>
              </div>
              {/* TODO: quand Stripe sera branché, afficher le bouton "Passer en Pro" ici */}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Boutique principale</CardTitle></CardHeader>
            <CardBody>
              {defautId ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                  <Star className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-indigo-900">
                      {boutiques.find(b => b.id === defautId)?.nom || 'Boutique principale'}
                    </p>
                    <p className="text-xs text-indigo-600">Utilisée par défaut pour les nouvelles cartes</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <Info className="h-5 w-5 text-gray-400" />
                  <p className="text-sm text-gray-500">Aucune boutique principale définie — cliquez sur l'étoile d'une boutique pour la définir</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Modifier la boutique' : 'Nouvelle boutique'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nom de la boutique *" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
              <Input label="Adresse" value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Ville" value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} />
                <Input label="Code postal" value={form.code_postal} onChange={e => setForm({ ...form, code_postal: e.target.value })} />
              </div>
              <Input label="Téléphone" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
              <Input label="URL Google Place" placeholder="https://g.page/..." value={form.google_place_url} onChange={e => setForm({ ...form, google_place_url: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Couleur primaire</label><input type="color" value={form.carte_couleur_primaire} onChange={e => setForm({ ...form, carte_couleur_primaire: e.target.value })} className="h-9 w-full rounded-lg border border-gray-200 cursor-pointer" /></div>
                <div><label className="label">Couleur secondaire</label><input type="color" value={form.carte_couleur_secondaire} onChange={e => setForm({ ...form, carte_couleur_secondaire: e.target.value })} className="h-9 w-full rounded-lg border border-gray-200 cursor-pointer" /></div>
              </div>
              <Input label="Nom du programme" value={form.carte_programme_nom} onChange={e => setForm({ ...form, carte_programme_nom: e.target.value })} />
              <Input label="Points récompense" type="number" value={form.points_recompense} onChange={e => setForm({ ...form, points_recompense: Number(e.target.value) })} />
              <div className="flex items-center gap-3">
                <input type="checkbox" id="module_avis" checked={form.module_avis_google} onChange={e => setForm({ ...form, module_avis_google: e.target.checked })} className="rounded" />
                <label htmlFor="module_avis" className="text-sm font-medium text-gray-700">Activer les avis Google automatiques</label>
              </div>
              <div className="flex gap-3">
                <Button type="submit" loading={saving}>{editing ? 'Enregistrer' : 'Créer'}</Button>
                <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Annuler</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
