import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { commercantApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { CardEditor, CardDesign, DEFAULT_CARD_DESIGN } from '@/components/CardEditor';
import { PremiumCardPreview } from '@/components/PremiumCardPreview';
import { uploadCardImage } from '@/lib/cardUpload';
import { Store, Palette, Eye, Save, Settings, CreditCard, Sparkles } from 'lucide-react';

export default function ParametresPage() {
  const { commercant, refreshUser } = useAuth();
  const { show: toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'commerce' | 'carte' | 'design'>('commerce');

  // Commerce fields
  const [nomEnseigne, setNomEnseigne] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [email, setEmail] = useState('');

  // Legacy card fields
  const [couleur, setCouleur] = useState('#6366f1');
  const [couleurSecondaire, setCouleurSecondaire] = useState('#764ba2');
  const [programmeNom, setProgrammeNom] = useState('');
  const [recompenseDesc, setRecompenseDesc] = useState('');
  const [pointsRecompense, setPointsRecompense] = useState(10);
  const [layout, setLayout] = useState<'classic' | 'modern' | 'minimal'>('classic');
  const [texteBasCarte, setTexteBasCarte] = useState('');
  const [styleTexte, setStyleTexte] = useState<'normal' | 'gras' | 'italique'>('normal');
  const [logoUrl, setLogoUrl] = useState('');

  // Premium card design
  const [cardDesign, setCardDesign] = useState<CardDesign>(DEFAULT_CARD_DESIGN);

  useEffect(() => {
    if (commercant) {
      setNomEnseigne(commercant.nom_enseigne || '');
      setTelephone(commercant.telephone || '');
      setAdresse(commercant.adresse || '');
      setVille(commercant.ville || '');
      setCodePostal(commercant.code_postal || '');
      setEmail(commercant.email || '');
      setCouleur(commercant.carte_couleur_primaire || '#6366f1');
      setCouleurSecondaire(commercant.carte_couleur_secondaire || '#764ba2');
      setProgrammeNom(commercant.carte_programme_nom || '');
      setRecompenseDesc(commercant.carte_recompense_description || '');
      setPointsRecompense(commercant.points_recompense || 10);
      setLayout((commercant.carte_layout as any) || 'classic');
      setTexteBasCarte(commercant.texte_perso_bas_carte || '');
      setStyleTexte((commercant.style_texte as any) || 'normal');
      setLogoUrl(commercant.carte_logo_url || '');

      // Load premium card design if exists
      if ((commercant as any).card_design) {
        try {
          const parsed = JSON.parse((commercant as any).card_design);
          setCardDesign({ ...DEFAULT_CARD_DESIGN, ...parsed });
        } catch {
          // Keep defaults
        }
      }

      setLoading(false);
    }
  }, [commercant]);

  const handleImageUpload = useCallback(async (file: File, type: 'background' | 'logo') => {
    setIsUploading(true);
    try {
      const url = await uploadCardImage(file, type, commercant?.id);
      toast('Image uploadée', 'success');
      return url;
    } catch (err: any) {
      toast(err.message || 'Erreur upload', 'error');
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [commercant?.id, toast]);

  const handleSaveCommerce = async () => {
    setSaving(true);
    try {
      await commercantApi.update({
        nom_enseigne: nomEnseigne,
        telephone,
        adresse,
        ville,
        code_postal: codePostal,
      });
      await refreshUser();
      toast('Informations enregistrées');
    } catch (e: any) { toast(e?.message || 'Erreur', 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveCarte = async () => {
    setSaving(true);
    try {
      await commercantApi.update({
        carte_couleur_primaire: couleur,
        carte_couleur_secondaire: couleurSecondaire,
        carte_programme_nom: programmeNom,
        carte_recompense_description: recompenseDesc,
        points_recompense: pointsRecompense,
        carte_layout: layout,
        texte_perso_bas_carte: texteBasCarte,
        style_texte: styleTexte,
        carte_logo_url: logoUrl,
      });
      await refreshUser();
      toast('Carte mise à jour');
    } catch (e: any) { toast(e?.message || 'Erreur', 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveDesign = async () => {
    setSaving(true);
    try {
      await commercantApi.update({
        card_design: JSON.stringify(cardDesign),
        carte_logo_url: cardDesign.logo_url || undefined,
      });
      await refreshUser();
      toast('Design enregistré avec succès');
    } catch (e: any) { toast(e?.message || 'Erreur', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <DashboardLayout><PageSpinner /></DashboardLayout>;

  return (
    <DashboardLayout>
      <Head><title>Paramètres — Stamply</title></Head>

      <div className="page-header">
        <h1 className="page-title">Paramètres</h1>
        <p className="page-subtitle">Gérez vos informations et personnalisez votre carte</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { id: 'commerce', label: 'Mon commerce', icon: Store },
          { id: 'carte', label: 'Contenu carte', icon: CreditCard },
          { id: 'design', label: 'Design premium', icon: Sparkles },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'commerce' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <Store className="h-4 w-4 text-gray-500" />
              <CardTitle>Informations du commerce</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Input label="Nom de l'enseigne" value={nomEnseigne} onChange={e => setNomEnseigne(e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Téléphone" value={telephone} onChange={e => setTelephone(e.target.value)} />
                <Input label="Email" value={email} disabled />
              </div>
              <Input label="Adresse" value={adresse} onChange={e => setAdresse(e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Ville" value={ville} onChange={e => setVille(e.target.value)} />
                <Input label="Code postal" value={codePostal} onChange={e => setCodePostal(e.target.value)} />
              </div>
              <Button onClick={handleSaveCommerce} loading={saving}>
                <Save className="h-4 w-4" /> Enregistrer
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'carte' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <Settings className="h-4 w-4 text-gray-500" />
                  <CardTitle>Contenu de la carte</CardTitle>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input label="Nom du programme" placeholder="Carte Fidélité" value={programmeNom} onChange={e => setProgrammeNom(e.target.value)} />
                <Input label="Description de la récompense" placeholder="1 café offert" value={recompenseDesc} onChange={e => setRecompenseDesc(e.target.value)} />
                <Input label="Points requis pour la récompense" type="number" min={1} value={pointsRecompense} onChange={e => setPointsRecompense(Number(e.target.value))} />
                <Textarea label="Texte personnalisé (bas de carte)" placeholder="Merci pour votre fidélité !" rows={2} value={texteBasCarte} onChange={e => setTexteBasCarte(e.target.value)} />
                <div>
                  <label className="label">Style du texte</label>
                  <div className="flex gap-2 mt-1">
                    {(['normal', 'gras', 'italique'] as const).map(s => (
                      <button key={s} type="button" onClick={() => setStyleTexte(s)}
                        className={`px-4 py-2 text-sm rounded-lg border-2 capitalize transition-all ${styleTexte === s ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-300 text-gray-600'}`}
                        style={s === 'gras' ? { fontWeight: 'bold' } : s === 'italique' ? { fontStyle: 'italic' } : {}}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>

            <Button onClick={handleSaveCarte} loading={saving} size="lg">
              <Save className="h-4 w-4" /> Enregistrer
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'design' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                <div>
                  <CardTitle>Éditeur de carte premium</CardTitle>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Personnalisez les images, polices et couleurs de votre carte de fidélité.
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

          <div className="flex justify-end">
            <Button onClick={handleSaveDesign} loading={saving} size="lg">
              <Save className="h-4 w-4 mr-2" /> Enregistrer le design
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
