/**
 * Stamply Card Editor — Éditeur visuel de carte de fidélité premium
 * 
 * Permet au commerçant de personnaliser sa carte avec :
 * - Image de fond (upload)
 * - Logo (upload)
 * - Police d'écriture (4 choix)
 * - Couleur du texte
 * - Overlay personnalisable (couleur unie OU dégradé + direction + opacité)
 * - Aperçu en temps réel avec données réelles (nom, tampons, récompense)
 * - Warning limitations Google Wallet
 */

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, Type, Palette, AlertTriangle, ChevronDown } from 'lucide-react';
import { PremiumCardPreview, CardFormat } from '@/components/PremiumCardPreview';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CardDesign {
  // Images
  background_image_url: string;
  logo_url: string;
  
  // Texte
  font_family: 'sans' | 'serif' | 'script' | 'mono';
  text_color: string;
  text_color_auto: boolean;
  
  // Overlay
  overlay_opacity: number;
  overlay_color: string;
  overlay_type: 'solid' | 'gradient';
  overlay_gradient_color2: string;
  overlay_gradient_direction: 'horizontal' | 'vertical' | 'diagonal';
}

export interface CardProgramData {
  commercantNom: string;
  programmeNom: string;
  clientNom: string;
  tamponsActuels: number;
  tamponsPalier: number;
  recompense: string;
}

export const DEFAULT_CARD_DESIGN: CardDesign = {
  background_image_url: '',
  logo_url: '',
  font_family: 'sans',
  text_color: '#FFFFFF',
  text_color_auto: true,
  overlay_opacity: 40,
  overlay_color: '#000000',
  overlay_type: 'solid',
  overlay_gradient_color2: '#1a1a2e',
  overlay_gradient_direction: 'diagonal',
};

export const DEFAULT_CARD_DATA: CardProgramData = {
  commercantNom: 'Ma Boutique',
  programmeNom: 'Carte de fidélité',
  clientNom: 'Jean Dupont',
  tamponsActuels: 7,
  tamponsPalier: 10,
  recompense: '1 café offert',
};

