import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { walletApi, type WalletSetupData } from '@/services/api';
import { AlertCircle, CheckCircle, Palette, Star } from 'lucide-react';

// ─── Templates ────────────────────────────────────────────────────────────────

const WALLET_TEMPLATES = [
  { id: 'boulangerie', label: 'Boulangerie',  emoji: '🍞', couleur: '#8B4513', programme: 'Carte Fidélité Boulangerie', recompense: '1 pain offert à 10 points',    points: 10 },
  { id: 'coiffeur',    label: 'Coiffeur',     emoji: '✂️', couleur: '#9B59B6', programme: 'Carte Fidélité Salon',        recompense: '1 coupe offerte à 5 points',   points: 5  },
  { id: 'restaurant',  label: 'Restaurant',   emoji: '🍽️', couleur: '#E74C3C', programme: 'Carte Fidélité Restaurant',   recompense: '1 dessert offert à 10 points', points: 10 },
  { id: 'kine',        label: 'Kiné',         emoji: '💆', couleur: '#3498DB', programme: 'Carte Fidélité Cabinet',      recompense: '1 séance offerte à 10 points', points: 10 },
  { id: 'garagiste',   label: 'Garagiste',    emoji: '🚗', couleur: '#2C3E50', programme: 'Carte Fidélité Garage',       recompense: '1 vidange offerte à 5 points', points: 5  },
] as const;

type TemplateId = typeof WALLET_TEMPLATES[number]['id'];

// ─── Mini card preview ─────────────────────────────────────────────────────────

interface CardPreviewProps {
  couleur: string;
  programme: string;
  logoUrl?: string;
}

function CardPreview({ couleur, programme, logoUrl }: CardPreviewProps) {
  return (
    <div
      className="relative rounded-2xl p-5 text-white shadow-lg overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${couleur} 0%, ${couleur}cc 100%)`,
        minHeight: '120px',
      }}
    >
      {/* Decorative circle */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20"
        style={{ background: 'white' }}
      />
      <div className="relative flex items-center gap-3 mb-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            className="w-10 h-10 rounded-lg object-contain bg-white/20 p-1"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-lg">
            S
          </div>
        )}
        <span className="font-bold text-sm tracking-wide">Stamply</span>
      </div>
      <p className="relative font-semibold text-base leading-tight">
        {programme || 'Nom du programme'}
      </p>
      <p className="relative text-xs text-white/70 mt-1">Carte de fidélité</p>
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
  const [logoUrl, setLogoUrl] = useState('');
  const [pointsRecompense, setPointsRecompense] = useState<number>(10);
  const [recompenseDescription, setRecompenseDescription] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  // Apply a template's values to the form
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

  // Validate form fields
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
      logo_url: logoUrl.trim() || undefined,
      points_recompense: pointsRecompense,
      recompense_description: recompenseDescription.trim(),
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
        {/* Page header */}
        <div className="page-header">
          <h1 className="page-title">Configurez votre carte de fidélité</h1>
          <p className="page-subtitle">
            Choisissez un template ou personnalisez votre carte pour commencer à fidéliser vos clients.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Template picker ─────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Star className="h-4 w-4 text-gray-500" />
                </div>
                <CardTitle>Choisissez un template</CardTitle>
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
                      {/* Mini card */}
                      <div
                        className="w-full rounded-lg h-12 flex items-center justify-center text-white text-xs font-semibold shadow-sm px-2 text-center leading-tight"
                        style={{ background: tpl.couleur }}
                      >
                        <span className="truncate">{tpl.programme}</span>
                      </div>
                      {/* Emoji + label */}
                      <span className="text-2xl leading-none">{tpl.emoji}</span>
                      <span
                        className={[
                          'text-xs font-medium',
                          isSelected ? 'text-primary-700' : 'text-gray-600',
                        ].join(' ')}
                      >
                        {tpl.label}
                      </span>
                      {isSelected && (
                        <CheckCircle className="h-4 w-4 text-primary-600" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Cliquez sur un template pour pré-remplir le formulaire. Vous pourrez tout modifier ensuite.
              </p>
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

                {/* Programme nom */}
                <Input
                  label="Nom du programme"
                  placeholder="Carte Fidélité Stamply"
                  value={programmenom}
                  onChange={(e) => setProgrammeNom(e.target.value)}
                  error={errors.programme_nom}
                />

                {/* Couleur primaire */}
                <div>
                  <label className="label">Couleur primaire</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={couleur}
                      onChange={(e) => setCouleur(e.target.value)}
                      className="h-9 w-16 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                    />
                    <Input
                      value={couleur}
                      onChange={(e) => setCouleur(e.target.value)}
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Logo URL */}
                <Input
                  label="URL du logo (optionnel)"
                  placeholder="https://monsite.fr/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  error={errors.logo_url}
                />

                {/* Points récompense */}
                <Input
                  label="Points requis pour la récompense"
                  type="number"
                  min={1}
                  value={pointsRecompense}
                  onChange={(e) => setPointsRecompense(Number(e.target.value))}
                  error={errors.points_recompense}
                  hint="Nombre de points qu'un client doit accumuler pour obtenir sa récompense"
                />

                {/* Description récompense */}
                <Input
                  label="Description de la récompense"
                  placeholder="1 café offert"
                  value={recompenseDescription}
                  onChange={(e) => setRecompenseDescription(e.target.value)}
                  error={errors.recompense_description}
                />

                {/* Live preview */}
                <div>
                  <p className="label mb-2">Aperçu de votre carte</p>
                  <div className="max-w-xs">
                    <CardPreview
                      couleur={couleur}
                      programme={programmenom}
                      logoUrl={logoUrl || undefined}
                    />
                    {recompenseDescription && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Récompense : {recompenseDescription} ({pointsRecompense} pts)
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </CardBody>
          </Card>

          {/* ── API error ────────────────────────────────────────────────────── */}
          {apiError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* ── Submit ───────────────────────────────────────────────────────── */}
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
