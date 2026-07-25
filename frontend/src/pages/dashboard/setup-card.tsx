import { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { walletApi } from '@/services/api';
import { CardEditor, CardDesign, DEFAULT_CARD_DESIGN, CardProgramData, DEFAULT_CARD_DATA } from '@/components/CardEditor';
import { uploadCardImage } from '@/lib/cardUpload';
import { AlertCircle, CreditCard, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function SetupCardPage() {
  const router = useRouter();
  const { refreshUser, commercant } = useAuth();
  const { show: toast } = useToast();

  // Card program data (linked to preview)
  const [cardData, setCardData] = useState<CardProgramData>({
    ...DEFAULT_CARD_DATA,
    commercantNom: commercant?.nom_enseigne || DEFAULT_CARD_DATA.commercantNom,
  });

  // Type de système de fidélité
  const [carteType, setCarteType] = useState<string>((commercant as any)?.carte_type || 'tampons');
  const [typeConfig, setTypeConfig] = useState<Record<string, any>>((commercant as any)?.carte_type_config || {});
  const setCfg = (key: string, value: any) => setTypeConfig(prev => ({ ...prev, [key]: value }));

  // Pré-remplir avec le type déjà enregistré quand le profil finit de charger
  useEffect(() => {
    if ((commercant as any)?.carte_type) setCarteType((commercant as any).carte_type);
    if ((commercant as any)?.carte_type_config) setTypeConfig((commercant as any).carte_type_config);
  }, [commercant]);

  // Premium card design
  const [cardDesign, setCardDesign] = useState<CardDesign>(DEFAULT_CARD_DESIGN);
  const [isUploading, setIsUploading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!cardData.programmeNom.trim()) next.programme_nom = 'Le nom du programme est requis.';
    if (!cardData.tamponsPalier || cardData.tamponsPalier < 1) next.tampons_palier = 'Le palier doit être au minimum 1.';
    if (!cardData.recompense.trim()) next.recompense = 'La description de la récompense est requise.';
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
      await walletApi.setup({
        programme_nom: cardData.programmeNom.trim(),
        couleur_primaire: cardDesign.overlay_color,
        couleur_secondaire: cardDesign.overlay_gradient_color2 || cardDesign.overlay_color,
        logo_url: cardDesign.logo_url || undefined,
        points_recompense: cardData.tamponsPalier, // palier = points requis
        recompense_description: cardData.recompense.trim(),
        layout: 'classic',
        texte_perso_bas_carte: '',
        style_texte: 'normal',
        // Premium card design
        card_design: JSON.stringify(cardDesign),
        carte_background_image_url: cardDesign.background_image_url || undefined,
        carte_logo_url: cardDesign.logo_url || undefined,
        carte_font_family: cardDesign.font_family,
        carte_text_color: cardDesign.text_color,
        carte_text_color_auto: cardDesign.text_color_auto,
        carte_overlay_opacity: cardDesign.overlay_opacity,
        carte_overlay_color: cardDesign.overlay_color,
        // Tampons system
        tampons_palier: cardData.tamponsPalier,
        // Système de fidélité multi-types
        carte_type: carteType,
        carte_type_config: typeConfig,
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

      <div className="max-w-6xl mx-auto">
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

          {/* ── Type de système de fidélité ─────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Type de programme de fidélité</CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">
                Choisissez la mécanique de fidélité. Le scan en caisse s'adapte automatiquement.
              </p>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { id: 'tampons', nom: 'Carte à tampons', desc: '1 visite = 1 tampon' },
                  { id: 'points', nom: 'Carte de points', desc: '1€ dépensé = X points' },
                  { id: 'cashback', nom: 'Cashback', desc: '% des achats en cagnotte' },
                  { id: 'remise', nom: 'Remise à paliers', desc: 'Statuts Bronze/Argent/Or' },
                  { id: 'carte_cadeau', nom: 'Carte cadeau', desc: 'Solde prépayé' },
                  { id: 'membre', nom: 'Carte de membre', desc: 'Statut sans points' },
                  { id: 'coupon', nom: 'Coupon rabais', desc: 'Devient carte fidélité après usage' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCarteType(t.id)}
                    className={`text-left rounded-xl border-2 p-3 transition ${carteType === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="font-medium text-sm">{t.nom}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>

              {/* Config spécifique au type choisi */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {carteType === 'points' && (<>
                  <label className="block text-sm">
                    <span className="text-gray-700">Points par euro dépensé</span>
                    <input type="number" min={1} className="mt-1 w-full rounded-lg border-gray-300 border p-2"
                      value={typeConfig.points_par_euro ?? 1}
                      onChange={e => setCfg('points_par_euro', parseInt(e.target.value) || 1)} />
                  </label>
                  <label className="block text-sm">
                    <span className="text-gray-700">Points pour une récompense</span>
                    <input type="number" min={1} className="mt-1 w-full rounded-lg border-gray-300 border p-2"
                      value={typeConfig.points_recompense ?? 100}
                      onChange={e => setCfg('points_recompense', parseInt(e.target.value) || 100)} />
                  </label>
                </>)}
                {carteType === 'tampons' && (<>
                  <label className="block text-sm">
                    <span className="text-gray-700">Tampons pour la récompense</span>
                    <input type="number" min={1} className="mt-1 w-full rounded-lg border-gray-300 border p-2"
                      value={typeConfig.tampons_requis ?? cardData.tamponsPalier ?? 10}
                      onChange={e => setCfg('tampons_requis', parseInt(e.target.value) || 10)} />
                  </label>
                  <label className="block text-sm">
                    <span className="text-gray-700">Emoji du tampon</span>
                    <input type="text" maxLength={4} className="mt-1 w-full rounded-lg border-gray-300 border p-2"
                      value={typeConfig.tampon_emoji ?? '⭐'}
                      onChange={e => setCfg('tampon_emoji', e.target.value || '⭐')} />
                  </label>
                </>)}
                {carteType === 'cashback' && (
                  <label className="block text-sm">
                    <span className="text-gray-700">% de cashback sur chaque achat</span>
                    <input type="number" min={1} max={100} className="mt-1 w-full rounded-lg border-gray-300 border p-2"
                      value={typeConfig.cashback_pourcent ?? 5}
                      onChange={e => setCfg('cashback_pourcent', parseInt(e.target.value) || 5)} />
                  </label>
                )}
                {carteType === 'remise' && (
                  <div className="md:col-span-3 space-y-2">
                    <span className="text-sm text-gray-700">Paliers de remise (dépenses cumulées)</span>
                    {(typeConfig.paliers ?? [
                      { seuil: 0, nom: 'Bronze', remise: 0 },
                      { seuil: 200, nom: 'Argent', remise: 5 },
                      { seuil: 500, nom: 'Or', remise: 10 },
                    ]).map((pal: any, i: number) => (
                      <div key={i} className="flex gap-2 items-center text-sm">
                        <input type="text" className="w-28 rounded-lg border-gray-300 border p-2" value={pal.nom}
                          onChange={e => { const ps = [...(typeConfig.paliers ?? [{ seuil: 0, nom: 'Bronze', remise: 0 },{ seuil: 200, nom: 'Argent', remise: 5 },{ seuil: 500, nom: 'Or', remise: 10 }])]; ps[i] = { ...ps[i], nom: e.target.value }; setCfg('paliers', ps); }} />
                        <span className="text-gray-500">dès</span>
                        <input type="number" className="w-24 rounded-lg border-gray-300 border p-2" value={pal.seuil}
                          onChange={e => { const ps = [...(typeConfig.paliers ?? [{ seuil: 0, nom: 'Bronze', remise: 0 },{ seuil: 200, nom: 'Argent', remise: 5 },{ seuil: 500, nom: 'Or', remise: 10 }])]; ps[i] = { ...ps[i], seuil: parseFloat(e.target.value) || 0 }; setCfg('paliers', ps); }} />
                        <span className="text-gray-500">€ →</span>
                        <input type="number" className="w-20 rounded-lg border-gray-300 border p-2" value={pal.remise}
                          onChange={e => { const ps = [...(typeConfig.paliers ?? [{ seuil: 0, nom: 'Bronze', remise: 0 },{ seuil: 200, nom: 'Argent', remise: 5 },{ seuil: 500, nom: 'Or', remise: 10 }])]; ps[i] = { ...ps[i], remise: parseFloat(e.target.value) || 0 }; setCfg('paliers', ps); }} />
                        <span className="text-gray-500">% de remise</span>
                      </div>
                    ))}
                  </div>
                )}
                {carteType === 'coupon' && (<>
                  <label className="block text-sm md:col-span-2">
                    <span className="text-gray-700">Offre du coupon</span>
                    <input type="text" className="mt-1 w-full rounded-lg border-gray-300 border p-2"
                      value={typeConfig.offre ?? '-10% sur votre première commande'}
                      onChange={e => setCfg('offre', e.target.value)} />
                  </label>
                  <label className="block text-sm">
                    <span className="text-gray-700">Après usage, devient</span>
                    <select className="mt-1 w-full rounded-lg border-gray-300 border p-2"
                      value={typeConfig.type_apres_usage ?? 'tampons'}
                      onChange={e => setCfg('type_apres_usage', e.target.value)}>
                      <option value="tampons">Carte à tampons</option>
                      <option value="points">Carte de points</option>
                      <option value="cashback">Carte cashback</option>
                    </select>
                  </label>
                </>)}
                {carteType === 'membre' && (
                  <label className="block text-sm">
                    <span className="text-gray-700">Libellé du statut</span>
                    <input type="text" className="mt-1 w-full rounded-lg border-gray-300 border p-2"
                      value={typeConfig.statut_defaut ?? 'Membre'}
                      onChange={e => setCfg('statut_defaut', e.target.value)} />
                  </label>
                )}
                {carteType === 'carte_cadeau' && (
                  <p className="text-sm text-gray-500 md:col-span-3">
                    Le solde de chaque carte cadeau se crédite au moment de la vente, directement depuis la page Scanner.
                  </p>
                )}
              </div>
            </CardBody>
          </Card>

          {/* ── Éditeur visuel premium ───────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-purple-600" />
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
                cardData={cardData}
                onCardDataChange={setCardData}
                onImageUpload={handleImageUpload}
                isUploading={isUploading}
              />
            </CardBody>
          </Card>

          {/* ── Validation errors ───────────────────────────────────────── */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              {Object.entries(errors).map(([key, msg]) => (
                <p key={key} className="text-sm text-red-600">{msg}</p>
              ))}
            </div>
          )}

          {apiError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* ── Submit ──────────────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 pb-4">
            <Button type="button" variant="secondary" size="lg" onClick={() => router.push('/dashboard')}>
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
