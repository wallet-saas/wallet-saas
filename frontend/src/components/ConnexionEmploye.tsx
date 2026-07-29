/**
 * ConnexionEmploye — connexion autonome d'un membre de l'équipe.
 *
 * Deux informations suffisent : le code du commerce (commun à l'équipe, donné
 * par le responsable) et son code PIN personnel. L'employé peut donc se
 * connecter depuis son propre téléphone, ou reprendre son service après un
 * changement d'appareil, sans passer par le compte du commerçant.
 *
 * La session dure 30 jours pour éviter de ressaisir le PIN chaque matin.
 */
import { useState } from 'react';
import { useRouter } from 'next/router';
import { UserCircle2, Loader2, Delete, ArrowLeft } from 'lucide-react';
import { employeAuthApi } from '@/services/api';

export function ConnexionEmploye({ onRetour }: { onRetour?: () => void }) {
  const router = useRouter();
  const [codeEquipe, setCodeEquipe] = useState('');
  const [pin, setPin] = useState('');
  const [etape, setEtape] = useState<'code' | 'pin'>('code');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const connecter = async (codeSaisi: string) => {
    setChargement(true);
    setErreur('');
    try {
      const res = await employeAuthApi.login(codeEquipe.trim().toUpperCase(), codeSaisi);
      localStorage.setItem('stamply_token', res.token);
      localStorage.setItem(
        'stamply_employe_session',
        JSON.stringify({ ...res.employe, debut: Date.now() })
      );
      router.push('/dashboard/scan');
    } catch (e: any) {
      setErreur(e?.message || 'Connexion impossible');
      setPin('');
    } finally {
      setChargement(false);
    }
  };

  const taper = (chiffre: string) => {
    const suite = (pin + chiffre).slice(0, 6);
    setPin(suite);
    setErreur('');
    if (suite.length === 4) connecter(suite);
  };

  return (
    <div className="w-full">
      {etape === 'code' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (codeEquipe.trim().length >= 4) setEtape('pin');
            else setErreur('Saisissez le code de votre commerce.');
          }}
          className="space-y-4"
        >
          <div className="text-center mb-2">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
              <UserCircle2 className="h-6 w-6 text-indigo-600" />
            </div>
            <p className="text-sm text-gray-500">
              Votre responsable vous a communiqué le code du commerce.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Code du commerce</label>
            <input
              autoFocus
              value={codeEquipe}
              onChange={(e) => { setCodeEquipe(e.target.value.toUpperCase()); setErreur(''); }}
              placeholder="STAMP-8F3K"
              className="w-full rounded-xl border border-gray-300 p-3 text-lg font-mono tracking-wider text-center uppercase focus:border-indigo-500 outline-none"
            />
          </div>

          {erreur && <p className="text-sm text-red-600 text-center">{erreur}</p>}

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
          >
            Continuer
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => { setEtape('code'); setPin(''); setErreur(''); }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> {codeEquipe}
          </button>

          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">Votre code PIN</p>
            <p className="text-xs text-gray-500 mt-0.5">Celui que votre responsable vous a donné.</p>
          </div>

          <div className="flex justify-center gap-3 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`h-3.5 w-3.5 rounded-full transition-colors ${
                  i < pin.length ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {erreur && <p className="text-center text-sm text-red-600">{erreur}</p>}
          {chargement && (
            <p className="text-center text-sm text-gray-500 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Connexion…
            </p>
          )}

          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((c) => (
              <button
                key={c}
                onClick={() => taper(c)}
                disabled={chargement}
                className="py-4 rounded-xl border border-gray-200 text-xl font-semibold text-gray-800 hover:border-indigo-300 hover:bg-indigo-50 active:scale-95 transition disabled:opacity-50"
              >
                {c}
              </button>
            ))}
            <button
              onClick={() => { setPin(''); setErreur(''); }}
              className="py-4 rounded-xl text-sm text-gray-400 hover:text-gray-600"
            >
              Effacer
            </button>
            <button
              onClick={() => taper('0')}
              disabled={chargement}
              className="py-4 rounded-xl border border-gray-200 text-xl font-semibold text-gray-800 hover:border-indigo-300 hover:bg-indigo-50 active:scale-95 transition disabled:opacity-50"
            >
              0
            </button>
            <button
              onClick={() => setPin((p) => p.slice(0, -1))}
              className="py-4 rounded-xl text-gray-400 hover:text-gray-600 flex items-center justify-center"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          {pin.length > 4 && (
            <button
              onClick={() => connecter(pin)}
              disabled={chargement}
              className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 max-w-xs mx-auto block"
            >
              Se connecter
            </button>
          )}
        </div>
      )}

      {onRetour && (
        <button
          onClick={onRetour}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-6"
        >
          Je suis le responsable du commerce
        </button>
      )}
    </div>
  );
}
