/**
 * Raccourci /employe — ouvre la page de connexion sur l'onglet Équipe.
 * Adresse simple à retenir et à mettre en favori par les salariés.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { PageSpinner } from '@/components/ui/Spinner';

export default function EmployeLoginRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/login?mode=employe'); }, [router]);
  return <PageSpinner />;
}
