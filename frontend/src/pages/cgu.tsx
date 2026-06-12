import Head from 'next/head';
import { useLandingTheme } from '@/components/landing/theme';

export default function CGV() {
  const t = useLandingTheme();
  return (
    <>
      <Head>
        <title>CGV - Stamply</title>
        <meta name="description" content="Conditions générales de vente du service Stamply." />
      </Head>
      <section className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 ${t.sectionBg}`}>
        <h1 className={`text-3xl font-bold mb-6 ${t.textPrimary}`}>Conditions Générales de Vente</h1>
        <div className={`space-y-4 ${t.textSecondary}`}>
          <p>1. Abonnement mensuel à 49€. Pas de Engagement. Annulation possible à tout moment.</p>
          <p>2. L'accès au service est immédiat après paiement.</p>
          <p>3. Les données sont hébergées en France (Supabase).</p>
          <p>4. Stamply se réserve le droit de modifier les fonctionnalités du service.</p>
        </div>
      </section>
    </>
  );
}
