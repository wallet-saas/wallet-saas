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
import { menusApi, type Menu } from '@/services/api';
import { commercantApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { useAutoSave, SaveIndicator } from '@/hooks/useAutoSave';
import { formatEuro } from '@/utils/format';
import { Plus, Pencil, Trash2, UtensilsCrossed, ChevronDown, ChevronRight, Settings, Send, Bell, Check } from 'lucide-react';

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

export default function MenusPage() {
  const { commercant, refreshUser } = useAuth();
  const { show: toast } = useToast();
  const [parCategorie, setParCategorie] = useState<Record<string, Menu[]>>({});
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<{ open: boolean; menu?: Menu }>({ open: false });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'settings'>('menu');
  const [pushingMenu, setPushingMenu] = useState(false);
  const [pushResult, setPushResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const [moduleEnabled, setModuleEnabled] = useState(true);
  const [categories, setCategories] = useState('Entrées,Plats,Desserts,Boissons');
  const [devise, setDevise] = useState('EUR');
  const [afficherPrix, setAfficherPrix] = useState(true);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { disponible: true },
  });

  useEffect(() => {
    if (commercant) {
      setModuleEnabled(commercant.module_menu_jour ?? true);
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
      module_menu_jour: moduleEnabled,
      menu_categories: JSON.stringify(categories.split(',').map(c => c.trim()).filter(Boolean)),
      menu_devise: devise,
      menu_afficher_prix: afficherPrix,
    });
    await refreshUser();
  }, [moduleEnabled, categories, devise, afficherPrix, refreshUser]);

  const { status: saveStatusSettings } = useAutoSave({
    data: { moduleEnabled, categories, devise, afficherPrix },
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

  useEffect(() => { fetchMenus(); }, []);

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

  const handlePushMenuDuJour = async () => {
    setPushingMenu(true);
    setPushResult(null);
    try {
      const allMenus = Object.values(parCategorie).flat().filter(m => m.disponible);
      if (allMenus.length === 0) {
        setPushResult({ success: false, message: 'Aucun plat disponible à pousser' });
        return;
      }
      const platsList = allMenus.slice(0, 5).map(m => `• ${m.titre}${m.prix ? ` — ${formatEuro(m.prix)}` : ''}`).join('\n');
      const titre = '🍽️ Menu du jour';
      const message = `Découvrez notre menu du jour !\n\n${platsList}\n\nPassez nous voir !`;
      const { notificationsApi } = await import('@/services/api');
      const res = await notificationsApi.send(titre, message, 'tous');
      setPushResult({ success: true, message: `Menu du jour envoyé à ${res.totalEnvoyes} client(s) !` });
    } catch (e: any) {
      setPushResult({ success: false, message: e?.message || 'Erreur' });
    } finally { setPushingMenu(false); }
  };

  const allMenus = Object.values(parCategorie).flat();
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
            <Button onClick={handlePushMenuDuJour} disabled={loading || allMenus.length === 0} variant="secondary">
              <Bell className="h-4 w-4" /> Push Menu du Jour
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Ajouter un plat
            </Button>
          </div>
        </div>
      </div>

      <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border mb-6 ${moduleEnabled ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
        <UtensilsCrossed className={`h-5 w-5 ${moduleEnabled ? 'text-green-600' : 'text-gray-400'}`} />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Module Menu du Jour</p>
          <p className="text-xs text-gray-500">{moduleEnabled ? 'Activé — vos clients peuvent voir votre menu' : 'Désactivé — le menu est masqué'}</p>
        </div>
        <Toggle checked={moduleEnabled} onChange={async (val) => {
          const prev = moduleEnabled;
          setModuleEnabled(val);
          try {
            await commercantApi.update({ module_menu_jour: val });
            await refreshUser();
          } catch (e: any) {
            setModuleEnabled(prev);
            toast(e?.message || 'Erreur lors de la sauvegarde', 'error');
          }
        }} />
      </div>

      {pushResult && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-4 ${pushResult.success ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
          {pushResult.success ? <Check className="h-4 w-4 text-green-600" /> : <Pencil className="h-4 w-4 text-red-500" />}
          <p className={`text-sm ${pushResult.success ? 'text-green-700' : 'text-red-600'}`}>{pushResult.message}</p>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {([
          { id: 'menu', label: 'Mon Menu', icon: UtensilsCrossed },
          { id: 'settings', label: 'Paramètres', icon: Settings },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : (
        <>
          {activeTab === 'menu' && (
            Object.keys(parCategorie).length === 0 ? (
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
                          <div key={menu.id} className="flex items-center gap-4 px-6 py-4">
                            {menu.image_url && <img src={menu.image_url} alt={menu.titre} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-100" />}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900">{menu.titre}</p>
                                {!menu.disponible && <Badge variant="gray">Indisponible</Badge>}
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
