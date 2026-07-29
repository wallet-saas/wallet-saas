/**
 * Session employé — qui est en poste sur cette caisse.
 *
 * La tablette reste connectée au compte du commerçant. En début de service,
 * l'employé saisit son PIN : on retient qui il est pour attribuer ses scans
 * et limiter son accès aux modules autorisés. La session dure jusqu'à ce
 * qu'on en change ou qu'on la ferme — pas de PIN à ressaisir à chaque client.
 */
import { useState, useEffect, useCallback } from 'react';

const CLE = 'stamply_employe_session';

export type EmployeSession = {
  id: string;
  prenom: string;
  permissions: string[];
  debut: number;
};

export function lireSession(): EmployeSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return null;
    const s = JSON.parse(brut) as EmployeSession;
    return s?.id ? s : null;
  } catch {
    return null;
  }
}

export function ouvrirSession(employe: { id: string; prenom: string; permissions: string[] }) {
  if (typeof window === 'undefined') return;
  const session: EmployeSession = { ...employe, debut: Date.now() };
  localStorage.setItem(CLE, JSON.stringify(session));
  window.dispatchEvent(new Event('stamply-employe-change'));
}

export function fermerSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CLE);
  window.dispatchEvent(new Event('stamply-employe-change'));
}

/** Hook réactif : suit la session en cours, y compris entre onglets. */
export function useEmployeSession() {
  const [session, setSession] = useState<EmployeSession | null>(null);

  const rafraichir = useCallback(() => setSession(lireSession()), []);

  useEffect(() => {
    rafraichir();
    window.addEventListener('stamply-employe-change', rafraichir);
    window.addEventListener('storage', rafraichir);
    return () => {
      window.removeEventListener('stamply-employe-change', rafraichir);
      window.removeEventListener('storage', rafraichir);
    };
  }, [rafraichir]);

  return { session, ouvrirSession, fermerSession, rafraichir };
}
