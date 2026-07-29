/**
 * ScanCardModal — ce que le commerçant voit après avoir scanné une carte.
 *
 * Objectif : ne plus créditer « à l'aveugle ». Le commerçant voit d'abord
 * à qui appartient la carte et son état, puis déclenche l'action.
 *
 * Le bouton principal s'adapte au programme de fidélité :
 *   tampons      → « + 1 tampon »
 *   points       → saisie du montant, puis « Créditer les points »
 *   cashback     → saisie du montant, puis « Créditer la cagnotte »
 *   remise       → saisie du montant, puis « Enregistrer l'achat »
 *   carte cadeau → saisie du montant, puis « Débiter »
 *   membre       → « Enregistrer la visite »
 *   coupon       → « Valider le coupon »
 *
 * Actions secondaires : utiliser la récompense, corriger le compteur,
 * recharger une carte cadeau, rafraîchir, fermer.
 */
import { useEffect, useState } from 'react';
import { X, Loader2, RefreshCw, Settings2, Gift, Check, AlertTriangle } from 'lucide-react';
import { scanApi } from '@/services/api';
import { Button } from '@/components/ui/Button';

type Props = {
  serial: string;
  employeId?: string | null;
  onClose: () => void;
  onDone?: () => void;
};

const TYPES_AVEC_MONTANT = ['points', 'cashback', 'remise', 'carte_cadeau'];

function labelBoutonPrincipal(type: string): string {
  switch (type) {
    case 'points': return 'Créditer les points';
    case 'cashback': return 'Créditer la cagnotte';
    case 'remise': return "Enregistrer l'achat";
    case 'carte_cadeau': return 'Débiter la carte';
    case 'membre': return 'Enregistrer la visite';
    case 'coupon': return 'Valider le coupon';
    default: return '+ 1 tampon';
  }
}

