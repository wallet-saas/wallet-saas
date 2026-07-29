/**
 * PriseDeService — bandeau affiché en haut de la page Scan.
 *
 * Si le commerçant a créé une équipe, l'employé saisit son PIN une seule fois
 * en début de service. Ensuite il scanne autant de clients qu'il veut sans
 * rien resaisir. Le bouton « Changer » permet de passer la main.
 *
 * Sans équipe créée, ce bandeau ne s'affiche pas : la caisse fonctionne
 * exactement comme avant.
 */
import { useState, useEffect } from 'react';
import { UserCircle2, LogOut, Loader2, Delete } from 'lucide-react';
import { employesApi } from '@/services/api';
import { useEmployeSession, ouvrirSession, fermerSession } from '@/hooks/useEmployeSession';

export function PriseDeService({ onChange }: { onChange?: (employeId: string | null) => void }) {
  const { session } = useEmployeSession();
  const [equipeExiste, setEquipeExiste] = useState<boolean | null>(null);
  const [pin, setPin] = useState('');
  const [verification, setVerification] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    employesApi.list()
      .then(d => setEquipeExiste((d.employes || []).some(e => e.actif)))
      .catch(() => setEquipeExiste(false));
  }, []);

  useEffect(() => { onChange?.(session?.id || null); }, [session, onChange]);

  const valider = async (code: string) => {
    setVerification(true);
    setErreur('');
    try {
      const employe = await employesApi.verifierPin(code);
      ouvrirSession(employe);
      setPin('');
    } catch (e: any) {
      setErreur(e?.message || 'Code non reconnu');
      setPin('');
    } finally {
      setVerification(false);
    }
  };

  const taper = (chiffre: string) => {
    const suite = (pin + chiffre).slice(0, 6);
    setPin(suite);
    setErreur('');
    if (suite.length === 4) valider(suite); // validation auto sur 4 chiffres
  };

  // Pas d'équipe : rien à afficher
  if (equipeExiste === null || equipeExiste === false) return null;

  // Service en cours
  if (session) {
    const duree = Math.floor((Date.now() - session.debut) / 60000);
    return (
      <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">
            {session.prenom.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-900">{session.prenom} est en service</p>
            <p className="text-xs text-indigo-600">
              {duree < 1 ? 'Service commencé à l\u2019instant' : `Depuis ${duree < 60 ? `${duree} min` : `${Math.floor(duree / 60)} h`}`}
              {' • '}les scans lui sont attribués
            </p>
          </div>
        </div>
        <button
          onClick={() => fermerSession()}
          className="text-sm text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-indigo-100"
        >
          <LogOut className="h-4 w-4" /> Changer d'employé
        </button>
      </div>
    );
  }

  // Prise de service
  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <UserCircle2 className="h-5 w-5 text-indigo-500" />
        <div>
          <p className="text-sm font-medium text-gray-900">Prise de service</p>
          <p className="text-xs text-gray-500">Saisissez votre code PIN pour commencer à scanner.</p>
        </div>
      </div>

      <div className="max-w-xs mx-auto">
        {/* Points de saisie */}
        <div className="flex justify-center gap-3 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`h-3.5 w-3.5 rounded-full transition-colors ${
                i < pin.length ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {erreur && <p className="text-center text-sm text-red-600 mb-3">{erreur}</p>}
        {verification && (
          <p className="text-center text-sm text-gray-500 mb-3 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Vérification…
          </p>
        )}

        {/* Pavé numérique — pensé pour une tablette de caisse */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(c => (
            <button
              key={c}
              onClick={() => taper(c)}
              disabled={verification}
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
            disabled={verification}
            className="py-4 rounded-xl border border-gray-200 text-xl font-semibold text-gray-800 hover:border-indigo-300 hover:bg-indigo-50 active:scale-95 transition disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={() => setPin(p => p.slice(0, -1))}
            className="py-4 rounded-xl text-gray-400 hover:text-gray-600 flex items-center justify-center"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>

        {pin.length > 4 && (
          <button
            onClick={() => valider(pin)}
            disabled={verification}
            className="w-full mt-3 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            Valider
          </button>
        )}
      </div>
    </div>
  );
}
