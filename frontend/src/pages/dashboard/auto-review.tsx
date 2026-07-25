/**
 * Ancienne page "Avis automatiques" — fusionnée avec la page Avis Google.
 * Les paramètres de collecte, le feedback interne et les avis publics sont
 * désormais réunis sous /dashboard/avis (onglets Paramètres / Avis Google /
 * Feedback interne / Modèles de réponse).
 */
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { PageSpinner } from '@/components/ui/Spinner';

export default function AutoReviewRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/avis'); }, [router]);
  return <PageSpinner />;
}
