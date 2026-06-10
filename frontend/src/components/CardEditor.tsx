/**
 * Stamply Card Editor — Éditeur visuel de carte de fidélité premium
 * 
 * Permet au commerçant de personnaliser sa carte avec :
 * - Image de fond (upload)
 * - Logo (upload)
 * - Police d'écriture (4 choix)
 * - Couleur du texte
 * - Niveau/statut couleurs (Bronze/Silver/Gold/Platinum)
 * - Aperçu en temps réel
 */

import { useState, useRef, useCallback } from 'react';
import { Upload, X, RotateCcw, Type, Palette, Image, Star, ChevronDown } from 'lucide-react';
import { PremiumCardPreview } from './PremiumCardPreview';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CardDesign {
  // Images
  background_image_url: string;
  logo_url: string;
  
  // Texte
  font_family: 'sans' | 'serif' | 'script' | 'mono';
  text_color: string;
  text_color_auto: boolean; // auto-detect light/dark based on background
  
  // Niveau
  tier_name: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  tier_color: string;
  
  // Overlay
  overlay_opacity: number; // 0-100
  overlay_color: string;
}

export const DEFAULT_CARD_DESIGN: CardDesign = {
  background_image_url: '',
  logo_url: '',
  font_family: 'sans',
  text_color: '#FFFFFF',
  text_color_auto: true,
  tier_name: 'Gold',
  tier_color: '#FFD700',
  overlay_opacity: 40,
  overlay_color: '#000000',
};

export const TIER_PRESETS = {
  Bronze: { name: 'Bronze', color: '#CD7F32', gradient: 'from-amber-700 to-amber-900' },
  Silver: { name: 'Silver', color: '#C0C0C0', gradient: 'from-gray-300 to-gray-500' },
  Gold: { name: 'Gold', color: '#FFD700', gradient: 'from-yellow-400 to-amber-600' },
  Platinum: { name: 'Platinum', color: '#E5E4E2', gradient: 'from-slate-200 to-slate-400' },
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
  onImageUpload: (file: File, type: 'background' | 'logo') => Promise<string>;
  isUploading?: boolean;
  readOnly?: boolean;
}

export function CardEditor({ design, onChange, onImageUpload, isUploading, readOnly }: CardEditorProps) {
  const bgInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<string>('images');

  const update = useCallback((partial: Partial<CardDesign>) => {
    onChange({ ...design, ...partial });
  }, [design, onChange]);

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

  const sections = [
    { id: 'images', label: 'Images', icon: Image },
    { id: 'text', label: 'Texte', icon: Type },
    { id: 'tier', label: 'Niveau', icon: Star },
    { id: 'overlay', label: 'Overlay', icon: Palette },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Panneau d'édition ─────────────────────────────────────────────── */}
      <div className="space-y-4">
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
                    <img
                      src={design.background_image_url}
                      alt="Fond carte"
                      className="w-full h-full object-cover"
                    />
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
              <input
                ref={bgInputRef}
                type="file"
                accept="image/*"
                onChange={handleBgUpload}
                className="hidden"
                disabled={readOnly}
              />
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Logo du commerce
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Affiché en haut à gauche de la carte. Format carré recommandé.
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
                    <button
                      onClick={() => update({ logo_url: '' })}
                      className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Supprimer
                    </button>
                  )}
                </div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={readOnly}
              />
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
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={design.text_color}
                    onChange={(e) => !readOnly && update({ text_color: e.target.value, text_color_auto: false })}
                    className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    disabled={readOnly}
                  />
                  <span className="text-sm text-gray-500 font-mono">{design.text_color}</span>
                </div>
                <div className="flex gap-1.5">
                  {['#FFFFFF', '#000000', '#FFD700', '#FF6B6B', '#4ECDC4'].map((color) => (
                    <button
                      key={color}
                      onClick={() => !readOnly && update({ text_color: color, text_color_auto: false })}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${
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

        {/* Section: Niveau */}
        {activeSection === 'tier' && (
          <div className="space-y-4 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Niveau par défaut
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Le niveau affiché sur la carte du client.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(TIER_PRESETS) as Array<keyof typeof TIER_PRESETS>).map((tier) => {
                  const preset = TIER_PRESETS[tier];
                  return (
                    <button
                      key={tier}
                      onClick={() => !readOnly && update({ tier_name: tier, tier_color: preset.color })}
                      className={`px-4 py-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                        design.tier_name === tier
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      } ${readOnly ? 'cursor-default' : ''}`}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: preset.color }}
                      >
                        {preset.name[0]}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{preset.name}</div>
                        <div className="text-xs text-gray-500">{preset.color}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Section: Overlay */}
        {activeSection === 'overlay' && (
          <div className="space-y-4 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Overlay (lisibilité)
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Assombrit légèrement le fond pour améliorer la lisibilité du texte.
              </p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Opacité</span>
                    <span>{design.overlay_opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={design.overlay_opacity}
                    onChange={(e) => !readOnly && update({ overlay_opacity: parseInt(e.target.value) })}
                    className="w-full accent-indigo-600"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Couleur de l'overlay</label>
                  <div className="flex gap-2">
                    {['#000000', '#1a1a2e', '#16213e', '#0f3460', '#533483'].map((color) => (
                      <button
                        key={color}
                        onClick={() => !readOnly && update({ overlay_color: color })}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          design.overlay_color === color
                            ? 'border-indigo-500 scale-110'
                            : 'border-gray-200 dark:border-gray-600'
                        } ${readOnly ? 'cursor-default' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
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

      {/* ── Aperçu en temps réel ──────────────────────────────────────────── */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Aperçu en temps réel
        </div>
        <PremiumCardPreview design={design} />
      </div>
    </div>
  );
}
