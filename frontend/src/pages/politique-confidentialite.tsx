import Head from 'next/head';
import { useLandingTheme } from '@/components/landing/theme';

export default function PolitiqueConfidentialite() {
  const t = useLandingTheme();
  return (
    <>
      <Head>
        <title>Confidentialité - Stamply</title>
        <meta name="description" content="Politique de confidentialité du service Stamply." />
      </Head>
      <section className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 ${t.sectionBg}`}>
        <h1 className={`text-3xl font-bold mb-6 ${t.textPrimary}`}>Politique de confidentialité</h1>
        <div className={`space-y-4 ${t.textSecondary}`}>
          <p>1. Stamply collecte uniquement les données nécessaires à l'utilisation du service.</p>
          <p>2. Les données sont stockées chez Supabase et sécurisées par chiffrement.</p>
          <p>3. Vous pouvez demander la suppression de vos données à tout moment.</p>
          <p>4. Les données clients sont utilisées uniquement pour la gestion du service.</p>
        </div>
      </section>
    </>
  );
}
