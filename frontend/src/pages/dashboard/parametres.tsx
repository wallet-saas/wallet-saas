import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { PageSpinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { commercantApi, authApi } from '@/services/api';
import { CheckCircle, Loader2, AlertCircle, Store, Palette, Blocks, Star, MessageSquare, MapPin, Lock } from 'lucide-react';

// HTML number inputs return NaN (not undefined) when empty via valueAsNumber.
// z.number() rejects NaN, which would block ALL form submissions when lat/long are unset.
// This preprocessor converts NaN → undefined so optional fields behave correctly.
const nanToUndefined = (v: unknown) =>
  typeof v === 'number' && isNaN(v) ? undefined : v;

const schema = z.object({
  nom_enseigne: z.string().min(2),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  code_postal: z.string().optional(),
  couleur_primaire: z.string().optional(),
  couleur_secondaire: z.string().optional(),
  logo_url: z.string().url('URL invalide').optional().or(z.literal('')),
  points_par_visite: z.preprocess(nanToUndefined, z.number().min(1).optional()),
  points_requis_recompense: z.preprocess(nanToUndefined, z.number().min(1).optional()),
  google_place_url: z.string().url('URL invalide').optional().or(z.literal('')),
  delai_avis_minutes: z.preprocess(nanToUndefined, z.number().min(0).optional()),
  rayon_geoloc_metres: z.preprocess(nanToUndefined, z.number().min(50).max(500).optional()),
  latitude: z.preprocess(nanToUndefined, z.number().optional()),
  longitude: z.preprocess(nanToUndefined, z.number().optional()),
});
type FormData = z.infer<typeof schema>;

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Icon className="h-4 w-4 text-gray-500" />
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export default function ParametresPage() {
  const { commercant, updateCommercant } = useAuth();
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [moduleSaving, setModuleSaving] = useState<string | null>(null);
  const [modules, setModules] = useState({
    module_avis: false,
    module_geoloc: false,
    module_menus: false,
    module_offres: false,
  });

  const isInitializedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref holds the latest save fn to avoid stale closures in the watch subscription
  const doSaveRef = useRef<((data: FormData) => Promise<void>) | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Keep doSaveRef up to date with the latest updateCommercant
  doSaveRef.current = async (data: FormData) => {
    setAutoSaveStatus('saving');
    try {
      const { commercant: updated } = await commercantApi.update(data);
      updateCommercant(updated);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch {
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  };

  // Populate form when commercant loads
  useEffect(() => {
    if (!commercant) return;
    isInitializedRef.current = false;
    reset({
      nom_enseigne: commercant.nom_enseigne || '',
      telephone: commercant.telephone || '',
      adresse: commercant.adresse || '',
      ville: commercant.ville || '',
      code_postal: commercant.code_postal || '',
      couleur_primaire: commercant.couleur_primaire || '#6366f1',
      couleur_secondaire: commercant.couleur_secondaire || '#a5b4fc',
      logo_url: commercant.logo_url || '',
      points_par_visite: commercant.points_par_visite || 1,
      points_requis_recompense: commercant.points_requis_recompense || 10,
      google_place_url: commercant.google_place_url || '',
      delai_avis_minutes: commercant.delai_avis_minutes || 30,
      rayon_geoloc_metres: commercant.rayon_geoloc_metres || 200,
      latitude: commercant.latitude,
      longitude: commercant.longitude,
    });
    setModules({
      module_avis: !!commercant.module_avis,
      module_geoloc: !!commercant.module_geoloc,
      module_menus: !!commercant.module_menus,
      module_offres: !!commercant.module_offres,
    });
    // Short delay so the reset() above doesn't fire auto-save
    const t = setTimeout(() => { isInitializedRef.current = true; }, 300);
    return () => clearTimeout(t);
  }, [commercant, reset]);

  // Subscribe to form changes → debounced auto-save
  useEffect(() => {
    const { unsubscribe } = watch(() => {
      if (!isInitializedRef.current) return;

      setAutoSaveStatus('pending');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        handleSubmit((data) => doSaveRef.current?.(data))();
      }, 800);
    });

    return () => {
      unsubscribe();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Module toggles save immediately (separate from the form)
  const handleModuleToggle = async (key: string, value: boolean) => {
    setModules(prev => ({ ...prev, [key]: value }));
    setModuleSaving(key);
    try {
      const { commercant: updated } = await commercantApi.update({ [key]: value });
      updateCommercant(updated);
    } catch (e: any) {
      setModules(prev => ({ ...prev, [key]: !value }));
      alert(e?.message || 'Erreur lors de la sauvegarde du module');
    } finally {
      setModuleSaving(null);
    }
  };

  const couleurPrimaire = watch('couleur_primaire');
  const logoUrl = watch('logo_url');

  if (!commercant) return (
    <DashboardLayout>
      <PageSpinner />
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <Head><title>Paramètres — Stamply</title></Head>

      <div className="page-header">
        <h1 className="page-title">Paramètres</h1>
        <p className="page-subtitle">Configurez votre programme de fidélité</p>
      </div>

      <form className="space-y-6">
        {/* Informations commerce */}
        <Section title="Informations du commerce" icon={Store}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nom de l'enseigne" error={errors.nom_enseigne?.message} {...register('nom_enseigne')} />
            <Input label="Téléphone" type="tel" {...register('telephone')} />
            <Input label="Adresse" className="md:col-span-2" {...register('adresse')} />
            <Input label="Ville" {...register('ville')} />
            <Input label="Code postal" {...register('code_postal')} />
          </div>
        </Section>

        {/* Personnalisation carte */}
        <Section title="Personnalisation de la carte" icon={Palette}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Couleur primaire</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  className="h-9 w-16 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                  {...register('couleur_primaire')}
                />
                <Input
                  value={couleurPrimaire || ''}
                  onChange={e => setValue('couleur_primaire', e.target.value)}
                  placeholder="#6366f1"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="label">Couleur secondaire</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  className="h-9 w-16 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                  {...register('couleur_secondaire')}
                />
                <Input
                  value={watch('couleur_secondaire') || ''}
                  onChange={e => setValue('couleur_secondaire', e.target.value)}
                  placeholder="#a5b4fc"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <Input
                label="Logo URL"
                placeholder="https://monsite.fr/logo.png"
                error={errors.logo_url?.message}
                {...register('logo_url')}
              />
              {logoUrl && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={logoUrl} alt="Logo preview" className="h-12 w-12 rounded-lg object-contain bg-gray-50 border border-gray-100" />
                  <span className="text-xs text-gray-400">Aperçu</span>
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* Modules */}
        <Section title="Modules activés" icon={Blocks}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'module_avis', label: 'Avis Google', desc: 'Collectez et gérez les avis clients' },
              { key: 'module_geoloc', label: 'Géolocalisation', desc: 'Notifications de proximité automatiques' },
              { key: 'module_menus', label: 'Menu du Jour', desc: 'Affichez votre menu à vos clients' },
              { key: 'module_offres', label: 'Offres Flash', desc: 'Envoyez des promotions ciblées' },
            ].map(m => (
              <div key={m.key} className="flex items-start justify-between p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                  {moduleSaving === m.key && (
                    <p className="text-xs text-primary-500 mt-1">Sauvegarde…</p>
                  )}
                </div>
                <Toggle
                  checked={modules[m.key as keyof typeof modules]}
                  onChange={v => handleModuleToggle(m.key, v)}
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Fidélité */}
        <Section title="Programme de fidélité" icon={Star}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Points par visite"
              type="number"
              min={1}
              hint="Nombre de points attribués à chaque visite"
              {...register('points_par_visite', { valueAsNumber: true })}
            />
            <Input
              label="Points requis pour la récompense"
              type="number"
              min={1}
              hint="Seuil pour débloquer la récompense"
              {...register('points_requis_recompense', { valueAsNumber: true })}
            />
          </div>
        </Section>

        {/* Avis Google */}
        <Section title="Avis Google" icon={MessageSquare}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="URL de votre fiche Google"
                placeholder="https://g.page/mon-commerce ou https://maps.google.com/?cid=..."
                hint="Lien vers votre fiche Google — la notification redirigera directement ici. Un seul envoi par carte (à la première installation)."
                error={errors.google_place_url?.message}
                {...register('google_place_url')}
              />
            </div>
            <Input
              label="Délai avant notification avis (minutes)"
              type="number"
              min={0}
              hint="Délai après l'installation de la carte avant d'envoyer la demande d'avis"
              {...register('delai_avis_minutes', { valueAsNumber: true })}
            />
          </div>
        </Section>

        {/* Géolocalisation */}
        <Section title="Géolocalisation" icon={MapPin}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Latitude"
              type="number"
              step="any"
              placeholder="48.8566"
              {...register('latitude', { valueAsNumber: true })}
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              placeholder="2.3522"
              {...register('longitude', { valueAsNumber: true })}
            />
            <div>
              <Input
                label="Rayon de détection (m)"
                type="number"
                min={50}
                max={500}
                hint="50m – 500m"
                {...register('rayon_geoloc_metres', { valueAsNumber: true })}
              />
            </div>
          </div>
        </Section>

      </form>

      {/* Auto-save status indicator — fixed bottom-right */}
      {autoSaveStatus !== 'idle' && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-2.5 text-sm transition-all">
          {autoSaveStatus === 'pending' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              <span className="text-gray-500">En attente…</span>
            </>
          )}
          {autoSaveStatus === 'saving' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
              <span className="text-gray-600">Enregistrement…</span>
            </>
          )}
          {autoSaveStatus === 'saved' && (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-700 font-medium">Enregistré</span>
            </>
          )}
          {autoSaveStatus === 'error' && (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-600">Erreur d'enregistrement</span>
            </>
          )}
        </div>
      )}

      {/* Password change — separate form, not inside the main form */}
      <PasswordSection />
    </DashboardLayout>
  );
}

