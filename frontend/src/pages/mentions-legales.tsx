import Head from 'next/head';

export default function MentionsLegales() {
  return (
    <>
      <Head>
        <title>Mentions légales - Stamply</title>
        <meta name="description" content="Mentions légales du service Stamply, SaaS B2B cartes de fidélité digitales." />
      </Head>
      <section className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0A0F] text-slate-200">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-white">Mentions légales</h1>
          
          <div className="space-y-6 text-slate-400">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Éditeur du site</h2>
              <p>Stamply SASU</p>
              <p>123 Rue de la République, 75001 Paris, France</p>
              <p>SIRET : 123 456 789 00010</p>
              <p>TVA intracommunautaire : FR12345678901</p>
              <p>Capital social : 1 000€</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Directeur de la publication</h2>
              <p>BOZO, fondateur de Stamply</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Hébergement</h2>
              <p>Frontend : Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
              <p>Backend : Render.com</p>
              <p>Base de données : Supabase (UE)</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Contact</h2>
              <p>Email : support@stamply.fr</p>
              <p>Téléphone : +33 1 23 45 67 89</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Propriété intellectuelle</h2>
              <p>L'ensemble du contenu du site stamply-gamma.vercel.app (textes, images, logos, etc.) est protégé par le droit de la propriété intellectuelle. Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site est interdite sans l'autorisation écrite préalable de Stamply.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
