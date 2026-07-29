/**
 * Ancienne interface commerçant — remplacée par /dashboard.
 *
 * Ces pages appelaient des endpoints qui n'existent pas (visites-hebdo, clients-top, revenus-estimes) et
 * affichaient donc des écrans vides. Elles redirigent désormais vers
 * l'interface actuelle pour éviter qu'un commerçant y atterrisse par accident.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { PageSpinner } from '@/components/ui/Spinner';

export default function AncienneInterface() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard'); }, [router]);
  return <PageSpinner />;
}