export function ScanCardModal({ serial, employeId, onClose, onDone }: Props) {
  const [info, setInfo] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [action, setAction] = useState(false);
  const [resultat, setResultat] = useState<string>('');
  const [montant, setMontant] = useState('');
  const [modeCorrection, setModeCorrection] = useState(false);
  const [nouveauCompteur, setNouveauCompteur] = useState('');

  const charger = async () => {
    setChargement(true);
    setErreur('');
    try {
      const d = await scanApi.carteInfo(serial);
      setInfo(d);
      setNouveauCompteur(String(d.carte.points ?? 0));
    } catch (e: any) {
      setErreur(e?.message || 'Carte introuvable');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); /* eslint-disable-next-line */ }, [serial]);

  const type: string = info?.carte_type || 'tampons';
  const demandeMontant = TYPES_AVEC_MONTANT.includes(type);

  const lancerAction = async (actionNom?: string) => {
    setAction(true);
    setResultat('');
    try {
      const m = parseFloat(montant.replace(',', '.'));
      const res: any = await scanApi.scan(serial, {
        ...(isNaN(m) ? {} : { montant: m }),
        ...(actionNom ? { action: actionNom } : {}),
        ...(employeId ? { employe_id: employeId } : {}),
      });
      setResultat(res.resume || res.message || 'Carte mise à jour');
      setMontant('');
      await charger();
      onDone?.();
    } catch (e: any) {
      setErreur(e?.message || "L'action a échoué");
    } finally {
      setAction(false);
    }
  };

  const enregistrerCorrection = async () => {
    setAction(true);
    try {
      await scanApi.ajuster(serial, { points: parseInt(nouveauCompteur) || 0, motif: 'Correction en caisse' });
      setResultat('Compteur corrigé');
      setModeCorrection(false);
      await charger();
      onDone?.();
    } catch (e: any) {
      setErreur(e?.message || 'Correction impossible');
    } finally {
      setAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">Carte scannée</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {chargement ? (
          <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500 mx-auto" /></div>
        ) : erreur && !info ? (
          <div className="py-12 px-5 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-gray-700">{erreur}</p>
            <Button variant="secondary" className="mt-4" onClick={onClose}>Fermer</Button>
          </div>
        ) : info && (
          <div className="p-5 space-y-5">
            {/* Aperçu de la carte du client */}
            <div
              className="rounded-2xl p-4 text-white shadow-lg"
              style={{ background: info.commercant?.couleur
                ? `linear-gradient(135deg, ${info.commercant.couleur}, ${info.commercant.couleur}dd)`
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <div className="flex items-center gap-3">
                {info.commercant?.logo_url ? (
                  <img src={info.commercant.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover bg-white/20" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-white/25 flex items-center justify-center font-bold">
                    {(info.commercant?.nom_enseigne || 'S').charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{info.carte.client_nom || 'Client sans nom'}</p>
                  <p className="text-xs opacity-75 truncate">{info.commercant?.nom_enseigne}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-wider opacity-75">{info.affichage?.header_label}</p>
                  <p className="text-2xl font-bold leading-none">{info.affichage?.header_value}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/20 flex justify-between text-xs">
                <span className="opacity-80">{info.affichage?.second_label} : {info.affichage?.second_value}</span>
                <span className="opacity-60">{info.carte.visites} visite{info.carte.visites > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Historique court : reconnaître un habitué */}
            {info.dernieres_visites?.length > 0 && (
              <p className="text-xs text-gray-500">
                Dernier passage : {new Date(info.dernieres_visites[0].created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            )}
            {info.carte.actif === false && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Cette carte est désactivée.
              </p>
            )}

            {resultat && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 flex items-center gap-2">
                <Check className="h-4 w-4 flex-shrink-0" /> {resultat}
              </p>
            )}
            {erreur && info && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erreur}</p>
            )}

            {/* Action principale */}
            {!modeCorrection && (
              <div className="space-y-3">
                {demandeMontant && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Montant de l'achat
                    </label>
                    <div className="relative">
                      <input
                        type="number" inputMode="decimal" step="0.01" min="0" autoFocus
                        value={montant}
                        onChange={e => setMontant(e.target.value)}
                        placeholder="0,00"
                        className="w-full text-2xl font-semibold rounded-xl border-2 border-gray-200 p-3 pr-10 focus:border-indigo-500 outline-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">€</span>
                    </div>
                    {type === 'points' && montant && (
                      <p className="text-xs text-gray-500 mt-1">
                        ≈ {Math.round((parseFloat(montant.replace(',', '.')) || 0) * (info.config?.points_par_euro || 1))} points crédités
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => lancerAction(type === 'coupon' ? 'utiliser' : type === 'carte_cadeau' ? 'debit' : undefined)}
                  disabled={action || (demandeMontant && !montant)}
                  className="w-full py-4 rounded-xl bg-indigo-600 text-white text-lg font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {action ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  {labelBoutonPrincipal(type)}
                </button>

                {/* Actions secondaires */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {(type === 'points' || type === 'tampons') && (
                    <button
                      onClick={() => lancerAction('recompense')}
                      disabled={action}
                      className="flex-1 min-w-[140px] py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-indigo-300 hover:text-indigo-600 flex items-center justify-center gap-1.5"
                    >
                      <Gift className="h-4 w-4" /> Utiliser la récompense
                    </button>
                  )}
                  {type === 'cashback' && (
                    <button
                      onClick={() => lancerAction('debit')}
                      disabled={action || !montant}
                      className="flex-1 min-w-[140px] py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-indigo-300 hover:text-indigo-600"
                    >
                      Utiliser la cagnotte
                    </button>
                  )}
                  {type === 'carte_cadeau' && (
                    <button
                      onClick={() => lancerAction('credit')}
                      disabled={action || !montant}
                      className="flex-1 min-w-[140px] py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-indigo-300 hover:text-indigo-600"
                    >
                      Recharger
                    </button>
                  )}
                  <button
                    onClick={() => setModeCorrection(true)}
                    className="py-2.5 px-3 rounded-lg border border-gray-200 text-sm text-gray-500 hover:text-gray-700"
                    title="Corriger le compteur"
                  >
                    <Settings2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={charger}
                    className="py-2.5 px-3 rounded-lg border border-gray-200 text-sm text-gray-500 hover:text-gray-700"
                    title="Rafraîchir"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Correction manuelle */}
            {modeCorrection && (
              <div className="space-y-3 rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">Corriger le compteur</p>
                <p className="text-xs text-gray-500">
                  À utiliser en cas d'erreur de caisse ou de geste commercial. La correction est enregistrée dans l'historique.
                </p>
                <input
                  type="number" min="0"
                  value={nouveauCompteur}
                  onChange={e => setNouveauCompteur(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-lg"
                />
                <div className="flex gap-2">
                  <Button onClick={enregistrerCorrection} loading={action} className="flex-1">Enregistrer</Button>
                  <Button variant="secondary" onClick={() => setModeCorrection(false)}>Annuler</Button>
                </div>
              </div>
            )}

            <button onClick={onClose} className="w-full text-sm text-gray-500 hover:text-gray-700 py-2">
              Terminer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