export const FONT_OPTIONS = [
  { value: 'sans', label: 'Moderne', className: 'font-sans' },
  { value: 'serif', label: 'Classique', className: 'font-serif' },
  { value: 'script', label: 'Élégant', className: 'font-serif italic' },
  { value: 'mono', label: 'Techno', className: 'font-mono' },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

interface CardEditorProps {
  design: CardDesign;
  onChange: (design: CardDesign) => void;
  cardData: CardProgramData;
  onCardDataChange: (data: CardProgramData) => void;
  onImageUpload: (file: File, type: 'background' | 'logo') => Promise<string>;
  isUploading?: boolean;
  readOnly?: boolean;
}

export function CardEditor({ design, onChange, cardData, onCardDataChange, onImageUpload, isUploading, readOnly }: CardEditorProps) {
  const bgInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<string>('images');
  const [previewFormat, setPreviewFormat] = useState<CardFormat>('google');
  const [showGWWarning, setShowGWWarning] = useState(false);

  const update = useCallback((partial: Partial<CardDesign>) => {
    onChange({ ...design, ...partial });
  }, [design, onChange]);

  const updateData = useCallback((partial: Partial<CardProgramData>) => {
    onCardDataChange({ ...cardData, ...partial });
  }, [cardData, onCardDataChange]);

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await onImageUpload(file, 'background');
      update({ background_image_url: url });
    } catch (err) {
      console.error('Erreur upload fond:', err);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await onImageUpload(file, 'logo');
      update({ logo_url: url });
    } catch (err) {
      console.error('Erreur upload logo:', err);
    }
  };

  // Check if GW limitations apply
  const hasGWLimitations = design.overlay_type === 'gradient' || design.background_image_url !== '';

  const sections = [
    { id: 'images', label: 'Images', icon: Image },
    { id: 'text', label: 'Texte', icon: Type },
    { id: 'overlay', label: 'Overlay', icon: Palette },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* ── Panneau d'édition (3/5) ──────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeSection === id
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Section: Images */}
        {activeSection === 'images' && (
          <div className="space-y-4 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            {/* Background Image */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Image de fond
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Photo qui couvre toute la carte. Format recommandé : 1200×750px.
              </p>
              <div
                onClick={() => !readOnly && bgInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all hover:border-indigo-400 ${
                  design.background_image_url ? 'border-indigo-300' : 'border-gray-300 dark:border-gray-600'
                } ${readOnly ? 'cursor-default' : ''}`}
              >
                {design.background_image_url ? (
                  <div className="relative aspect-[16/10]">
                    <img src={design.background_image_url} alt="Fond carte" className="w-full h-full object-cover" />
                    {!readOnly && (
                      <button
                        onClick={(e) => { e.stopPropagation(); update({ background_image_url: '' }); }}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">Cliquez pour uploader</span>
                    <span className="text-xs mt-1">JPG, PNG, WebP — Max 5MB</span>
                  </div>
                )}
              </div>
              <input ref={bgInputRef} type="file" accept="image/*" onChange={handleBgUpload} className="hidden" disabled={readOnly} />
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Logo du commerce
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Affiché en haut à gauche. Format carré recommandé.
              </p>
              <div className="flex items-center gap-4">
                <div
                  onClick={() => !readOnly && logoInputRef.current?.click()}
                  className={`relative w-20 h-20 border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all hover:border-indigo-400 flex-shrink-0 ${
                    design.logo_url ? 'border-indigo-300' : 'border-gray-300 dark:border-gray-600'
                  } ${readOnly ? 'cursor-default' : ''}`}
                >
                  {design.logo_url ? (
                    <img src={design.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <Image className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  {design.logo_url && !readOnly && (
                    <button onClick={() => update({ logo_url: '' })} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                      <X className="w-3 h-3" /> Supprimer
                    </button>
                  )}
                </div>
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={readOnly} />
            </div>
          </div>
        )}

        {/* Section: Texte */}
        {activeSection === 'text' && (
          <div className="space-y-4 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            {/* Police */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Police d'écriture
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => !readOnly && update({ font_family: font.value })}
                    className={`px-4 py-3 rounded-lg border-2 text-sm transition-all ${
                      design.font_family === font.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    } ${readOnly ? 'cursor-default' : ''}`}
                  >
                    <span className={font.className}>{font.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Couleur texte */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Couleur du texte
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={design.text_color}
                  onChange={(e) => !readOnly && update({ text_color: e.target.value, text_color_auto: false })}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                  disabled={readOnly}
                />
                <span className="text-sm text-gray-500 font-mono">{design.text_color}</span>
                <div className="flex gap-1.5 ml-auto">
                  {['#FFFFFF', '#000000', '#FFD700', '#FF6B6B', '#4ECDC4'].map((color) => (
                    <button
                      key={color}
                      onClick={() => !readOnly && update({ text_color: color, text_color_auto: false })}
                      className={`w-7 h-7 rounded-md border-2 transition-all ${
                        design.text_color === color && !design.text_color_auto
                          ? 'border-indigo-500 scale-110'
                          : 'border-gray-200 dark:border-gray-600 hover:scale-105'
                      } ${readOnly ? 'cursor-default' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={design.text_color_auto}
                  onChange={(e) => !readOnly && update({ text_color_auto: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  disabled={readOnly}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Auto-détecter clair/foncé selon le fond
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Section: Overlay */}
        {activeSection === 'overlay' && (
          <div className="space-y-4 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Type de fond
              </label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => !readOnly && update({ overlay_type: 'solid' })}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    design.overlay_type === 'solid'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  } ${readOnly ? 'cursor-default' : ''}`}
                >
                  🎨 Couleur unie
                </button>
                <button
                  onClick={() => !readOnly && update({ overlay_type: 'gradient' })}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    design.overlay_type === 'gradient'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  } ${readOnly ? 'cursor-default' : ''}`}
                >
                  🌈 Dégradé
                </button>
              </div>

              {/* Couleur 1 */}
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Couleur 1</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={design.overlay_color}
                    onChange={(e) => !readOnly && update({ overlay_color: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    disabled={readOnly}
                  />
                  <span className="text-sm text-gray-500 font-mono">{design.overlay_color}</span>
                </div>
              </div>

              {/* Couleur 2 (gradient only) */}
              {design.overlay_type === 'gradient' && (
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Couleur 2</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={design.overlay_gradient_color2}
                      onChange={(e) => !readOnly && update({ overlay_gradient_color2: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                      disabled={readOnly}
                    />
                    <span className="text-sm text-gray-500 font-mono">{design.overlay_gradient_color2}</span>
                  </div>
                </div>
              )}

              {/* Direction (gradient only) */}
              {design.overlay_type === 'gradient' && (
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Direction du dégradé</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 'horizontal', label: '→ Horizontal' },
                      { value: 'vertical', label: '↓ Vertical' },
                      { value: 'diagonal', label: '↘ Diagonal' },
                    ] as const).map((dir) => (
                      <button
                        key={dir.value}
                        onClick={() => !readOnly && update({ overlay_gradient_direction: dir.value })}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          design.overlay_gradient_direction === dir.value
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700'
                            : 'border-gray-200 dark:border-gray-600 text-gray-600'
                        } ${readOnly ? 'cursor-default' : ''}`}
                      >
                        {dir.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Opacity */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Opacité</span>
                  <span>{design.overlay_opacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={design.overlay_opacity}
                  onChange={(e) => !readOnly && update({ overlay_opacity: parseInt(e.target.value) })}
                  className="w-full accent-indigo-600"
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>
        )}

        {/* Google Wallet Warning */}
        {hasGWLimitations && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Limites Google Wallet</p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                  {design.overlay_type === 'gradient' && "Les dégradés ne sont pas supportés par Google Wallet (couleur unie uniquement). "}
                  {design.background_image_url && "L'image de fond sera envoyée via le champ heroImage mais l'affichage peut varier. "}
                  Apple Wallet supporte toutes ces options.
                </p>
              </div>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            Upload en cours...
          </div>
        )}
      </div>

      {/* ── Aperçu en temps réel (2/5) ────────────────────────────────── */}
      <div className="lg:col-span-3 lg:sticky lg:top-4 lg:self-start space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Aperçu en temps réel
          </div>
          {/* Format toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setPreviewFormat('google')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                previewFormat === 'google'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              Google Wallet
            </button>
            <button
              onClick={() => setPreviewFormat('apple')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                previewFormat === 'apple'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              Apple Wallet
            </button>
          </div>
        </div>
        <PremiumCardPreview format={previewFormat} design={design} data={cardData} />

        {/* Données de la carte — modifiables */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Données affichées sur la carte
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nom du commerce</label>
              <input
                type="text"
                value={cardData.commercantNom}
                onChange={(e) => !readOnly && updateData({ commercantNom: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nom du programme</label>
              <input
                type="text"
                value={cardData.programmeNom}
                onChange={(e) => !readOnly && updateData({ programmeNom: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nom du client (exemple)</label>
              <input
                type="text"
                value={cardData.clientNom}
                onChange={(e) => !readOnly && updateData({ clientNom: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Récompense</label>
              <input
                type="text"
                value={cardData.recompense}
                onChange={(e) => !readOnly && updateData({ recompense: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tampons actuels</label>
              <input
                type="number"
                min={0}
                value={cardData.tamponsActuels}
                onChange={(e) => !readOnly && updateData({ tamponsActuels: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Palier (tampons requis)</label>
              <input
                type="number"
                min={1}
                value={cardData.tamponsPalier}
                onChange={(e) => !readOnly && updateData({ tamponsPalier: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200"
                disabled={readOnly}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
