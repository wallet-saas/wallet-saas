import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { walletApi, type WalletSetupData } from '@/services/api';
import { AlertCircle, CheckCircle, Palette, Star, Sparkles, Eye } from 'lucide-react';

// ─── Templates (suggestions only, not forced) ─────────────────────────────────

const WALLET_TEMPLATES = [
  { id: 'boulangerie', label: 'Boulangerie',  emoji: '🍞', couleur: '#8B4513', programme: 'Carte Fidélité Boulangerie', recompense: '1 pain offert à 10 points',    points: 10 },
  { id: 'coiffeur',    label: 'Coiffeur',     emoji: '✂️', couleur: '#9B59B6', programme: 'Carte Fidélité Salon',        recompense: '1 coupe offerte à 5 points',   points: 5  },
  { id: 'restaurant',  label: 'Restaurant',   emoji: '🍽️', couleur: '#E74C3C', programme: 'Carte Fidélité Restaurant',   recompense: '1 dessert offert à 10 points', points: 10 },
  { id: 'kine',        label: 'Kiné',         emoji: '💆', couleur: '#3498DB', programme: 'Carte Fidélité Cabinet',      recompense: '1 séance offerte à 10 points', points: 10 },
  { id: 'garagiste',   label: 'Garagiste',    emoji: '🚗', couleur: '#2C3E50', programme: 'Carte Fidélité Garage',       recompense: '1 vidange offerte à 5 points', points: 5  },
] as const;

type TemplateId = typeof WALLET_TEMPLATES[number]['id'];

// ─── Card Preview ──────────────────────────────────────────────────────────────

interface CardPreviewProps {
  couleur: string;
  couleurSecondaire: string;
  programme: string;
  logoUrl?: string;
  pointsRecompense: number;
  recompenseDescription: string;
  layout: 'classic' | 'modern' | 'minimal';
}

