/**
 * ChampNombre — champ numérique qui se laisse vider.
 *
 * Le problème corrigé : avec un `onChange` qui fait `parseInt(e.target.value) || 10`,
 * effacer le contenu réinjecte immédiatement une valeur. Impossible de taper
 * « 45 » sans d'abord se battre avec le « 3 » qui revient. Ici :
 *
 *  1. le champ peut rester vide aussi longtemps que le commerçant tape ;
 *  2. tant qu'il est vide, la valeur n'est pas transmise au parent ;
 *  3. s'il est quitté vide, la bordure passe en rouge avec un message ;
 *  4. la valeur n'est propagée que lorsqu'elle est réellement saisie.
 */
import { useState, useEffect, useId } from 'react';

type Props = {
  label?: string;
  value: number | null | undefined;
  onChange: (valeur: number) => void;
  min?: number;
  max?: number;
  suffixe?: string;
  aide?: string;
  className?: string;
  placeholder?: string;
  /** Message affiché si le champ est laissé vide */
  messageVide?: string;
};

export function ChampNombre({
  label,
  value,
  onChange,
  min,
  max,
  suffixe,
  aide,
  className = '',
  placeholder,
  messageVide = 'Veuillez renseigner une valeur.',
}: Props) {
  // Texte affiché : découplé de la valeur, c'est ce qui permet le champ vide
  const [texte, setTexte] = useState(value != null ? String(value) : '');
  const [touche, setTouche] = useState(false);
  const id = useId();

  // Se resynchronise si la valeur change ailleurs (chargement du profil…)
  useEffect(() => {
    if (document.activeElement?.id !== id) {
      setTexte(value != null ? String(value) : '');
    }
  }, [value, id]);

  const vide = texte.trim() === '';
  const enErreur = touche && vide;

  const handleChange = (brut: string) => {
    // On n'accepte que des chiffres, mais on autorise la chaîne vide
    const nettoye = brut.replace(/[^\d]/g, '');
    setTexte(nettoye);
    if (nettoye === '') return; // vide : on ne propage rien

    let n = parseInt(nettoye, 10);
    if (isNaN(n)) return;
    if (max != null && n > max) n = max;
    onChange(n);
  };

  const handleBlur = () => {
    setTouche(true);
    if (vide) return; // on laisse l'erreur visible, sans rien réinjecter
    let n = parseInt(texte, 10);
    if (isNaN(n)) return;
    if (min != null && n < min) {
      n = min;
      setTexte(String(min));
    }
    onChange(n);
  };

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={texte}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setTouche(false)}
          onBlur={handleBlur}
          placeholder={placeholder}
          aria-invalid={enErreur}
          className={`w-full rounded-lg border p-2 outline-none transition-colors ${
            enErreur
              ? 'border-red-400 bg-red-50 focus:border-red-500'
              : 'border-gray-300 focus:border-indigo-500'
          } ${suffixe ? 'pr-10' : ''}`}
        />
        {suffixe && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {suffixe}
          </span>
        )}
      </div>
      {enErreur ? (
        <p className="text-xs text-red-600 mt-1">{messageVide}</p>
      ) : aide ? (
        <p className="text-xs text-gray-400 mt-1">{aide}</p>
      ) : null}
    </div>
  );
}

/**
 * ChampTexte — même principe pour du texte : on peut tout effacer sans que
 * l'ancienne valeur revienne, et le champ signale s'il est laissé vide.
 */
export function ChampTexte({
  label,
  value,
  onChange,
  obligatoire = false,
  placeholder,
  aide,
  maxLength,
  className = '',
  messageVide = 'Veuillez renseigner ce champ.',
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  obligatoire?: boolean;
  placeholder?: string;
  aide?: string;
  maxLength?: number;
  className?: string;
  messageVide?: string;
}) {
  const [touche, setTouche] = useState(false);
  const id = useId();
  const enErreur = obligatoire && touche && value.trim() === '';

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setTouche(false)}
        onBlur={() => setTouche(true)}
        placeholder={placeholder}
        aria-invalid={enErreur}
        className={`w-full rounded-lg border p-2 outline-none transition-colors ${
          enErreur
            ? 'border-red-400 bg-red-50 focus:border-red-500'
            : 'border-gray-300 focus:border-indigo-500'
        }`}
      />
      {enErreur ? (
        <p className="text-xs text-red-600 mt-1">{messageVide}</p>
      ) : aide ? (
        <p className="text-xs text-gray-400 mt-1">{aide}</p>
      ) : null}
    </div>
  );
}


/**
 * ZoneTexte — équivalent multi-lignes de ChampTexte.
 * Même principe : on peut tout effacer, rien ne se réinjecte, et la zone
 * signale en rouge si elle reste vide alors qu'elle est obligatoire.
 */
export function ZoneTexte({
  label, value, onChange, obligatoire = false, placeholder, aide, rows = 3,
  className = '', messageVide = 'Veuillez renseigner une valeur.',
}: {
  label?: string; value: string; onChange: (v: string) => void;
  obligatoire?: boolean; placeholder?: string; aide?: string; rows?: number;
  className?: string; messageVide?: string;
}) {
  const [touche, setTouche] = useState(false);
  const id = useId();
  const enErreur = obligatoire && touche && value.trim() === '';

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm text-gray-700 mb-1">{label}</label>
      )}
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setTouche(false)}
        onBlur={() => setTouche(true)}
        placeholder={placeholder}
        aria-invalid={enErreur}
        className={`w-full rounded-lg border p-2 outline-none transition-colors resize-y ${
          enErreur ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
        }`}
      />
      {enErreur ? (
        <p className="text-xs text-red-600 mt-1">{messageVide}</p>
      ) : aide ? (
        <p className="text-xs text-gray-400 mt-1">{aide}</p>
      ) : null}
    </div>
  );
}
