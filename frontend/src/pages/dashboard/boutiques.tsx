import { useEffect, useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { boutiquesApi, type Boutique } from '@/services/api';
import { Store, Plus, Edit3, Trash2, BarChart3, MapPin, Star, MessageSquare } from 'lucide-react';

export default function BoutiquesPage() {
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Boutique | null>(null);
  const [form, setForm] = useState({
    nom: '', adresse: '', ville: '', code_postal: '', telephone: '', email: '',
    google_place_url: '', carte_couleur_primaire: '#6366f1', carte_couleur_secondaire: '#764ba2',
    carte_programme_nom: '', points_recompense: 10, module_avis_google: true, delai_notif_avis_minutes: 60,
  });
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<Record<string, any>>({});

  useEffect(() => { loadBoutiques(); }, []);

  const loadBoutiques = async () => {
    try {
      const res = await boutiquesApi.list();
      setBoutiques(res.data || []);
      // Load stats for each boutique
      const statsMap: Record<string, any> = {};
      for (const b of (res.data || [])) {
        try {
          const s = await boutiquesApi.stats(b.id);
          statsMap[b.id] = s;
        } catch { statsMap[b.id] = null; }
      }
      setStats(statsMap);
    } catch (e) {
      console.error('Erreur chargement boutiques:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await boutiquesApi.update(editing.id, form);
      } else {
        await boutiquesApi.create(form);
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      await loadBoutiques();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (b: Boutique) => {
    setEditing(b);
    setForm({
      nom: b.nom, adresse: b.adresse || '', ville: b.ville || '', code_postal: b.code_postal || '',
      telephone: b.telephone || '', email: b.email || '', google_place_url: b.google_place_url || '',
      carte_couleur_primaire: b.carte_couleur_primaire, carte_couleur_secondaire: b.carte_couleur_secondaire,
      carte_programme_nom: b.carte_programme_nom || '', points_recompense: b.points_recompense,
      module_avis_google: b.module_avis_google, delai_notif_avis_minutes: b.delai_notif_avis_minutes,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Désactiver cette boutique ?')) return;
    try {
      await boutiquesApi.delete(id);
      await loadBoutiques();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    }
  };

  const resetForm = () => {
    setForm({
      nom: '', adresse: '', ville: '', code_postal: '', telephone: '', email: '',
      google_place_url: '', carte_couleur_primaire: '#6366f1', carte_couleur_secondaire: '#764ba2',
      carte_programme_nom: '', points_recompense: 10, module_avis_google: true, delai_notif_avis_minutes: 60,
    });
  };

  if (loading) return <DashboardLayout><PageSpinner /></DashboardLayout>;

  return (
    <DashboardLayout>
      <Head><title>Mes boutiques — Stamply</title></Head>

      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Mes boutiques</h1>
            <p className="page-subtitle">Gérez vos différents points de vente</p>
          </div>
          <Button onClick={() => { setShowForm(true); setEditing(null); resetForm(); }}>
            <Plus className="h-4 w-4" /> Ajouter une boutique
          </Button>
        </div>
      </div>

      {/* Form modal */}
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
              <div className="grid grid-cols-2 gap-3">
                <Input label="Téléphone" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
                <Input label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <Input label="URL Google Place" placeholder="https://g.page/..." value={form.google_place_url} onChange={e => setForm({ ...form, google_place_url: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Couleur primaire</label>
                  <input type="color" value={form.carte_couleur_primaire} onChange={e => setForm({ ...form, carte_couleur_primaire: e.target.value })} className="h-9 w-full rounded-lg border border-gray-200 cursor-pointer" />
                </div>
                <div>
                  <label className="label">Couleur secondaire</label>
                  <input type="color" value={form.carte_couleur_secondaire} onChange={e => setForm({ ...form, carte_couleur_secondaire: e.target.value })} className="h-9 w-full rounded-lg border border-gray-200 cursor-pointer" />
                </div>
              </div>
              <Input label="Nom du programme" value={form.carte_programme_nom} onChange={e => setForm({ ...form, carte_programme_nom: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Points récompense" type="number" value={form.points_recompense} onChange={e => setForm({ ...form, points_recompense: Number(e.target.value) })} />
                <Input label="Délai avis (min)" type="number" value={form.delai_notif_avis_minutes} onChange={e => setForm({ ...form, delai_notif_avis_minutes: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="module_avis" checked={form.module_avis_google} onChange={e => setForm({ ...form, module_avis_google: e.target.checked })} className="rounded" />
                <label htmlFor="module_avis" className="text-sm font-medium text-gray-700">Activer les avis Google automatiques</label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={saving}>{editing ? 'Enregistrer' : 'Créer'}</Button>
                <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Annuler</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Boutiques list */}
      {boutiques.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <Store className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Aucune boutique configurée</p>
            <Button onClick={() => { setShowForm(true); resetForm(); }}>
              <Plus className="h-4 w-4" /> Ajouter ma première boutique
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {boutiques.map((b) => {
            const s = stats[b.id];
            return (
              <Card key={b.id}>
                <CardBody>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: b.carte_couleur_primaire }}>
                        {b.nom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{b.nom}</p>
                        {b.ville && <p className="text-xs text-gray-400">{b.ville}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(b)} className="p-1.5 rounded-lg hover:bg-gray-100"><Edit3 className="h-4 w-4 text-gray-400" /></button>
                      <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="h-4 w-4 text-red-400" /></button>
                    </div>
                  </div>
                  {s && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      <div className="text-center bg-gray-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-gray-900">{s.totalCartes}</p>
                        <p className="text-xs text-gray-400">Cartes</p>
                      </div>
                      <div className="text-center bg-gray-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-gray-900">{s.totalVisites}</p>
                        <p className="text-xs text-gray-400">Visites</p>
                      </div>
                      <div className="text-center bg-gray-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-gray-900">{s.totalAvis}</p>
                        <p className="text-xs text-gray-400">Avis</p>
                      </div>
                      <div className="text-center bg-gray-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-gray-900">{s.totalOffres}</p>
                        <p className="text-xs text-gray-400">Offres</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                    {b.module_avis_google && <span className="flex items-center gap-1"><Star className="h-3 w-3" /> Avis auto</span>}
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {b.points_recompense} pts</span>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
