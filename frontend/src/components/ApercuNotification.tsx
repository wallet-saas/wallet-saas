/**
 * ApercuNotification — rendu fidèle d'une notification Apple.
 *
 * Objectif : que le commerçant voie exactement ce qui arrivera sur l'écran de
 * son client pendant qu'il tape, plutôt qu'un encadré abstrait. On reprend les
 * codes d'iOS : bandeau translucide arrondi posé sur un fond, icône de l'app à
 * gauche, titre en gras, corps du message en dessous, horodatage à droite.
 *
 * L'icône reprend le logo du commerce (Paramètres → Mon commerce). Sans logo,
 * on retombe sur l'initiale de l'enseigne, comme le fait iOS avec les apps
 * sans icône.
 */
import { useAuth } from '@/hooks/useAuth';

type Props = {
  /** Titre en gras — ce que le commerçant saisit */
  titre?: string;
  /** Corps du message */
  message?: string;
  /** Texte affiché à droite (« maintenant » par défaut) */
  horodatage?: string;
  /** Légende au-dessus de l'aperçu */
  legende?: string;
  /** Remplace le prénom d'exemple dans les variables */
  prenomExemple?: string;
  /** Fond : écran verrouillé (sombre) ou notification en cours d'usage (clair) */
  variante?: 'verrouille' | 'clair';
  className?: string;
};

/** Remplace les variables par un exemple lisible. */
function rendu(texte: string | undefined, enseigne: string, prenom: string) {
  return (texte || '')
    .replace(/\{\{nom\}\}/g, prenom)
    .replace(/\{\{nom_enseigne\}\}/g, enseigne);
}

export function ApercuNotification({
  titre,
  message,
  horodatage = 'maintenant',
  legende = 'Aperçu sur le téléphone de votre client',
  prenomExemple = 'Marie',
  variante = 'verrouille',
  className = '',
}: Props) {
  const { commercant } = useAuth();
  const enseigne = (commercant as any)?.nom_enseigne || 'Votre commerce';
  const logo = (commercant as any)?.carte_logo_url;

  const titreAffiche = rendu(titre, enseigne, prenomExemple) || enseigne;
  const messageAffiche = rendu(message, enseigne, prenomExemple) || 'Votre message apparaîtra ici…';

  const sombre = variante === 'verrouille';

  return (
    <div className={className}>
      {legende && (
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
          {legende}
        </p>
      )}

      {/* Fond : un dégradé qui évoque un fond d'écran, pour que le bandeau
          translucide se lise comme sur un vrai téléphone */}
      <div
        className="rounded-2xl p-4 sm:p-5"
        style={{
          background: sombre
            ? 'linear-gradient(160deg, #1e3a5f 0%, #2d4a6f 45%, #4a6fa5 100%)'
            : 'linear-gradient(160deg, #e0e7ff 0%, #f1f5f9 100%)',
        }}
      >
        {/* Le bandeau de notification */}
        <div
          className="rounded-[20px] px-3 py-2.5 flex items-start gap-3 shadow-lg"
          style={{
            backgroundColor: sombre ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: sombre ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.9)',
          }}
        >
          {/* Icône de l'application — le logo du commerce */}
          <div
            className="h-[38px] w-[38px] rounded-[10px] flex-shrink-0 overflow-hidden flex items-center justify-center"
            style={{
              backgroundColor: logo ? 'transparent' : (sombre ? 'rgba(255,255,255,0.9)' : '#6366f1'),
            }}
          >
            {logo ? (
              <img src={logo} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className={`text-lg font-bold ${sombre ? 'text-indigo-700' : 'text-white'}`}>
                {enseigne.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Titre et message */}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <p
                className="text-[13px] font-semibold leading-tight truncate flex-1"
                style={{ color: sombre ? '#fff' : '#111827' }}
              >
                {titreAffiche}
              </p>
              <span
                className="text-[11px] flex-shrink-0"
                style={{ color: sombre ? 'rgba(255,255,255,0.6)' : '#9ca3af' }}
              >
                {horodatage}
              </span>
            </div>
            <p
              className="text-[13px] leading-snug mt-0.5 whitespace-pre-line break-words"
              style={{ color: sombre ? 'rgba(255,255,255,0.85)' : '#374151' }}
            >
              {messageAffiche}
            </p>
          </div>
        </div>
      </div>

      {!logo && (
        <p className="text-[11px] text-gray-400 mt-1.5">
          Ajoutez votre logo dans Paramètres → Mon commerce pour qu'il apparaisse ici.
        </p>
      )}
    </div>
  );
}
