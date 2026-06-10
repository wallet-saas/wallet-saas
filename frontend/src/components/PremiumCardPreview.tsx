/**
 * Stamply Premium Card Preview — Rendu réaliste de la carte de fidélité
 * 
 * Affiche la carte avec :
 * - Image de fond + overlay
 * - Logo en haut à gauche
 * - Nom du commerce en haut
 * - Points en haut à droite
 * - QR code centré
 * - Nom du client en bas à gauche
 * - Niveau en bas à droite
 */

import { QRCodeSVG } from 'qrcode.react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CardDesign {
  background_image_url: string;
  logo_url: string;
  font_family: 'sans' | 'serif' | 'script' | 'mono';
  text_color: string;
  text_color_auto: boolean;
  tier_name: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  tier_color: string;
  overlay_opacity: number;
  overlay_color: string;
}

interface PremiumCardPreviewProps {
  design: CardDesign;
  clientName?: string;
  points?: number;
  qrValue?: string;
  className?: string;
}

const FONT_MAP = {
  sans: 'font-sans',
  serif: 'font-serif',
  script: 'font-serif italic',
  mono: 'font-mono',
};

const TIER_BADGE_STYLES = {
  Bronze: { bg: 'bg-gradient-to-br from-amber-600 to-amber-800', text: 'text-amber-100', border: 'border-amber-500' },
  Silver: { bg: 'bg-gradient-to-br from-gray-300 to-gray-500', text: 'text-gray-800', border: 'border-gray-400' },
  Gold: { bg: 'bg-gradient-to-br from-yellow-400 to-amber-600', text: 'text-yellow-900', border: 'border-yellow-500' },
  Platinum: { bg: 'bg-gradient-to-br from-slate-200 to-slate-400', text: 'text-slate-800', border: 'border-slate-300' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function PremiumCardPreview({
  design,
  clientName: clientNameProp = 'Jean Dupont',
  points = 42,
  qrValue = 'stamply://client/test-uuid-1234',
  className = '',
}: PremiumCardPreviewProps) {
  const fontClass = FONT_MAP[design.font_family];
  const tierStyle = TIER_BADGE_STYLES[design.tier_name];
  const textColor = design.text_color_auto ? '#FFFFFF' : design.text_color;

  return (
    <div className={`flex justify-center ${className}`}>
      {/* Card Container — Credit card proportions (85.6mm × 53.98mm ≈ 1.6:1) */}
      <div
        className={`relative w-full max-w-[420px] aspect-[1.6/1] rounded-2xl overflow-hidden shadow-2xl ${fontClass}`}
        style={{ color: textColor }}
      >
        {/* ── Background Image ─────────────────────────────────────────── */}
        {design.background_image_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${design.background_image_url})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />
        )}

        {/* ── Overlay ──────────────────────────────────────────────────── */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: design.overlay_color,
            opacity: design.overlay_opacity / 100,
          }}
        />

        {/* ── Glassmorphism subtle effect ───────────────────────────────── */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20" />

        {/* ── Card Content ─────────────────────────────────────────────── */}
        <div className="relative h-full flex flex-col p-4 sm:p-5">
          
          {/* Row 1: Logo + Commerce Name + Points */}
          <div className="flex items-start justify-between">
            {/* Logo */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-white/20 backdrop-blur-sm border border-white/30 flex-shrink-0">
              {design.logo_url ? (
                <img src={design.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/60 text-lg font-bold">
                  S
                </div>
              )}
            </div>

            {/* Commerce Name — centered top */}
            <div className="flex-1 text-center px-2">
              <h3 className="text-base sm:text-lg font-bold tracking-wide drop-shadow-lg truncate">
                Ma Boutique
              </h3>
              <p className="text-[10px] sm:text-xs opacity-70 tracking-widest uppercase">
                Carte de fidélité
              </p>
            </div>

            {/* Points */}
            <div className="text-right flex-shrink-0">
              <div className="text-xl sm:text-2xl font-bold drop-shadow-lg">{points}</div>
              <div className="text-[10px] sm:text-xs opacity-70 uppercase tracking-wider">points</div>
            </div>
          </div>

          {/* Row 2: QR Code — centered */}
          <div className="flex-1 flex items-center justify-center py-2">
            <div className="bg-white rounded-xl p-2 sm:p-2.5 shadow-lg">
              <QRCodeSVG
                value={qrValue}
                size={90}
                level="H"
                includeMargin={false}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
          </div>

          {/* Row 3: Client Name + Tier */}
          <div className="flex items-end justify-between">
            {/* Client Name */}
            <div>
              <div className="text-[10px] sm:text-xs opacity-60 uppercase tracking-wider mb-0.5">Client</div>
              <div className="text-sm sm:text-base font-semibold drop-shadow-md truncate max-w-[160px]">
                {clientNameProp}
              </div>
            </div>

            {/* Tier Badge */}
            <div
              className={`px-3 py-1.5 rounded-full border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border} shadow-lg`}
            >
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="text-xs sm:text-sm font-bold">{design.tier_name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Shine effect ─────────────────────────────────────────────── */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

export default PremiumCardPreview;
