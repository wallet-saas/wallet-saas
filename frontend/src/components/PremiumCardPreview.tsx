/**
 * Stamply Premium Card Preview — Rendu réaliste de la carte de fidélité
 *
 * Deux formats :
 * 1. Google Wallet — portrait 320×480px
 *    Header (15%) : logo rond gauche + nom commerce droite
 *    Zone client (10%) : "CLIENT" + nom à gauche
 *    Zone QR (40%) : QR centré, 60% largeur carte
 *    Hero image (30%) : photo commerçant bas, bords arrondis bas
 *    → Image de fond UNIQUEMENT dans la zone hero (30% bas)
 *    → Couleur/gradient sur le reste (header + client + QR)
 *
 * 2. Apple Wallet — portrait 320×560px
 *    Header (15%) : logo rond gauche + nom commerce + tampons droite
 *    Image pleine carte en fond (background-size: cover)
 *    Zone client (10%) : "MEMBRE" + nom gauche / récompense droite
 *    Zone QR (30%) : QR centré bas
 */

import { QRCodeSVG } from 'qrcode.react';

export type CardFormat = 'google' | 'apple';

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
  format: CardFormat;
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
  sans: false, serif: false, script: true, mono: false,
};

export function PremiumCardPreview({ format, design, data, className = '' }: PremiumCardPreviewProps) {
  const {
    commercantNom = 'Ma Boutique', programmeNom = 'Carte de fidélité',
    clientNom = 'Jean Dupont', tamponsActuels = 7, tamponsPalier = 10,
    recompense = '1 café offert', qrValue = 'stamply://client/test-uuid-1234',
  } = data || {};

  const fontStyle = FONT_MAP[design.font_family] || FONT_MAP.sans;
  const isItalic = FONT_ITALIC[design.font_family] || false;
  const textColor = design.text_color_auto ? '#FFFFFF' : design.text_color;
  const hasBg = !!design.background_image_url;
  const defaultBg = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)';

  let overlayStyle: React.CSSProperties;
  if (design.overlay_type === 'gradient') {
    const dirMap = { horizontal: 'to right', vertical: 'to bottom', diagonal: 'to bottom right' };
    overlayStyle = {
      background: `linear-gradient(${dirMap[design.overlay_gradient_direction]}, ${design.overlay_color}, ${design.overlay_gradient_color2})`,
      opacity: design.overlay_opacity / 100,
    };
  } else {
    overlayStyle = { backgroundColor: design.overlay_color, opacity: design.overlay_opacity / 100 };
  }

  if (format === 'google') {
    return <GoogleWalletCard design={design} data={{ commercantNom, programmeNom, clientNom, tamponsActuels, tamponsPalier, recompense, qrValue }}
      fontStyle={fontStyle} isItalic={isItalic} textColor={textColor}
      overlayStyle={overlayStyle} hasBg={hasBg} defaultBg={defaultBg} className={className} />;
  }

  return <AppleWalletCard design={design} data={{ commercantNom, programmeNom, clientNom, tamponsActuels, tamponsPalier, recompense, qrValue }}
    fontStyle={fontStyle} isItalic={isItalic} textColor={textColor}
    overlayStyle={overlayStyle} hasBg={hasBg} defaultBg={defaultBg} className={className} />;
}

