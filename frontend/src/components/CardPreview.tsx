interface CardPreviewProps {
  couleur: string;
  couleurSecondaire: string;
  programme: string;
  logoUrl?: string;
  pointsRecompense: number;
  recompenseDescription: string;
  layout: 'classic' | 'modern' | 'minimal';
  texteBasCarte: string;
  styleTexte: 'normal' | 'gras' | 'italique';
}

export function CardPreview({ couleur, couleurSecondaire, programme, logoUrl, pointsRecompense, recompenseDescription, layout, texteBasCarte, styleTexte }: CardPreviewProps) {
  const textStyle = styleTexte === 'gras' ? { fontWeight: 700 as const }
    : styleTexte === 'italique' ? { fontStyle: 'italic' as const }
    : {};

  if (layout === 'modern') {
    return (
      <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ minHeight: '200px' }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${couleur} 0%, ${couleurSecondaire} 100%)` }} />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {logoUrl ? <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-contain bg-white/20 p-1.5" /> : (
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold">{programme.charAt(0).toUpperCase()}</div>
              )}
              <div><p className="font-bold text-sm">Stamply</p><p className="text-xs text-white/70">Fidélité</p></div>
            </div>
            <div className="text-right"><p className="text-2xl font-bold">{pointsRecompense}</p><p className="text-xs text-white/70">points</p></div>
          </div>
          <p className="font-bold text-lg leading-tight mb-1">{programme || 'Nom du programme'}</p>
          <p className="text-sm text-white/80">{recompenseDescription || 'Récompense à débloquer'}</p>
          {texteBasCarte && <p className="text-xs text-white/60 mt-3 border-t border-white/20 pt-2" style={textStyle}>{texteBasCarte}</p>}
        </div>
      </div>
    );
  }

  if (layout === 'minimal') {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-100" style={{ minHeight: '180px', background: couleur }}>
        <div className="p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            {logoUrl ? <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white/20 p-1" /> : (
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-lg font-bold">{programme.charAt(0).toUpperCase()}</div>
            )}
            <span className="font-bold text-sm tracking-wide">Stamply</span>
          </div>
          <p className="font-bold text-base leading-tight mb-1">{programme || 'Nom du programme'}</p>
          <p className="text-xs text-white/70">{recompenseDescription || 'Récompense à débloquer'}</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-white/60 rounded-full" style={{ width: '30%' }} /></div>
            <span className="text-xs text-white/70">{pointsRecompense} pts</span>
          </div>
          {texteBasCarte && <p className="text-xs text-white/50 mt-2" style={textStyle}>{texteBasCarte}</p>}
        </div>
      </div>
    );
  }

  // Classic
  return (
    <div className="relative rounded-2xl p-5 text-white shadow-lg overflow-hidden" style={{ background: `linear-gradient(135deg, ${couleur} 0%, ${couleur}cc 100%)`, minHeight: '160px' }}>
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20" style={{ background: 'white' }} />
      <div className="relative flex items-center gap-3 mb-3">
        {logoUrl ? <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white/20 p-1" /> : (
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-lg">{programme.charAt(0).toUpperCase()}</div>
        )}
        <span className="font-bold text-sm tracking-wide">Stamply</span>
      </div>
      <p className="relative font-semibold text-base leading-tight mb-1">{programme || 'Nom du programme'}</p>
      <p className="relative text-xs text-white/70">{recompenseDescription || 'Récompense à débloquer'}</p>
      <div className="relative mt-2 flex items-center gap-2"><span className="text-xs text-white/60">{pointsRecompense} points</span></div>
      {texteBasCarte && <p className="relative text-xs text-white/50 mt-2 border-t border-white/20 pt-2" style={textStyle}>{texteBasCarte}</p>}
    </div>
  );
}
