import Head from 'next/head';
import { useLandingTheme } from '@/components/landing/theme';

export default function Contact() {
  const t = useLandingTheme();
  return (
    <>
      <Head>
        <title>Contact - Stamply</title>
        <meta name="description" content="Contactez Stamply pour toute question." />
      </Head>
      <section className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 ${t.sectionBg}`}>
        <h1 className={`text-3xl font-bold mb-6 ${t.textPrimary}`}>Contact</h1>
        <div className={`mt-6 ${t.textSecondary}`}>
          <p>Support client : <a href="mailto:support@stamply.fr" className="underline">support@stamply.fr</a></p>
          <p>Adresse : 123 Rue de la République, 75001 Paris, France</p>
          <p>Téléphone : +33 1 23 45 67 89</p>
          <p>Horaires : Lundi-Vendredi 9h-18h</p>
        </div>
        {/* Optionnel : un petit formulaire de contact */}
        <div className={`mt-8 max-w-xl space-y-4`}>
          <h2 className={`text-lg font-semibold mb-2 ${t.textPrimary}`}>Formulaire de contact</h2>
          <form className={`space-y-4 ${t.border}`}>
            <div>
              <label htmlFor="name" className={`block mb-1 ${t.textSecondary}`}>Nom</label>
              <input id="name" type="text" required className={`w-full px-3 py-2 border rounded ${t.border} ${t.textPrimary} bg-transparent`} />
            </div>
            <div>
              <label htmlFor="email" className={`block mb-1 ${t.textSecondary}`}>Email</label>
              <input id="email" type="email" required className={`w-full px-3 py-2 border rounded ${t.border} ${t.textPrimary} bg-transparent`} />
            </div>
            <div>
              <label htmlFor="message" className={`block mb-1 ${t.textSecondary}`}>Message</label>
              <textarea id="message" rows="4" required className={`w-full px-3 py-2 border rounded ${t.border} ${t.textPrimary} bg-transparent`} />
            </div>
            <button type="submit" className={`w-fit px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-400 transition`}>
              Envoyer
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
