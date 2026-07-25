import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { commercantApi, carteTypeApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { CardEditor, CardDesign, DEFAULT_CARD_DESIGN, CardProgramData, DEFAULT_CARD_DATA } from '@/components/CardEditor';
import { PremiumCardPreview } from '@/components/PremiumCardPreview';
import { uploadCardImage } from '@/lib/cardUpload';
import { Store, Save, Sparkles, Gift } from 'lucide-react';
import { LoyaltyTypeGrid, LoyaltyTypeConfigFields, ChangeTypeConfirmModal, scanHint, typeLabel } from '@/components/LoyaltyTypeSelector';
import { useAutoSave, SaveIndicator } from '@/hooks/useAutoSave';

export default function ParametresPage() {
  const { commercant, refreshUser } = useAuth();
  const { show: toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'commerce' | 'design'>('commerce');

  // Commerce fields
  const [nomEnseigne, setNomEnseigne] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [email, setEmail] = useState('');

  // Programme de fidélité (modifiable à tout moment)
  const [carteType, setCarteType] = useState<string>('tampons');
  const [typeConfig, setTypeConfig] = useState<Record<string, any>>({});
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [changingType, setChangingType] = useState(false);
  const setCfg = (key: string, value: any) => setTypeConfig(prev => ({ ...prev, [key]: value }));

  // Premium card design
  const [cardDesign, setCardDesign] = useState<CardDesign>(DEFAULT_CARD_DESIGN);
  const [cardData, setCardData] = useState<CardProgramData>({
    ...DEFAULT_CARD_DATA,
    commercantNom: commercant?.nom_enseigne || DEFAULT_CARD_DATA.commercantNom,
    programmeNom: commercant?.carte_programme_nom || DEFAULT_CARD_DATA.programmeNom,
    recompense: commercant?.carte_recompense_description || DEFAULT_CARD_DATA.recompense,
    tamponsPalier: commercant?.points_recompense || DEFAULT_CARD_DATA.tamponsPalier,
  });

  useEffect(() => {
    if (commercant) {
      setNomEnseigne(commercant.nom_enseigne || '');
      setTelephone(commercant.telephone || '');
      setAdresse(commercant.adresse || '');
      setVille(commercant.ville || '');
      setCodePostal(commercant.code_postal || '');
      setEmail(commercant.email || '');

      // Load premium card design if exists
      if ((commercant as any).card_design) {
        try {
          const parsed = JSON.parse((commercant as any).card_design);
          setCardDesign({ ...DEFAULT_CARD_DESIGN, ...parsed });
        } catch {
          // Keep defaults
        }
      }

      // Programme de fidélité enregistré
      setCarteType((commercant as any).carte_type || 'tampons');
      setTypeConfig((commercant as any).carte_type_config || {});

      // Sync card data from commercant
      setCardData({
        commercantNom: commercant.nom_enseigne || DEFAULT_CARD_DATA.commercantNom,
        programmeNom: commercant.carte_programme_nom || DEFAULT_CARD_DATA.programmeNom,
        clientNom: DEFAULT_CARD_DATA.clientNom,
        tamponsActuels: DEFAULT_CARD_DATA.tamponsActuels,
        tamponsPalier: commercant.points_recompense || DEFAULT_CARD_DATA.tamponsPalier,
        recompense: commercant.carte_recompense_description || DEFAULT_CARD_DATA.recompense,
      });

      setLoading(false);
    }
  }, [commercant]);

  const handleAutoSaveCommerce = async () => {
    await commercantApi.update({
      nom_enseigne: nomEnseigne,
      telephone,
      adresse,
      ville,
      code_postal: codePostal,
    });
    await refreshUser();
  };

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
  };

  // Changer de type = remise à zéro des compteurs : passe par une confirmation
  const handleSelectType = (t: string) => {
    if (t === carteType) return;
    setPendingType(t);
  };

  const handleConfirmChangeType = async () => {
    if (!pendingType) return;
    setChangingType(true);
    try {
      const res = await carteTypeApi.change(pendingType, typeConfig);
      setCarteType(pendingType);
      setPendingType(null);
      await refreshUser();
      toast(
        res.cartes_reinitialisees > 0
          ? `Programme changé — ${res.cartes_reinitialisees} carte(s) remise(s) à zéro.`
          : 'Programme de fidélité mis à jour.',
        'success'
      );
    } catch (e: any) {
      toast(e?.message || 'Erreur lors du changement de programme', 'error');
    } finally {
      setChangingType(false);
    }
  };

  // La config du type s'enregistre seule (sans remise à zéro)
  const handleAutoSaveTypeConfig = async () => {
    await commercantApi.update({ carte_type_config: typeConfig } as any);
    await refreshUser();
  };

  const handleSaveDesign = async () => {
    try {
      await commercantApi.update({
        card_design: JSON.stringify(cardDesign),
        carte_logo_url: cardDesign.logo_url || undefined,
        carte_programme_nom: cardData.programmeNom,
        carte_recompense_description: cardData.recompense,
        points_recompense: cardData.tamponsPalier,
        nom_enseigne: cardData.commercantNom,
      });
      await refreshUser();
      toast('Design enregistré avec succès');
    } catch (e: any) { toast(e?.message || 'Erreur', 'error'); }
  };

  const handleAutoSaveDesign = async () => {
    await commercantApi.update({
      card_design: JSON.stringify(cardDesign),
      carte_logo_url: cardDesign.logo_url || undefined,
      carte_programme_nom: cardData.programmeNom,
      carte_recompense_description: cardData.recompense,
      points_recompense: cardData.tamponsPalier,
      nom_enseigne: cardData.commercantNom,
    });
    await refreshUser();
  };

  const { status: saveStatusCommerce } = useAutoSave({
    data: { nomEnseigne, telephone, adresse, ville, codePostal },
    onSave: handleAutoSaveCommerce,
    debounceMs: 800,
  });

  const { status: saveStatusTypeConfig } = useAutoSave({
    data: { typeConfig },
    onSave: handleAutoSaveTypeConfig,
    debounceMs: 900,
  });

  const { status: saveStatusDesign } = useAutoSave({
    data: { cardDesign, cardData },
    onSave: handleAutoSaveDesign,
    debounceMs: 800,
  });

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
              <div className="flex items-center">
                <SaveIndicator status={saveStatusCommerce} />
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'design' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <Gift className="h-4 w-4 text-indigo-500" />
                <div>
                  <CardTitle>Programme de fidélité</CardTitle>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Programme actuel : <strong>{typeLabel(carteType)}</strong>. Le design de la carte et le
                    scan en caisse s'adaptent automatiquement.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <LoyaltyTypeGrid type={carteType} onSelectType={handleSelectType} disabled={changingType} />

                <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-xs text-gray-600">
                  {scanHint(carteType)}
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-900 mb-3">Réglages du programme</p>
                  <LoyaltyTypeConfigFields type={carteType} config={typeConfig} setCfg={setCfg} />
                </div>

                <div className="flex items-center justify-end">
                  <SaveIndicator status={saveStatusTypeConfig} />
                </div>
              </div>
            </CardBody>
          </Card>

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
                cardData={{ ...cardData, carteType, typeConfig } as any}
                onCardDataChange={setCardData}
                onImageUpload={handleImageUpload}
                isUploading={isUploading}
              />
            </CardBody>
          </Card>

          <div className="flex justify-end">
            <div className="flex items-center">
              <SaveIndicator status={saveStatusDesign} />
            </div>
          </div>
        </div>
      )}

      {pendingType && (
        <ChangeTypeConfirmModal
          fromType={carteType}
          toType={pendingType}
          loading={changingType}
          onCancel={() => setPendingType(null)}
          onConfirm={handleConfirmChangeType}
        />
      )}
    </DashboardLayout>
  );
}
