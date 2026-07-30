/**
 * NouveauMotDePasseModal — s'affiche quand l'administrateur a réinitialisé
 * le mot de passe du commerçant.
 *
 * Volontairement bloquante : pas de croix, pas de clic à l'extérieur. Le
 * commerçant vient de se connecter avec un mot de passe temporaire donné au
 * téléphone ; tant qu'il n'en a pas choisi un personnel, il ne peut rien faire
 * d'autre. C'est ce qui évite qu'un mot de passe communiqué oralement reste
 * actif pendant des semaines.
 */
import { useState } from 'react';
import { KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export function NouveauMotDePasseModal() {
  const { refreshUser } = useAuth();
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const valider = async () => {
    setErreur('');

    if (motDePasse.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur('Les deux mots de passe ne sont pas identiques.');
      return;
    }

    setChargement(true);
    try {
      await authApi.definirMotDePasse(motDePasse);
      await refreshUser();
    } catch (e: any) {
      setErreur(e?.message || 'Enregistrement impossible. Réessayez.');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
          <KeyRound className="h-6 w-6 text-indigo-600" />
        </div>

        <h2 className="text-lg font-bold text-gray-900">Choisissez votre mot de passe</h2>
        <p className="text-sm text-gray-500 mt-1 mb-5">
          Votre mot de passe a été réinitialisé. Celui qui vous a été communiqué est temporaire :
          définissez-en un personnel pour continuer.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={visible ? 'text' : 'password'}
                value={motDePasse}
                onChange={(e) => { setMotDePasse(e.target.value); setErreur(''); }}
                autoFocus
                className="w-full rounded-lg border border-gray-300 p-2.5 pr-10 focus:border-indigo-500 outline-none"
                placeholder="Au moins 6 caractères"
              />
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={visible ? 'Masquer' : 'Afficher'}
              >
                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Confirmez le mot de passe</label>
            <input
              type={visible ? 'text' : 'password'}
              value={confirmation}
              onChange={(e) => { setConfirmation(e.target.value); setErreur(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') valider(); }}
              className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-indigo-500 outline-none"
              placeholder="Le même, pour éviter une faute de frappe"
            />
          </div>
        </div>

        {erreur && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">
            {erreur}
          </p>
        )}

        <button
          onClick={valider}
          disabled={chargement}
          className="w-full mt-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {chargement && <Loader2 className="h-4 w-4 animate-spin" />}
          Enregistrer et continuer
        </button>

        <p className="text-xs text-gray-400 text-center mt-3">
          Vous ne pourrez pas accéder au tableau de bord avant d'avoir choisi votre mot de passe.
        </p>
      </div>
    </div>
  );
}
