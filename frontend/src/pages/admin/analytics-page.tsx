/**
 * Ancienne page analytics admin — elle interrogeait un endpoint inexistant
 * (`/dashboard`) et n'affichait donc jamais de données. Les chiffres réels
 * de la plateforme sont désormais dans la console admin refondue.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminAnalyticsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin'); }, [router]);
  return null;
}