function CardPreview({ couleur, couleurSecondaire, programme, logoUrl, pointsRecompense, recompenseDescription, layout }: CardPreviewProps) {
  if (layout === 'modern') {
    return (
      <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ minHeight: '180px' }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${couleur} 0%, ${couleurSecondaire} 100%)` }} />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-contain bg-white/20 p-1.5" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold">
                  {programme.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-bold text-sm">Stamply</p>
                <p className="text-xs text-white/70">Fidélité</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{pointsRecompense}</p>
              <p className="text-xs text-white/70">points</p>
            </div>
          </div>
          <p className="font-bold text-lg leading-tight mb-1">{programme || 'Nom du programme'}</p>
          <p className="text-sm text-white/80">{recompenseDescription || 'Récompense à débloquer'}</p>
        </div>
      </div>
    );
  }

  if (layout === 'minimal') {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-100" style={{ minHeight: '160px', background: couleur }}>
        <div className="p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white/20 p-1" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-lg font-bold">
                {programme.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-bold text-sm tracking-wide">Stamply</span>
          </div>
          <p className="font-bold text-base leading-tight mb-1">{programme || 'Nom du programme'}</p>
          <p className="text-xs text-white/70">{recompenseDescription || 'Récompense à débloquer'}</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/60 rounded-full" style={{ width: '30%' }} />
            </div>
            <span className="text-xs text-white/70">{pointsRecompense} pts</span>
          </div>
        </div>
      </div>
    );
  }

  // Classic layout
  return (
    <div
      className="relative rounded-2xl p-5 text-white shadow-lg overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${couleur} 0%, ${couleur}cc 100%)`,
        minHeight: '140px',
      }}
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20" style={{ background: 'white' }} />
      <div className="relative flex items-center gap-3 mb-3">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white/20 p-1" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-lg">
            {programme.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="font-bold text-sm tracking-wide">Stamply</span>
      </div>
      <p className="relative font-semibold text-base leading-tight mb-1">
        {programme || 'Nom du programme'}
      </p>
      <p className="relative text-xs text-white/70">{recompenseDescription || 'Récompense à débloquer'}</p>
      <div className="relative mt-2 flex items-center gap-2">
        <span className="text-xs text-white/60">{pointsRecompense} points</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SetupCardPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
  const [programmenom, setProgrammeNom] = useState('');
  const [couleur, setCouleur] = useState('#6366f1');
  const [couleurSecondaire, setCouleurSecondaire] = useState('#764ba2');
  const [logoUrl, setLogoUrl] = useState('');
  const [pointsRecompense, setPointsRecompense] = useState<number>(10);
  const [recompenseDescription, setRecompenseDescription] = useState('');
  const [layout, setLayout] = useState<'classic' | 'modern' | 'minimal'>('classic');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const applyTemplate = (id: TemplateId) => {
    const tpl = WALLET_TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    setSelectedTemplate(id);
    setProgrammeNom(tpl.programme);
    setCouleur(tpl.couleur);
    setPointsRecompense(tpl.points);
    setRecompenseDescription(tpl.recompense);
    setErrors({});
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!programmenom.trim()) next.programme_nom = 'Le nom du programme est requis.';
    if (!pointsRecompense || pointsRecompense < 1) next.points_recompense = 'Indiquez un nombre de points valide (minimum 1).';
    if (!recompenseDescription.trim()) next.recompense_description = 'La description de la récompense est requise.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    const payload: WalletSetupData = {
      template_type: selectedTemplate ?? undefined,
      programme_nom: programmenom.trim(),
      couleur_primaire: couleur,
      couleur_secondaire: couleurSecondaire,
      logo_url: logoUrl.trim() || undefined,
      points_recompense: pointsRecompense,
      recompense_description: recompenseDescription.trim(),
      layout,
    };

    setSubmitting(true);
    try {
      await walletApi.setup(payload);
      await refreshUser();
      router.push('/dashboard');
    } catch (err: any) {
      setApiError(err?.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <Head><title>Configurer ma carte — Stamply</title></Head>

      <div className="max-w-3xl mx-auto">
        <div className="page-header">
          <h1 className="page-title">Créez votre carte de fidélité</h1>
          <p className="page-subtitle">
            Personnalisez votre carte à votre image. Les templates sont des suggestions — vous pouvez tout modifier.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Template suggestions (optional) ─────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-gray-500" />
                  </div>
                  <CardTitle>Suggestions de design</CardTitle>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Effacer la sélection
                </button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {WALLET_TEMPLATES.map((tpl) => {
                  const isSelected = selectedTemplate === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => applyTemplate(tpl.id)}
                      className={[
                        'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-400',
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50',
                      ].join(' ')}
                    >
                      <div
                        className="w-full rounded-lg h-12 flex items-center justify-center text-white text-xs font-semibold shadow-sm px-2 text-center leading-tight"
                        style={{ background: tpl.couleur }}
                      >
                        <span className="truncate">{tpl.programme}</span>
                      </div>
                      <span className="text-2xl leading-none">{tpl.emoji}</span>
                      <span className={['text-xs font-medium', isSelected ? 'text-primary-700' : 'text-gray-600'].join(' ')}>
                        {tpl.label}
                      </span>
                      {isSelected && <CheckCircle className="h-4 w-4 text-primary-600" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                💡 Ces templates pré-remplissent le formulaire ci-dessous. Vous pouvez les ignorer et tout personnaliser manuellement.
              </p>
            </CardBody>
          </Card>

          {/* ── Card Layout ──────────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Eye className="h-4 w-4 text-gray-500" />
                </div>
                <CardTitle>Style de carte</CardTitle>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { id: 'classic', label: 'Classique', desc: 'Design épuré' },
                  { id: 'modern', label: 'Moderne', desc: 'Dégradé avec cercles' },
                  { id: 'minimal', label: 'Minimal', desc: 'Simple et épuré' },
                ] as const).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLayout(l.id)}
                    className={[
                      'p-3 rounded-xl border-2 text-center transition-all',
                      layout === l.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-100 hover:border-gray-300',
                    ].join(' ')}
                  >
                    <p className={['text-sm font-medium', layout === l.id ? 'text-primary-700' : 'text-gray-700'].join(' ')}>{l.label}</p>
                    <p className="text-xs text-gray-400">{l.desc}</p>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* ── Customisation form ───────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Palette className="h-4 w-4 text-gray-500" />
                </div>
                <CardTitle>Personnalisez votre carte</CardTitle>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-5">
                <Input
                  label="Nom du programme"
                  placeholder="Carte Fidélité Stamply"
                  value={programmenom}
                  onChange={(e) => setProgrammeNom(e.target.value)}
                  error={errors.programme_nom}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Couleur primaire</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={couleur} onChange={(e) => setCouleur(e.target.value)} className="h-9 w-12 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                      <Input value={couleur} onChange={(e) => setCouleur(e.target.value)} placeholder="#6366f1" className="flex-1" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Couleur secondaire</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={couleurSecondaire} onChange={(e) => setCouleurSecondaire(e.target.value)} className="h-9 w-12 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                      <Input value={couleurSecondaire} onChange={(e) => setCouleurSecondaire(e.target.value)} placeholder="#764ba2" className="flex-1" />
                    </div>
                  </div>
                </div>

                <Input
                  label="URL du logo (optionnel)"
                  placeholder="https://monsite.fr/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  error={errors.logo_url}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Points requis pour la récompense"
                    type="number"
                    min={1}
                    value={pointsRecompense}
                    onChange={(e) => setPointsRecompense(Number(e.target.value))}
                    error={errors.points_recompense}
                  />
                  <Input
                    label="Description de la récompense"
                    placeholder="1 café offert"
                    value={recompenseDescription}
                    onChange={(e) => setRecompenseDescription(e.target.value)}
                    error={errors.recompense_description}
                  />
                </div>

                {/* Advanced options toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-indigo-600 font-medium hover:text-indigo-700"
                >
                  {showAdvanced ? '▲ Masquer les options avancées' : '▼ Options avancées'}
                </button>

                {showAdvanced && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                    <Input
                      label="Texte personnalisé (bas de carte)"
                      placeholder="Merci pour votre fidélité !"
                      value={''}
                      onChange={() => {}}
                      hint="Texte affiché en bas de la carte"
                    />
                    <div>
                      <label className="label">Style du texte</label>
                      <div className="flex gap-2">
                        {['Normal', 'Gras', 'Italique'].map((s) => (
                          <button key={s} type="button" className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:border-indigo-300">{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Live preview */}
                <div>
                  <p className="label mb-2">Aperçu en temps réel</p>
                  <div className="max-w-xs">
                    <CardPreview
                      couleur={couleur}
                      couleurSecondaire={couleurSecondaire}
                      programme={programmenom}
                      logoUrl={logoUrl || undefined}
                      pointsRecompense={pointsRecompense}
                      recompenseDescription={recompenseDescription}
                      layout={layout}
                    />
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Récompense : {recompenseDescription} ({pointsRecompense} pts)
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {apiError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <div className="flex justify-end pb-4">
            <Button type="submit" size="lg" loading={submitting}>
              Créer ma carte de fidélité
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
