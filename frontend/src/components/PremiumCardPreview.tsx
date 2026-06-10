/**
 * Stamply Premium Card Preview — Rendu réaliste de la carte de fidélité
 * 
 * Format premium (ratio 16:9, ~800×500px)
 * - Image de fond en cover sur toute la carte
 * - Logo haut gauche ~60×60px
 * - Nom commerce + programme haut centre
 * - QR code centré, GRAND (~200×200px) — élément principal
 * - Tampons (7/10) haut droite
 * - Nom client bas gauche
 * - Récompense bas droite
 */

import { QRCodeSVG } from 'qrcode.react';

interface CardDesign {
  background_image_url: string;
  logo_url: string;
  font_family: 'sans' | 'serif' | 'script' | 'mono';
  text_color: string;
  text_color_auto: boolean;
  overlay_opacity: number;
  overlay_color: string;
  overlay_type: 'solid' | 'gradient';
  overlay_gradient_color2: string;
  overlay_gradient_direction: 'horizontal' | 'vertical' | 'diagonal';
}

interface CardData {
  commercantNom: string;
  programmeNom: string;
  clientNom: string;
  tamponsActuels: number;
  tamponsPalier: number;
  recompense: string;
  qrValue: string;
}

interface PremiumCardPreviewProps {
  design: CardDesign;
  data?: Partial<CardData>;
  className?: string;
}

const FONT_MAP: Record<string, string> = {
  sans: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
  serif: 'ui-serif, Georgia, Cambria, serif',
  script: 'ui-serif, Georgia, Cambria, serif',
  mono: 'ui-monospace, SFMono-Regular, monospace',
};

const FONT_ITALIC: Record<string, boolean> = {
  sans: false,
  serif: false,
  script: true,
  mono: false,
};

export function PremiumCardPreview({
  design,
  data,
  className = '',
}: PremiumCardPreviewProps) {
  const {
    commercantNom = 'Ma Boutique',
    programmeNom = 'Carte de fidélité',
    clientNom = 'Jean Dupont',
    tamponsActuels = 7,
    tamponsPalier = 10,
    recompense = '1 café offert',
    qrValue = 'stamply://client/test-uuid-1234',
  } = data || {};

  const fontStyle = FONT_MAP[design.font_family] || FONT_MAP.sans;
  const isItalic = FONT_ITALIC[design.font_family] || false;
  const textColor = design.text_color_auto ? '#FFFFFF' : design.text_color;

  // Overlay style
  let overlayStyle: React.CSSProperties;
  if (design.overlay_type === 'gradient') {
    const dirMap = {
      horizontal: 'to right',
      vertical: 'to bottom',
      diagonal: 'to bottom right',
    };
    overlayStyle = {
      background: `linear-gradient(${dirMap[design.overlay_gradient_direction]}, ${design.overlay_color}, ${design.overlay_gradient_color2})`,
      opacity: design.overlay_opacity / 100,
    };
  } else {
    overlayStyle = {
      backgroundColor: design.overlay_color,
      opacity: design.overlay_opacity / 100,
    };
  }

  return (
    <div className={`flex justify-center ${className}`}>
      {/* Card — ratio 16:9 premium */}
      <div
        className="relative w-full max-w-[800px] rounded-2xl overflow-hidden shadow-2xl"
        style={{
          aspectRatio: '16 / 9',
          fontFamily: fontStyle,
          fontStyle: isItalic ? 'italic' : 'normal',
          color: textColor,
        }}
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
        <div className="absolute inset-0" style={overlayStyle} />

        {/* ── Subtle glass effect ───────────────────────────────────────── */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10" />

        {/* ── Card Content ─────────────────────────────────────────────── */}
        <div className="relative h-full flex flex-col p-5 sm:p-7">
          
          {/* Row 1: Logo + Commerce Name + Tampons */}
          <div className="flex items-start justify-between gap-4">
            {/* Logo ~60×60 */}
            <div className="w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] rounded-xl overflow-hidden bg-white/20 backdrop-blur-sm border border-white/30 flex-shrink-0 shadow-lg">
              {design.logo_url ? (
                <img src={design.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/60 text-xl font-bold">
                  {commercantNom.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Commerce Name — centered top */}
            <div className="flex-1 text-center min-w-0 pt-1">
              <h3 className="text-xl sm:text-2xl font-bold tracking-wide drop-shadow-lg truncate">
                {commercantNom}
              </h3>
              <p className="text-[10px] sm:text-xs opacity-70 tracking-[0.2em] uppercase mt-1">
                {programmeNom}
              </p>
            </div>

            {/* Tampons */}
            <div className="text-right flex-shrink-0 pt-1">
              <div className="flex items-baseline gap-0.5 drop-shadow-lg">
                <span className="text-3xl sm:text-4xl font-bold">{tamponsActuels}</span>
                <span className="text-base sm:text-lg opacity-60">/</span>
                <span className="text-xl sm:text-2xl font-semibold opacity-80">{tamponsPalier}</span>
              </div>
              <div className="text-[10px] sm:text-xs opacity-60 uppercase tracking-wider">tampons</div>
            </div>
          </div>

          {/* Row 2: QR Code — centered, GRAND (~200px) */}
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-xl">
              <QRCodeSVG
                value={qrValue}
                size={120}
                level="H"
                includeMargin={false}
                bgColor="#FFFFFF"
                fgColor="#000000"
                className="w-[120px] h-[120px] sm:w-[180px] sm:h-[180px]"
              />
            </div>
          </div>

          {/* Row 3: Client Name + Récompense */}
          <div className="flex items-end justify-between gap-4">
            {/* Client Name */}
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs opacity-50 uppercase tracking-wider mb-0.5">Client</div>
              <div className="text-sm sm:text-lg font-semibold drop-shadow-md truncate max-w-[250px]">
                {clientNom}
              </div>
            </div>

            {/* Récompense */}
            <div className="text-right flex-shrink-0">
              <div className="text-[10px] sm:text-xs opacity-50 uppercase tracking-wider mb-0.5">Récompense</div>
              <div className="text-xs sm:text-base font-semibold drop-shadow-md">
                {recompense}
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
