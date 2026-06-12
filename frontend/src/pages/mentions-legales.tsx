import Head from 'next/head';
import { useLandingTheme } from '@/components/landing/theme';

export default function MentionsLegales() {
  const t = useLandingTheme();
  return (
    <>
      <Head>
        <title>Mentions légales - Stamply</title>
        <meta name="description" content="Mentions légales du service Stamply, SaaS B2B cartes de fidélité digitales." />
      </Head>
      <section className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 ${t.sectionBg}`}>
        <h1 className={`text-3xl font-bold mb-6 ${t.textPrimary}`}>Mentions légales</h1>
        <p className={`text-base ${t.textSecondary}`}>Stamply SASU – 123 Rue de la République, 75001 Paris – France.</p>
        <p className={`mt-4 ${t.textSecondary}`}>SIRET : 123 456 789 00010 – TVA intra-communautaire : FR12345678901.</p>
        <p className={`mt-4 ${t.textSecondary}`}>Responsable éditorial : BOZO, fondateur.</p>
        <p className={`mt-4 ${t.textSecondary}`}>Contact : support@stamply.fr.</p>
        {/* Add more legal text as needed */}
      </section>
    </>
  );
}