interface CardProps {
  design: CardDesign; data: CardData; fontStyle: string; isItalic: boolean;
  textColor: string; overlayStyle: React.CSSProperties; hasBg: boolean; defaultBg: string; className: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   GOOGLE WALLET — 320×480px portrait
   Image de fond UNIQUEMENT dans la zone hero (30% bas)
   ═══════════════════════════════════════════════════════════════════════════ */

function GoogleWalletCard({ design, data, fontStyle, isItalic, textColor, overlayStyle, hasBg, defaultBg, className }: CardProps) {
  const qrSize = 140;

  return (
    <div className={`flex justify-center ${className}`}>
      <div className="relative w-full max-w-[320px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ aspectRatio: '320 / 480', fontFamily: fontStyle, fontStyle: isItalic ? 'italic' : 'normal', color: textColor }}>

        {/* Fond couleur/gradient sur TOUTE la carte (pas l'image) */}
        <div className="absolute inset-0" style={{ background: defaultBg }} />
        <div className="absolute inset-0" style={overlayStyle} />

        {/* Content */}
        <div className="relative h-full flex flex-col" style={{ padding: '12px' }}>

          {/* Header (15%) — Logo + Nom + Tampons */}
          <div className="flex items-center gap-3" style={{ height: '15%' }}>
            <div className="w-[44px] h-[44px] rounded-full overflow-hidden bg-white/20 backdrop-blur-sm border-2 border-white/40 flex-shrink-0 shadow-lg">
              {design.logo_url ? (
                <img src={design.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/70 text-lg font-bold">
                  {data.commercantNom.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-bold tracking-wide drop-shadow-lg truncate leading-tight">{data.commercantNom}</h3>
              <p className="text-[9px] opacity-70 tracking-[0.15em] uppercase truncate">{data.programmeNom}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="flex items-baseline gap-0.5 drop-shadow-lg">
                <span className="text-[22px] font-bold leading-none">{data.tamponsActuels}</span>
                <span className="text-[12px] opacity-60">/</span>
                <span className="text-[14px] font-semibold opacity-80">{data.tamponsPalier}</span>
              </div>
              <div className="text-[8px] opacity-60 uppercase tracking-wider">tampons</div>
            </div>
          </div>

          {/* Zone client (10%) */}
          <div className="flex items-center" style={{ height: '10%' }}>
            <div>
              <div className="text-[8px] opacity-50 uppercase tracking-wider">Client</div>
              <div className="text-[13px] font-semibold drop-shadow-md truncate">{data.clientNom}</div>
            </div>
          </div>

          {/* Zone QR (40%) — centré */}
          <div className="flex-1 flex items-center justify-center" style={{ height: '40%' }}>
            <div className="bg-white rounded-xl p-2 shadow-xl">
              <QRCodeSVG value={data.qrValue} size={qrSize} level="H" includeMargin={false} bgColor="#FFFFFF" fgColor="#000000" />
            </div>
          </div>

          {/* Hero image (30%) — ICI seulement l'image de fond */}
          <div style={{ height: '30%' }}>
            {hasBg ? (
              <div className="w-full h-full rounded-b-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${design.background_image_url})` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="relative h-full flex items-end p-3">
                  <div className="text-white/90 text-[10px] font-medium drop-shadow">{data.recompense}</div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full rounded-b-2xl bg-white/10 backdrop-blur-sm flex items-end p-3">
                <div className="text-white/80 text-[10px] font-medium">🎁 {data.recompense}</div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   APPLE WALLET — 320×560px portrait
   Image en fond PLEINE CARTE + overlay semi-transparent (max 40%)
   Logo dans le header
   ═══════════════════════════════════════════════════════════════════════════ */

function AppleWalletCard({ design, data, fontStyle, isItalic, textColor, overlayStyle, hasBg, defaultBg, className }: CardProps) {
  const qrSize = 100;

  return (
    <div className={`flex justify-center ${className}`}>
      <div className="relative w-full max-w-[320px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ aspectRatio: '320 / 560', fontFamily: fontStyle, fontStyle: isItalic ? 'italic' : 'normal', color: textColor }}>

        {/* Image de fond pleine carte */}
        {hasBg ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${design.background_image_url})` }} />
        ) : (
          <div className="absolute inset-0" style={{ background: defaultBg }} />
        )}

        {/* Overlay couleur — opacité réduite pour ne pas cacher l'image */}
        {hasBg ? (
          <div className="absolute inset-0" style={{ ...overlayStyle, opacity: Math.min(overlayStyle.opacity as number, 0.4) }} />
        ) : (
          <div className="absolute inset-0" style={overlayStyle} />
        )}

        {/* Gradient sombre en haut pour lisibilité header */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/40" />

        {/* Content */}
        <div className="relative h-full flex flex-col" style={{ padding: '14px' }}>

          {/* Header (15%) — Logo + Nom commerce + Tampons */}
          <div className="flex items-center gap-3" style={{ height: '15%' }}>
            <div className="w-[40px] h-[40px] rounded-full overflow-hidden bg-white/20 backdrop-blur-sm border-2 border-white/40 flex-shrink-0 shadow-lg">
              {design.logo_url ? (
                <img src={design.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/70 text-base font-bold">
                  {data.commercantNom.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[16px] font-bold tracking-wide drop-shadow-lg truncate leading-tight">{data.commercantNom}</h3>
              <p className="text-[9px] opacity-70 tracking-[0.15em] uppercase truncate">{data.programmeNom}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="flex items-baseline gap-0.5 drop-shadow-lg">
                <span className="text-[24px] font-bold leading-none">{data.tamponsActuels}</span>
                <span className="text-[12px] opacity-60">/</span>
                <span className="text-[15px] font-semibold opacity-80">{data.tamponsPalier}</span>
              </div>
              <div className="text-[8px] opacity-60 uppercase tracking-wider">tampons</div>
            </div>
          </div>

          {/* Spacer — image de fond visible */}
          <div className="flex-1" />

          {/* Zone client (10%) — MEMBRE + nom gauche / récompense droite */}
          <div className="flex items-end justify-between" style={{ height: '10%' }}>
            <div>
              <div className="text-[8px] opacity-50 uppercase tracking-wider">Membre</div>
              <div className="text-[13px] font-semibold drop-shadow-md truncate max-w-[180px]">{data.clientNom}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[8px] opacity-50 uppercase tracking-wider">Récompense</div>
              <div className="text-[11px] font-semibold drop-shadow-md">{data.recompense}</div>
            </div>
          </div>

          {/* Zone QR (30%) — QR centré en bas */}
          <div className="flex items-center justify-center" style={{ height: '30%' }}>
            <div className="bg-white rounded-xl p-2 shadow-xl">
              <QRCodeSVG value={data.qrValue} size={qrSize} level="H" includeMargin={false} bgColor="#FFFFFF" fgColor="#000000" />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

export default PremiumCardPreview;
