/**
 * Stamply Premium Card Preview — Rendu realiste de la carte de fidelite.
 *
 * Le design CHANGE selon le programme de fidelite choisi :
 *  - tampons      : pastilles de tampons posees sur l'image, pas de compteur
 *                   en header, code plus bas sur la carte
 *  - points       : grande valeur POINTS en header + PROCHAIN CADEAU
 *  - cashback     : grande valeur CAGNOTTE en euros
 *  - remise       : header STATUT (Bronze/Argent/Or) + remise en cours
 *  - carte_cadeau : header SOLDE
 *  - membre       : header STATUT, sans compteur
 *  - coupon       : l'offre occupe la zone principale
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
  carteType?: string;
  typeConfig?: Record<string, any>;
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

type TypeLayout = {
  stamps: boolean;
  headerValue: string;
  headerLabel: string;
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  offre?: string;
};

function layoutFor(data: CardData): TypeLayout {
  const type = data.carteType || 'tampons';
  const cfg = data.typeConfig || {};
  const prenom = (data.clientNom || 'Jean Dupont').split(' ')[0];

  switch (type) {
    case 'points': {
      const seuil = cfg.points_recompense ?? 100;
      const actuels = data.tamponsActuels ?? 0;
      return {
        stamps: false,
        headerLabel: 'POINTS', headerValue: String(actuels),
        leftLabel: 'PRENOM', leftValue: prenom,
        rightLabel: 'POUR CADEAU SUIVANT', rightValue: String(Math.max(seuil - actuels, 0)),
      };
    }
    case 'cashback':
      return {
        stamps: false,
        headerLabel: 'CAGNOTTE', headerValue: '23,50 EUR',
        leftLabel: 'PRENOM', leftValue: prenom,
        rightLabel: 'CASHBACK', rightValue: (cfg.cashback_pourcent ?? 5) + ' %',
      };
    case 'remise': {
      const paliers = cfg.paliers ?? [{ nom: 'Bronze', remise: 0 }, { nom: 'Argent', remise: 5 }];
      const courant = paliers[Math.min(1, paliers.length - 1)] || paliers[0];
      return {
        stamps: false,
        headerLabel: 'STATUT', headerValue: courant.nom,
        leftLabel: 'PRENOM', leftValue: prenom,
        rightLabel: 'REMISE ACTUELLE', rightValue: '-' + courant.remise + ' %',
      };
    }
    case 'carte_cadeau':
      return {
        stamps: false,
        headerLabel: 'SOLDE', headerValue: '50,00 EUR',
        leftLabel: 'PRENOM', leftValue: prenom,
        rightLabel: 'CARTE CADEAU', rightValue: data.commercantNom,
      };
    case 'membre':
      return {
        stamps: false,
        headerLabel: 'STATUT', headerValue: cfg.statut_defaut || 'Membre',
        leftLabel: 'PRENOM', leftValue: prenom,
        rightLabel: 'MEMBRE', rightValue: 'Actif',
      };
    case 'coupon':
      return {
        stamps: false,
        headerLabel: 'COUPON', headerValue: '1',
        leftLabel: 'PRENOM', leftValue: prenom,
        rightLabel: 'VALABLE', rightValue: 'Une seule fois',
        offre: cfg.offre || '-10% sur votre premiere commande',
      };
    default: {
      const requis = cfg.tampons_requis ?? data.tamponsPalier ?? 10;
      const actuels = Math.min(data.tamponsActuels ?? 0, requis);
      return {
        stamps: true,
        headerLabel: '', headerValue: '',
        leftLabel: 'TAMPONS JUSQU\u2019A LA RECOMPENSE',
        leftValue: Math.max(requis - actuels, 0) + ' tampons',
        rightLabel: 'RECOMPENSES DISPONIBLES',
        rightValue: String(Math.floor((data.tamponsActuels ?? 0) / requis)),
      };
    }
  }
}

function StampGrid({ data }: { data: CardData }) {
  const cfg = data.typeConfig || {};
  const requis = Math.min(cfg.tampons_requis ?? data.tamponsPalier ?? 10, 20);
  const actuels = Math.min(data.tamponsActuels ?? 0, requis);
  const emoji = cfg.tampon_emoji ?? '\u2b50';
  const lignes = requis > 5 ? 2 : 1;
  const parLigne = Math.ceil(requis / lignes);

  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-1.5 px-2">
      {Array.from({ length: lignes }).map((_, ligne) => (
        <div key={ligne} className="flex justify-center gap-1.5">
          {Array.from({ length: parLigne }).map((_, i) => {
            const index = ligne * parLigne + i;
            if (index >= requis) return null;
            const rempli = index < actuels;
            return (
              <div
                key={index}
                className="rounded-full flex items-center justify-center border-2 shadow-sm"
                style={{
                  width: 30, height: 30, fontSize: 14,
                  backgroundColor: rempli ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.30)',
                  borderColor: rempli ? '#ffffff' : 'rgba(255,255,255,0.6)',
                  filter: rempli ? 'none' : 'grayscale(1)',
                  opacity: rempli ? 1 : 0.7,
                }}
              >
                <span>{emoji}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function PremiumCardPreview({ format, design, data, className = '' }: PremiumCardPreviewProps) {
  const merged = {
    commercantNom: 'Ma Boutique', programmeNom: 'Carte de fidelite',
    clientNom: 'Jean Dupont', tamponsActuels: 7, tamponsPalier: 10,
    recompense: '1 cafe offert', qrValue: 'stamply://client/test-uuid-1234',
    ...(data || {}),
  } as CardData;

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

  const common = { design, data: merged, fontStyle, isItalic, textColor, overlayStyle, hasBg, defaultBg, className };
  return format === 'google' ? <GoogleWalletCard {...common} /> : <AppleWalletCard {...common} />;
}

interface CardProps {
  design: CardDesign; data: CardData; fontStyle: string; isItalic: boolean;
  textColor: string; overlayStyle: React.CSSProperties; hasBg: boolean; defaultBg: string; className: string;
}

function AppleWalletCard({ design, data, fontStyle, isItalic, textColor, overlayStyle, hasBg, defaultBg, className }: CardProps) {
  const L = layoutFor(data);
  return (
    <div className={`relative mx-auto ${className}`} style={{ width: 320 }}>
      <div className="relative rounded-[18px] overflow-hidden shadow-2xl"
        style={{ height: 560, background: hasBg ? undefined : defaultBg, fontFamily: fontStyle, fontStyle: isItalic ? 'italic' : 'normal' }}>
        {hasBg && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${design.background_image_url})` }} />}
        <div className="absolute inset-0" style={overlayStyle} />

        <div className="relative h-full flex flex-col" style={{ color: textColor }}>
          <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
            {design.logo_url ? (
              <img src={design.logo_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-white/20" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-white/25 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                {data.commercantNom.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-bold tracking-wide truncate leading-tight drop-shadow">{data.commercantNom}</h3>
              <p className="text-[9px] opacity-70 tracking-[0.15em] uppercase truncate">{data.programmeNom}</p>
            </div>
            {L.headerValue && (
              <div className="flex-shrink-0 text-right drop-shadow">
                <div className="text-[8px] opacity-70 uppercase tracking-wider">{L.headerLabel}</div>
                <div className="text-[24px] font-bold leading-none">{L.headerValue}</div>
              </div>
            )}
          </div>

          <div className="relative" style={{ height: 132 }}>
            {hasBg ? (
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${design.background_image_url})` }} />
            ) : (
              <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.18)' }} />
            )}
            {L.stamps && <StampGrid data={data} />}
            {L.offre && (
              <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
                <p className="text-[15px] font-extrabold uppercase leading-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.65)' }}>{L.offre}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 px-4 pt-3">
            <div className="min-w-0">
              <div className="text-[8px] opacity-70 uppercase tracking-wider truncate">{L.leftLabel}</div>
              <div className="text-[17px] font-semibold truncate leading-tight">{L.leftValue}</div>
            </div>
            <div className="min-w-0 text-right">
              <div className="text-[8px] opacity-70 uppercase tracking-wider truncate">{L.rightLabel}</div>
              <div className="text-[17px] font-semibold truncate leading-tight">{L.rightValue}</div>
            </div>
          </div>

          <div className="flex-1 flex items-end justify-center pb-5">
            <div className="bg-white rounded-xl p-2.5 shadow-lg">
              <QRCodeSVG value={data.qrValue} size={112} level="M" />
              <p className="text-[7px] text-gray-500 text-center mt-1 tracking-wide">Stamply</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleWalletCard({ design, data, fontStyle, isItalic, textColor, overlayStyle, hasBg, defaultBg, className }: CardProps) {
  const L = layoutFor(data);
  return (
    <div className={`relative mx-auto ${className}`} style={{ width: 320 }}>
      <div className="relative rounded-[18px] overflow-hidden shadow-2xl"
        style={{ height: 480, background: defaultBg, fontFamily: fontStyle, fontStyle: isItalic ? 'italic' : 'normal' }}>
        <div className="absolute inset-0" style={overlayStyle} />

        <div className="relative h-full flex flex-col" style={{ color: textColor }}>
          <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
            {design.logo_url ? (
              <img src={design.logo_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 bg-white/20" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                {data.commercantNom.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-[14px] font-bold truncate leading-tight">{data.commercantNom}</h3>
              <p className="text-[8px] opacity-70 tracking-[0.15em] uppercase truncate">{data.programmeNom}</p>
            </div>
            {L.headerValue && (
              <div className="flex-shrink-0 text-right">
                <div className="text-[7px] opacity-70 uppercase tracking-wider">{L.headerLabel}</div>
                <div className="text-[20px] font-bold leading-none">{L.headerValue}</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 px-4 pt-1 pb-2">
            <div className="min-w-0">
              <div className="text-[7px] opacity-70 uppercase tracking-wider truncate">{L.leftLabel}</div>
              <div className="text-[15px] font-semibold truncate">{L.leftValue}</div>
            </div>
            <div className="min-w-0 text-right">
              <div className="text-[7px] opacity-70 uppercase tracking-wider truncate">{L.rightLabel}</div>
              <div className="text-[15px] font-semibold truncate">{L.rightValue}</div>
            </div>
          </div>

          <div className="flex justify-center py-2">
            <div className="bg-white rounded-xl p-2.5 shadow-lg">
              <QRCodeSVG value={data.qrValue} size={104} level="M" />
            </div>
          </div>

          <div className="relative flex-1 min-h-0">
            {hasBg ? (
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${design.background_image_url})` }} />
            ) : (
              <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.2)' }} />
            )}
            {L.stamps && <StampGrid data={data} />}
            {L.offre && (
              <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
                <p className="text-[13px] font-extrabold uppercase leading-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.65)' }}>{L.offre}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
