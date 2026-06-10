import { useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { walletApi } from '@/services/api';
import { CardEditor, CardDesign, DEFAULT_CARD_DESIGN } from '@/components/CardEditor';
import { PremiumCardPreview } from '@/components/PremiumCardPreview';
import { uploadCardImage } from '@/lib/cardUpload';
import { AlertCircle, CheckCircle, CreditCard, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function SetupCardPage() {
  const router = useRouter();
  const { refreshUser, commercant } = useAuth();
  const { show: toast } = useToast();

  // Basic card info
  const [programmenom, setProgrammeNom] = useState('');
  const [pointsRecompense, setPointsRecompense] = useState<number>(10);
  const [recompenseDescription, setRecompenseDescription] = useState('');

  // Premium card design
  const [cardDesign, setCardDesign] = useState<CardDesign>(DEFAULT_CARD_DESIGN);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleImageUpload = useCallback(async (file: File, type: 'background' | 'logo') => {
    setIsUploading(true);
    try {
      const url = await uploadCardImage(file, type, commercant?.id);
      toast('Image uploadée avec succès', 'success');
      return url;
    } catch (err: any) {
      toast(err.message || 'Erreur lors de l\'upload', 'error');
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [commercant?.id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      // 1. Update card design in commercant record
      const designPayload = {
        card_design: JSON.stringify(cardDesign),
        carte_programme_nom: programmenom.trim(),
        points_recompense: pointsRecompense,
        carte_recompense_description: recompenseDescription.trim(),
      };
      
      // Call the wallet setup API which handles both Supabase update + Google Wallet
      await walletApi.setup({
        programme_nom: programmenom.trim(),
        couleur_primaire: cardDesign.tier_color,
        couleur_secondaire: cardDesign.overlay_color,
        logo_url: cardDesign.logo_url || undefined,
        points_recompense: pointsRecompense,
        recompense_description: recompenseDescription.trim(),
        layout: 'classic',
        texte_perso_bas_carte: '',
        style_texte: 'normal',
        // New premium fields
        card_design: JSON.stringify(cardDesign),
        carte_background_image_url: cardDesign.background_image_url || undefined,
        carte_logo_url: cardDesign.logo_url || undefined,
        carte_font_family: cardDesign.font_family,
        carte_text_color: cardDesign.text_color,
        carte_text_color_auto: cardDesign.text_color_auto,
        carte_tier_name: cardDesign.tier_name,
        carte_tier_color: cardDesign.tier_color,
        carte_overlay_opacity: cardDesign.overlay_opacity,
        carte_overlay_color: cardDesign.overlay_color,
      });

      await refreshUser();
      toast('Votre carte de fidélité a été créée avec succès !', 'success');
      router.push('/dashboard');
    } catch (err: any) {
      setApiError(err?.message || 'Une erreur est survenue. Veuillez réessayer.');
      toast('Erreur lors de la création de la carte', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <Head><title>Créer ma carte — Stamply</title></Head>

      <div className="max-w-5xl mx-auto">
        <div className="page-header mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="page-title">Créez votre carte de fidélité</h1>
              <p className="page-subtitle">
                Personnalisez votre carte à votre image. Tous les champs sont modifiables à tout moment.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Info de base ─────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                </div>
                <CardTitle>Informations du programme</CardTitle>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <Input
                  label="Nom du programme"
                  placeholder="Carte Fidélité Ma Boutique"
                  value={programmenom}
                  onChange={(e) => setProgrammeNom(e.target.value)}
                  error={errors.programme_nom}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>
            </CardBody>
          </Card>

          {/* ── Éditeur visuel premium ───────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Design de la carte</CardTitle>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Personnalisez l'apparence de votre carte. L'aperçu se met à jour en temps réel.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <CardEditor
                design={cardDesign}
                onChange={setCardDesign}
                onImageUpload={handleImageUpload}
                isUploading={isUploading}
              />
            </CardBody>
          </Card>

          {/* ── Error / Submit ──────────────────────────────────────────── */}
          {apiError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pb-4">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => router.push('/dashboard')}
            >
              Plus tard
            </Button>
            <Button type="submit" size="lg" loading={submitting}>
              <CreditCard className="w-4 h-4 mr-2" />
              Créer ma carte de fidélité
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