function PasswordSection() {
  const schema = z.object({
    ancien: z.string().min(1, 'Requis'),
    nouveau: z.string().min(6, '6 caractères minimum'),
    confirm: z.string(),
  }).refine(d => d.nouveau === d.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  });
  type PwData = z.infer<typeof schema>;

  const [pwSaved, setPwSaved] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PwData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: PwData) => {
    try {
      await authApi.changePassword(data.ancien, data.nouveau);
      setPwSaved(true);
      reset();
      setTimeout(() => setPwSaved(false), 3000);
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Lock className="h-4 w-4 text-gray-500" />
          </div>
          <CardTitle>Modifier mon mot de passe</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-4">
          <Input
            label="Mot de passe actuel"
            type="password"
            placeholder="••••••••"
            error={errors.ancien?.message}
            {...register('ancien')}
          />
          <Input
            label="Nouveau mot de passe"
            type="password"
            placeholder="6 caractères minimum"
            error={errors.nouveau?.message}
            {...register('nouveau')}
          />
          <Input
            label="Confirmer le nouveau mot de passe"
            type="password"
            placeholder="••••••••"
            error={errors.confirm?.message}
            {...register('confirm')}
          />
          <div className="flex items-center gap-3">
            <Button type="submit" loading={isSubmitting}>
              Mettre à jour
            </Button>
            {pwSaved && (
              <div className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Mot de passe modifié
              </div>
            )}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
