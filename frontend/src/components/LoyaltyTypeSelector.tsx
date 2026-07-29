/**
 * LoyaltyTypeSelector — Choix du type de programme de fidélité et de sa configuration.
 *
 * Utilisé à deux endroits, avec la même logique :
 *  - Création de la carte (setup-card) : choix initial, sans avertissement.
 *  - Paramètres > Design premium : changement à tout moment, avec confirmation
 *    (les compteurs clients ne sont pas convertibles d'un type à l'autre).
 */
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ChampNombre } from '@/components/ui/ChampNombre';

export const LOYALTY_TYPES = [
  { id: 'tampons', nom: 'Carte à tampons', desc: '1 visite = 1 tampon', emoji: '⭐' },
  { id: 'points', nom: 'Carte de points', desc: '1 € dépensé = X points', emoji: '🎯' },
  { id: 'cashback', nom: 'Cashback', desc: '% des achats en cagnotte', emoji: '💶' },
  { id: 'remise', nom: 'Remise à paliers', desc: 'Bronze / Argent / Or', emoji: '🏆' },
  { id: 'carte_cadeau', nom: 'Carte cadeau', desc: 'Solde prépayé', emoji: '🎁' },
  { id: 'membre', nom: 'Carte de membre', desc: 'Statut, sans points', emoji: '👤' },
  { id: 'coupon', nom: 'Coupon rabais', desc: 'Devient une carte fidélité', emoji: '🎟️' },
] as const;

export const DEFAULT_PALIERS = [
  { seuil: 0, nom: 'Bronze', remise: 0 },
  { seuil: 200, nom: 'Argent', remise: 5 },
  { seuil: 500, nom: 'Or', remise: 10 },
];

export function typeLabel(id?: string) {
  return LOYALTY_TYPES.find(t => t.id === id)?.nom || 'Carte à tampons';
}

/** Ce que le commerçant devra saisir en caisse, selon le type. */
export function scanHint(type: string): string {
  switch (type) {
    case 'points': return 'En caisse : le montant de l\'achat est demandé au scan pour créditer les points.';
    case 'cashback': return 'En caisse : le montant de l\'achat est demandé pour créditer la cagnotte.';
    case 'remise': return 'En caisse : le montant de l\'achat est demandé pour faire progresser le statut.';
    case 'carte_cadeau': return 'En caisse : le montant à débiter (ou à recharger) est demandé au scan.';
    case 'coupon': return 'En caisse : un seul bouton « Valider le coupon ».';
    default: return 'En caisse : un simple scan suffit, sans saisie supplémentaire.';
  }
}

type Props = {
  type: string;
  config: Record<string, any>;
  onSelectType: (type: string) => void;
  setCfg: (key: string, value: any) => void;
  disabled?: boolean;
};

