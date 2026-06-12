import Head from "next/head";

export default function MentionsLegales() {
  return (
    <>
      <Head>
        <title>Mentions légales - Stamply</title>
        <meta name="description" content="Mentions légales du service Stamply, SaaS B2B cartes de fidélité digitales." />
      </Head>
      <section className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0F] text-slate-200">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-white">Mentions légales</h1>
          
          <div className="space-y-8 text-slate-400 leading-relaxed">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Éditeur du site</h2>
              <p>Stamply — Projet développé par BOZO</p>
              <p>France</p>
              <p>Email : <a href="mailto:support@stamply.fr" className="text-indigo-400 hover:text-indigo-300 underline">support@stamply.fr</a></p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Directeur de la publication</h2>
              <p>BOZO, fondateur de Stamply</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Hébergement</h2>
              <p><strong>Frontend :</strong> Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</p>
              <p><strong>Backend :</strong> Render.com, 520 3rd Street, Suite 201, San Francisco, CA 94107, États-Unis</p>
              <p><strong>Base de données :</strong> Supabase (infrastructure UE, région Francfort)</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Contact</h2>
              <p>Email : <a href="mailto:support@stamply.fr" className="text-indigo-400 hover:text-indigo-300 underline">support@stamply.fr</a></p>
              <p>Téléphone : +33 1 23 45 67 89</p>
              <p>Horaires : Lundi au Vendredi, 9h00 – 18h00 (heure de Paris)</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Propriété intellectuelle</h2>
              <p>L'ensemble du contenu du site stamply-gamma.vercel.app (textes, images, graphismes, logo, icônes, logiciels, etc.) est protégé par le droit de la propriété intellectuelle en vigueur en France. Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site est interdite sans l'autorisation écrite préalable de Stamply SASU.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Crédits</h2>
              <p>Conception et développement : Stamply SASU</p>
              <p>Images et photographies : Stock photos sous licence (Pexels, Unsplash)</p>
              <p>Icônes : Lucide React</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
