import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toggle } from '@/components/ui/Toggle';
import { PageSpinner } from '@/components/ui/Spinner';
import { menusApi, type Menu, type MenuGroupe } from '@/services/api';
import { commercantApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { useAutoSave, SaveIndicator } from '@/hooks/useAutoSave';
import { formatEuro } from '@/utils/format';
import { Plus, Pencil, Trash2, UtensilsCrossed, ChevronDown, ChevronRight, Settings, Bell, Check, Layers, FolderPlus, X, CheckSquare, Square } from 'lucide-react';

const schema = z.object({
  titre: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  prix: z.string().optional().transform(v => v ? parseFloat(v) : undefined),
  categorie: z.string().optional(),
  image_url: z.string().url('URL invalide').optional().or(z.literal('')),
  disponible: z.boolean().default(true),
  menu_du_jour: z.boolean().default(false),
});
type FormData = z.infer<typeof schema>;

const defaultCategories = ['Entrées', 'Plats', 'Desserts', 'Boissons', 'Snacks'];

// ── Composant GroupeCard ──────────────────────────────────────────────────────
function GroupeCard({ groupe, menus, onPush, onDelete, pushing }: {
  groupe: MenuGroupe;
  menus: Menu[];
  onPush: (g: MenuGroupe) => void;
  onDelete: (id: string) => void;
  pushing: boolean;
}) {
  const [open, setOpen] = useState(false);
  const platsDuGroupe = menus.filter(m => groupe.menu_ids.includes(m.id));
  return (
    <Card>
      <button className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-indigo-500" />
          <span className="font-semibold text-gray-900">{groupe.nom}</span>
          <Badge variant="purple">{platsDuGroupe.length} plat{platsDuGroupe.length !== 1 ? 's' : ''}</Badge>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
      </button>
      {open && (
        <div className="border-t border-gray-100 px-6 py-3 space-y-2">
          {platsDuGroupe.length === 0 && <p className="text-xs text-gray-400 py-2">Aucun plat dans ce groupe</p>}
          {platsDuGroupe.map(m => (
            <div key={m.id} className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">• {m.titre}</span>
              {m.prix && <span className="text-gray-400 font-medium">{m.prix}€</span>}
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={() => onPush(groupe)} disabled={pushing || platsDuGroupe.length === 0}>
              <Bell className="h-3.5 w-3.5" /> Pousser ce menu
            </Button>
            <Button size="sm" variant="danger" onClick={() => onDelete(groupe.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function MenusPage() {
  const { commercant, refreshUser } = useAuth();
  const { show: toast } = useToast();
  const [parCategorie, setParCategorie] = useState<Record<string, Menu[]>>({});
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<{ open: boolean; menu?: Menu }>({ open: false });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'groupes' | 'settings'>('menu');
  const [pushingMenu, setPushingMenu] = useState(false);
  const [pushResult, setPushResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Sélection multi-plats
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Groupes
  const [groupes, setGroupes] = useState<MenuGroupe[]>([]);
  const [showGroupeForm, setShowGroupeForm] = useState(false);
  const [groupeNom, setGroupeNom] = useState('');

  const [categories, setCategories] = useState('Entrées,Plats,Desserts,Boissons');
  const [devise, setDevise] = useState('EUR');
  const [afficherPrix, setAfficherPrix] = useState(true);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { disponible: true },
  });

  useEffect(() => {
    if (commercant) {
      const catsRaw = commercant.menu_categories;
      if (typeof catsRaw === 'string') {
        try { setCategories(JSON.parse(catsRaw).join(',')); } catch { setCategories(catsRaw); }
      } else if (Array.isArray(catsRaw)) {
        setCategories(catsRaw.join(','));
      }
      setDevise(commercant.menu_devise ?? 'EUR');
      setAfficherPrix(commercant.menu_afficher_prix ?? true);
    }
  }, [commercant]);

  const handleAutoSaveSettings = useCallback(async () => {
    await commercantApi.update({
      menu_categories: JSON.stringify(categories.split(',').map(c => c.trim()).filter(Boolean)),
      menu_devise: devise,
      menu_afficher_prix: afficherPrix,
    });
  }, [categories, devise, afficherPrix]);

  const { status: saveStatusSettings } = useAutoSave({
    data: { categories, devise, afficherPrix },
    onSave: handleAutoSaveSettings,
    debounceMs: 800,
  });

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const data = await menusApi.list();
      setParCategorie(data.parCategorie || {});
    } catch {}
    finally { setLoading(false); }
  };

  const fetchGroupes = async () => {
    try {
      const data = await menusApi.listGroupes();
      setGroupes(data.groupes || []);
    } catch {}
  };

  useEffect(() => { fetchMenus(); fetchGroupes(); }, []);

  const openCreate = () => { reset({ disponible: true, menu_du_jour: false }); setModal({ open: true }); };
  const openEdit = (menu: Menu) => {
    reset({ titre: menu.titre, description: menu.description || '', prix: (menu.prix?.toString() || '') as unknown as number, categorie: menu.categorie || '', image_url: menu.image_url || '', disponible: menu.disponible, menu_du_jour: !!(menu as any).menu_du_jour });
    setModal({ open: true, menu });
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (modal.menu) {
        await menusApi.update(modal.menu.id, data as any);
      } else {
        await menusApi.create({ ...data, disponible: data.disponible ?? true } as any);
      }
      setModal({ open: false });
      fetchMenus();
    } catch (e: any) { toast(e?.message || 'Erreur', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce plat ?')) return;
    setDeleting(id);
    try { await menusApi.delete(id); fetchMenus(); }
    catch (e: any) { toast(e?.message || 'Erreur', 'error'); }
    finally { setDeleting(null); }
  };

  const handleToggle = async (menu: Menu) => {
    try { await menusApi.toggle(menu.id); fetchMenus(); }
    catch (e: any) { toast(e?.message || 'Erreur', 'error'); }
  };

  // ── Sélection multi-plats ───────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    const allVisible = Object.values(parCategorie).flat().filter(m => m.disponible).map(m => m.id);
    setSelectedIds(new Set(allVisible));
  };

  const clearSelection = () => setSelectedIds(new Set());

  // ── Push notifications ──────────────────────────────────────────────────────
  const handlePushSelection = async () => {
    if (selectedIds.size === 0) { toast('Sélectionnez au moins un plat', 'error'); return; }
    setPushingMenu(true);
    setPushResult(null);
    try {
      const res = await menusApi.pushSelection(Array.from(selectedIds));
      setPushResult({ success: true, message: res.message || res.data?.message });
      clearSelection();
    } catch (e: any) {
      setPushResult({ success: false, message: e?.message || 'Erreur' });
    } finally { setPushingMenu(false); }
  };

  const handlePushGroupe = async (groupe: MenuGroupe) => {
    if (groupe.menu_ids.length === 0) { toast('Ce groupe est vide', 'error'); return; }
    setPushingMenu(true);
    setPushResult(null);
    try {
      const res = await menusApi.pushSelection(groupe.menu_ids, groupe.id);
      setPushResult({ success: true, message: res.message });
    } catch (e: any) {
      setPushResult({ success: false, message: e?.message || 'Erreur' });
    } finally { setPushingMenu(false); }
  };

  // ── Groupes CRUD ──────────────────────────────────────────────────────────
  const handleCreateGroupe = async () => {
    if (!groupeNom.trim()) { toast('Nom du groupe requis', 'error'); return; }
    const newGroupe: MenuGroupe = {
      id: 'grp-' + Date.now(),
      nom: groupeNom.trim(),
      menu_ids: [],
    };
    const newGroupes = [...groupes, newGroupe];
    setGroupes(newGroupes);
    try {
      await menusApi.saveGroupes(newGroupes);
      setGroupeNom('');
      setShowGroupeForm(false);
      toast('Groupe créé');
    } catch (e: any) {
      toast(e?.message || 'Erreur', 'error');
      fetchGroupes();
    }
  };

  const handleDeleteGroupe = async (id: string) => {
    if (!confirm('Supprimer ce groupe ?')) return;
    const newGroupes = groupes.filter(g => g.id !== id);
    setGroupes(newGroupes);
    try { await menusApi.saveGroupes(newGroupes); }
    catch (e: any) { toast(e?.message || 'Erreur', 'error'); fetchGroupes(); }
  };

  const handleToggleGroupeMenu = async (groupeIndex: number, menuId: string) => {
    const newGroupes = [...groupes];
    const g = { ...newGroupes[groupeIndex] };
    if (g.menu_ids.includes(menuId)) {
      g.menu_ids = g.menu_ids.filter(id => id !== menuId);
    } else {
      g.menu_ids = [...g.menu_ids, menuId];
    }
    newGroupes[groupeIndex] = g;
    setGroupes(newGroupes);
    try { await menusApi.saveGroupes(newGroupes); }
    catch (e: any) { toast(e?.message || 'Erreur', 'error'); fetchGroupes(); }
  };

  // ── Données dérivées ──────────────────────────────────────────────────────
  const allMenus = Object.values(parCategorie).flat();
  const allAvailable = allMenus.filter(m => m.disponible);
  const selectedCount = selectedIds.size;
  const deviseSymbol = devise === 'USD' ? '$' : devise === 'CHF' ? 'CHF' : '€';

  return (
    <DashboardLayout>
      <Head><title>Menus — Stamply</title></Head>

      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Menu du Jour</h1>
            <p className="page-subtitle">{allMenus.length} plat{allMenus.length !== 1 ? 's' : ''} au total</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Ajouter un plat
            </Button>
          </div>
        </div>
      </div>

      {/* Barre de sélection multi-plats */}
      {allMenus.length > 0 && (
        <div className={`flex items-center gap-4 px-5 py-3 rounded-xl border mb-4 ${selectedCount > 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100'}`}>
          <UtensilsCrossed className={`h-5 w-5 ${selectedCount > 0 ? 'text-indigo-600' : 'text-gray-400'}`} />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {selectedCount === 0
                ? 'Cochez les plats à pousser en notification'
                : `${selectedCount} plat${selectedCount !== 1 ? 's' : ''} sélectionné${selectedCount !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {selectedCount > 0 && (
              <>
                <Button onClick={handlePushSelection} disabled={pushingMenu} variant="primary" size="sm">
                  <Bell className="h-4 w-4" /> Notifier mes clients
                </Button>
                <Button onClick={clearSelection} variant="ghost" size="sm">
                  <X className="h-4 w-4" /> Annuler
                </Button>
              </>
            )}
            {selectedCount === 0 && (
              <>
                <Button onClick={selectAllVisible} variant="ghost" size="sm">
                  <CheckSquare className="h-4 w-4" /> Tout sélectionner
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {pushResult && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-4 ${pushResult.success ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
          {pushResult.success ? <Check className="h-4 w-4 text-green-600" /> : <Bell className="h-4 w-4 text-red-500" />}
          <p className={`text-sm ${pushResult.success ? 'text-green-700' : 'text-red-600'}`}>{pushResult.message}</p>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {([
          { id: 'menu' as const, label: 'Mes plats', icon: UtensilsCrossed, count: allMenus.length },
          { id: 'groupes' as const, label: 'Menus groupés', icon: Layers, count: groupes.length },
          { id: 'settings' as const, label: 'Paramètres', icon: Settings },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
            {'count' in tab && (tab as any).count > 0 && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{(tab as any).count}</span>}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : (
        <>
          {/* ── ONGLET PLATS ──────────────────────────────────────────────────── */}
          {activeTab === 'menu' && (
            allMenus.length === 0 ? (
              <Card>
                <CardBody>
                  <div className="py-12 text-center">
                    <UtensilsCrossed className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 mb-4">Aucun plat configuré</p>
                    <Button onClick={openCreate}><Plus className="h-4 w-4" /> Ajouter le premier plat</Button>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-4">
                {Object.entries(parCategorie).map(([categorie, items]) => (
                  <Card key={categorie}>
                    <button className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors" onClick={() => setCollapsed(p => ({ ...p, [categorie]: !p[categorie] }))}>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">{categorie || 'Sans catégorie'}</span>
                        <Badge variant="gray">{items.length}</Badge>
                      </div>
                      {collapsed[categorie] ? <ChevronRight className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </button>
                    {!collapsed[categorie] && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {items.map(menu => (
                          <div key={menu.id} className={`flex items-center gap-4 px-6 py-4 ${selectedIds.has(menu.id) ? 'bg-indigo-50/50' : ''}`}>
                            {/* Checkbox */}
                            <button onClick={() => toggleSelect(menu.id)} className="flex-shrink-0">
                              {selectedIds.has(menu.id)
                                ? <CheckSquare className="h-5 w-5 text-indigo-600" />
                                : <Square className="h-5 w-5 text-gray-300" />
                              }
                            </button>
                            {menu.image_url && <img src={menu.image_url} alt={menu.titre} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-100" />}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900">{menu.titre}</p>
                                {!menu.disponible && <Badge variant="gray">Indisponible</Badge>}
                                {(menu as any).menu_du_jour && <Badge variant="yellow">⭐ Menu du jour</Badge>}
                              </div>
                              {menu.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{menu.description}</p>}
                              {menu.prix && afficherPrix && <p className="text-sm font-semibold text-primary-600 mt-1">{menu.prix}{deviseSymbol}</p>}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Toggle checked={menu.disponible} onChange={() => handleToggle(menu)} />
                              <Button variant="ghost" size="sm" onClick={() => openEdit(menu)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="danger" size="sm" loading={deleting === menu.id} onClick={() => handleDelete(menu.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )
          )}

          {/* ── ONGLET GROUPES ───────────────────────────────────────────────── */}
          {activeTab === 'groupes' && (
            <div className="space-y-4">
              {groupes.length === 0 && !showGroupeForm ? (
                <Card>
                  <CardBody>
                    <div className="py-12 text-center">
                      <Layers className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 mb-4">Créez des menus groupés pour pousser plusieurs plats d'un coup</p>
                      <Button onClick={() => setShowGroupeForm(true)}><FolderPlus className="h-4 w-4" /> Créer un groupe</Button>
                    </div>
                  </CardBody>
                </Card>
              ) : (
                <>
                  {groupes.map((groupe, idx) => (
                    <Card key={groupe.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle><Layers className="h-5 w-5 inline mr-2 text-indigo-500" />{groupe.nom}</CardTitle>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handlePushGroupe(groupe)} disabled={pushingMenu || groupe.menu_ids.length === 0}>
                              <Bell className="h-3.5 w-3.5" /> Pousser
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleDeleteGroupe(groupe.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {allMenus.map(m => (
                            <label key={m.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${groupe.menu_ids.includes(m.id) ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                              <input
                                type="checkbox"
                                checked={groupe.menu_ids.includes(m.id)}
                                onChange={() => handleToggleGroupeMenu(idx, m.id)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700">{m.titre}</span>
                              {m.prix && <span className="text-xs text-gray-400 ml-auto">{m.prix}€</span>}
                            </label>
                          ))}
                        </div>
                        {groupe.menu_ids.length === 0 && <p className="text-xs text-gray-400 mt-3 text-center">Cochez les plats à inclure dans ce groupe</p>}
                      </CardBody>
                    </Card>
                  ))}
                  {!showGroupeForm && (
                    <Button variant="secondary" onClick={() => setShowGroupeForm(true)}>
                      <FolderPlus className="h-4 w-4" /> Créer un groupe
                    </Button>
                  )}
                </>
              )}

              {/* Formulaire nouveau groupe */}
              {showGroupeForm && (
                <Card>
                  <CardBody>
                    <div className="flex items-center gap-3">
                      <Input label="Nom du groupe" placeholder="Ex: Menu déjeuner" value={groupeNom} onChange={e => setGroupeNom(e.target.value)} />
                      <div className="flex gap-2 mt-6">
                        <Button onClick={handleCreateGroupe}><Check className="h-4 w-4" /> Créer</Button>
                        <Button variant="secondary" onClick={() => { setShowGroupeForm(false); setGroupeNom(''); }}>Annuler</Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          )}

          {/* ── ONGLET SETTINGS ──────────────────────────────────────────────── */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Catégories</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  <Textarea label="Catégories (séparées par des virgules)" placeholder="Entrées, Plats, Desserts, Boissons" rows={3} value={categories} onChange={e => setCategories(e.target.value)} />
                  <div className="flex flex-wrap gap-2">
                    {categories.split(',').map(c => c.trim()).filter(Boolean).map(c => (
                      <Badge key={c} variant="blue">{c}</Badge>
                    ))}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader><CardTitle>Affichage</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  <Select label="Devise" options={[{ value: 'EUR', label: '€ Euro' }, { value: 'USD', label: '$ Dollar' }, { value: 'CHF', label: 'CHF Franc Suisse' }]} value={devise} onChange={e => setDevise(e.target.value)} />
                  <div className="flex items-start justify-between p-3 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Afficher les prix</p>
                      <p className="text-xs text-gray-500 mt-0.5">Masquer les prix sur la carte client</p>
                    </div>
                    <Toggle checked={afficherPrix} onChange={setAfficherPrix} />
                  </div>
                </CardBody>
              </Card>

              <div className="lg:col-span-2">
                <div className="flex items-center">
                  <SaveIndicator status={saveStatusSettings} />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal ajout/édition plat */}
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.menu ? 'Modifier le plat' : 'Ajouter un plat'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Titre" placeholder="Salade César" error={errors.titre?.message} {...register('titre')} />
          <Textarea label="Description" placeholder="Laitue romaine, parmesan, croûtons…" rows={2} {...register('description')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={`Prix (${deviseSymbol})`} type="number" step="0.01" placeholder="12.50" {...register('prix')} />
            <div>
              <label className="label">Catégorie</label>
              <input list="menu-categories" className="input" placeholder="Entrées" {...register('categorie')} />
              <datalist id="menu-categories">
                {categories.split(',').map(c => c.trim()).filter(Boolean).map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>
          <Input label="Image URL" placeholder="https://…" error={errors.image_url?.message} {...register('image_url')} />
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <Toggle checked={watch('disponible')} onChange={v => setValue('disponible', v)} label="Disponible" />
              <Toggle checked={watch('menu_du_jour')} onChange={v => setValue('menu_du_jour', v)} label="⭐ Menu du jour" />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" type="button" onClick={() => setModal({ open: false })}>Annuler</Button>
              <Button type="submit" loading={isSubmitting}>{modal.menu ? 'Enregistrer' : 'Ajouter'}</Button>
            </div>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
