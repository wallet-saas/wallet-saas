import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { walletApi, type WalletSetupData } from '@/services/api';
import { AlertCircle, CheckCircle, Palette, Eye } from 'lucide-react';

// ─── Card Preview ──────────────────────────────────────────────────────────────

interface CardPreviewProps {
  couleur: string;
  couleurSecondaire: string;
  programme: string;
  logoUrl?: string;
  pointsRecompense: number;
  recompenseDescription: string;
  layout: 'classic' | 'modern' | 'minimal';
  texteBasCarte: string;
}

function CardPreview({ couleur, couleurSecondaire, programme, logoUrl, pointsRecompense, recompenseDescription, layout, texteBasCarte }: CardPreviewProps) {
  if (layout === 'modern') {
    return (
      <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ minHeight: '200px' }}>
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
          {texteBasCarte && (
            <p className="text-xs text-white/60 mt-3 border-t border-white/20 pt-2">{texteBasCarte}</p>
          )}
        </div>
      </div>
    );
  }

  if (layout === 'minimal') {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-100" style={{ minHeight: '180px', background: couleur }}>
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
          {texteBasCarte && (
            <p className="text-xs text-white/50 mt-2">{texteBasCarte}</p>
          )}
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
        minHeight: '160px',
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
      {texteBasCarte && (
        <p className="relative text-xs text-white/50 mt-2 border-t border-white/20 pt-2">{texteBasCarte}</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SetupCardPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [programmenom, setProgrammeNom] = useState('');
  const [couleur, setCouleur] = useState('#6366f1');
  const [couleurSecondaire, setCouleurSecondaire] = useState('#764ba2');
  const [logoUrl, setLogoUrl] = useState('');
  const [pointsRecompense, setPointsRecompense] = useState<number>(10);
  const [recompenseDescription, setRecompenseDescription] = useState('');
  const [layout, setLayout] = useState<'classic' | 'modern' | 'minimal'>('classic');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [texteBasCarte, setTexteBasCarte] = useState('');
  const [styleTexte, setStyleTexte] = useState<'normal' | 'gras' | 'italique'>('normal');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

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
      programme_nom: programmenom.trim(),
      couleur_primaire: couleur,
      couleur_secondaire: couleurSecondaire,
      logo_url: logoUrl.trim() || undefined,
      points_recompense: pointsRecompense,
      recompense_description: recompenseDescription.trim(),
      layout,
      texte_perso_bas_carte: texteBasCarte.trim() || undefined,
      style_texte: styleTexte,
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
            Personnalisez votre carte à votre image. Tous les champs sont modifiables.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

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
                      value={texteBasCarte}
                      onChange={(e) => setTexteBasCarte(e.target.value)}
                      hint="Texte affiché en bas de la carte"
                    />
                    <div>
                      <label className="label">Style du texte</label>
                      <div className="flex gap-2">
                        {([
                          { id: 'normal', label: 'Normal', style: {} },
                          { id: 'gras', label: 'Gras', style: { fontWeight: 'bold' } },
                          { id: 'italique', label: 'Italique', style: { fontStyle: 'italic' } },
                        ] as const).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setStyleTexte(s.id)}
                            className={[
                              'px-4 py-2 text-sm rounded-lg border-2 transition-all',
                              styleTexte === s.id
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 hover:border-indigo-300 text-gray-600',
                            ].join(' ')}
                            style={s.style}
                          >
                            {s.label}
                          </button>
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
                      texteBasCarte={texteBasCarte}
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