/** Grille de sélection des 7 types. */
export function LoyaltyTypeGrid({ type, onSelectType, disabled }: Omit<Props, 'config' | 'setCfg'>) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {LOYALTY_TYPES.map(t => (
        <button
          key={t.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelectType(t.id)}
          className={`text-left rounded-xl border-2 p-3 transition disabled:opacity-50 ${
            type === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-lg leading-none mb-1">{t.emoji}</div>
          <div className="font-medium text-sm text-gray-900">{t.nom}</div>
          <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
        </button>
      ))}
    </div>
  );
}

/** Champs de configuration propres au type sélectionné. */
export function LoyaltyTypeConfigFields({ type, config, setCfg }: Omit<Props, 'onSelectType'>) {
  const paliers = config.paliers ?? DEFAULT_PALIERS;
  const updatePalier = (i: number, patch: Record<string, any>) => {
    const next = paliers.map((p: any, idx: number) => (idx === i ? { ...p, ...patch } : p));
    setCfg('paliers', next);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {type === 'points' && (
        <>
          <ChampNombre
            label="Points gagnés par euro dépensé"
            value={config.points_par_euro ?? 1}
            onChange={v => setCfg('points_par_euro', v)}
            min={1}
            aide={`Ex. : 1 € = ${config.points_par_euro ?? 1} point(s)`}
          />
          <ChampNombre
            label="Points pour une récompense"
            value={config.points_recompense ?? 100}
            onChange={v => setCfg('points_recompense', v)}
            min={1}
            aide={`Soit environ ${Math.round((config.points_recompense ?? 100) / (config.points_par_euro || 1))} € d'achats`}
          />
          <label className="block text-sm">
            <span className="text-gray-700">Récompense offerte</span>
            <input type="text" className="mt-1 w-full rounded-lg border border-gray-300 p-2"
              placeholder="un café offert"
              value={config.recompense_desc ?? ''}
              onChange={e => setCfg('recompense_desc', e.target.value)} />
          </label>
        </>
      )}

      {type === 'tampons' && (
        <>
          <ChampNombre
            label="Tampons pour la récompense"
            value={config.tampons_requis ?? 10}
            onChange={v => setCfg('tampons_requis', v)}
            min={1}
            max={20}
          />
          <label className="block text-sm">
            <span className="text-gray-700">Emoji du tampon</span>
            <div className="mt-1 flex gap-2 flex-wrap items-center">
              {['⭐', '☕', '🍕', '🍔', '🥐', '💇', '🐾', '❤️'].map(e => (
                <button key={e} type="button" onClick={() => setCfg('tampon_emoji', e)}
                  className={`h-9 w-9 rounded-lg border text-lg ${
                    (config.tampon_emoji ?? '⭐') === e ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                  }`}>{e}</button>
              ))}
              <input type="text" maxLength={4} className="h-9 w-16 rounded-lg border border-gray-300 p-2 text-center"
                value={config.tampon_emoji ?? '⭐'}
                onChange={e => setCfg('tampon_emoji', e.target.value || '⭐')} />
            </div>
          </label>
          <label className="block text-sm">
            <span className="text-gray-700">Récompense offerte</span>
            <input type="text" className="mt-1 w-full rounded-lg border border-gray-300 p-2"
              placeholder="une boisson offerte"
              value={config.recompense_desc ?? ''}
              onChange={e => setCfg('recompense_desc', e.target.value)} />
          </label>
        </>
      )}

      {type === 'cashback' && (
        <ChampNombre
          label="Cashback sur chaque achat (%)"
          value={config.cashback_pourcent ?? 5}
          onChange={v => setCfg('cashback_pourcent', v)}
          min={1}
          max={100}
          suffixe="%"
          aide={`Ex. : 50 € d'achat = ${((config.cashback_pourcent ?? 5) * 0.5).toFixed(2)} € crédités`}
        />
      )}

      {type === 'remise' && (
        <div className="md:col-span-3 space-y-2">
          <span className="text-sm text-gray-700">Paliers de remise (selon le total dépensé)</span>
          {paliers.map((pal: any, i: number) => (
            <div key={i} className="flex flex-wrap gap-2 items-center text-sm">
              <input type="text" className="w-28 rounded-lg border border-gray-300 p-2" value={pal.nom}
                onChange={e => updatePalier(i, { nom: e.target.value })} />
              <span className="text-gray-500">dès</span>
              <ChampNombre
                className="w-24"
                value={pal.seuil}
                onChange={v => updatePalier(i, { seuil: v })}
                min={0}
              />
              <span className="text-gray-500">€ →</span>
              <ChampNombre
                className="w-24"
                value={pal.remise}
                onChange={v => updatePalier(i, { remise: v })}
                min={0}
                max={100}
              />
              <span className="text-gray-500">% de remise</span>
              {paliers.length > 1 && (
                <button type="button" className="text-xs text-gray-400 hover:text-red-500 underline"
                  onClick={() => setCfg('paliers', paliers.filter((_: any, idx: number) => idx !== i))}>
                  retirer
                </button>
              )}
            </div>
          ))}
          <button type="button" className="text-xs text-indigo-600 hover:underline"
            onClick={() => setCfg('paliers', [...paliers, { seuil: 1000, nom: 'Platine', remise: 15 }])}>
            + Ajouter un palier
          </button>
        </div>
      )}

      {type === 'coupon' && (
        <>
          <label className="block text-sm md:col-span-2">
            <span className="text-gray-700">Offre du coupon</span>
            <input type="text" className="mt-1 w-full rounded-lg border border-gray-300 p-2"
              value={config.offre ?? '-10% sur votre première commande'}
              onChange={e => setCfg('offre', e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700">Après utilisation, devient</span>
            <select className="mt-1 w-full rounded-lg border border-gray-300 p-2"
              value={config.type_apres_usage ?? 'tampons'}
              onChange={e => setCfg('type_apres_usage', e.target.value)}>
              <option value="tampons">Carte à tampons</option>
              <option value="points">Carte de points</option>
              <option value="cashback">Carte cashback</option>
            </select>
          </label>
        </>
      )}

      {type === 'membre' && (
        <label className="block text-sm">
          <span className="text-gray-700">Libellé du statut affiché</span>
          <input type="text" className="mt-1 w-full rounded-lg border border-gray-300 p-2"
            value={config.statut_defaut ?? 'Membre'}
            onChange={e => setCfg('statut_defaut', e.target.value)} />
        </label>
      )}

      {type === 'carte_cadeau' && (
        <p className="text-sm text-gray-500 md:col-span-3">
          Le solde se crédite au moment de la vente depuis la page <strong>Scanner</strong> (bouton « Créditer / Recharger »),
          puis se débite achat après achat.
        </p>
      )}
    </div>
  );
}

/** Modale de confirmation avant changement de type (remise à zéro des compteurs). */
export function ChangeTypeConfirmModal({
  fromType, toType, nbCartes, loading, onCancel, onConfirm,
}: {
  fromType: string; toType: string; nbCartes?: number;
  loading?: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Changer de programme de fidélité ?</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {typeLabel(fromType)} → <strong>{typeLabel(toType)}</strong>
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-900 space-y-2">
          <p className="font-medium">Les compteurs de tous vos clients seront remis à zéro.</p>
          <p className="text-amber-800">
            Les tampons, points, cagnottes et statuts ne sont pas convertibles d'un programme à l'autre
            (10 tampons ne valent pas 10 points ni 10 €). Les cartes restent installées dans le Wallet
            de vos clients et se mettront à jour automatiquement, mais elles repartiront de zéro
            {typeof nbCartes === 'number' ? ` (${nbCartes} carte${nbCartes > 1 ? 's' : ''} concernée${nbCartes > 1 ? 's' : ''})` : ''}.
          </p>
          <p className="text-amber-800">Cette action est définitive.</p>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Conseil : prévenez vos clients avant le changement, ou offrez un geste commercial pour compenser.
        </p>

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Annuler</Button>
          <Button onClick={onConfirm} loading={loading}>Confirmer le changement</Button>
        </div>
      </div>
    </div>
  );
}
