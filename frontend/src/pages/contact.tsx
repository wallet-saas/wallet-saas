import Head from "next/head";

export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact - Stamply</title>
        <meta name="description" content="Contactez Stamply pour toute question sur notre service de cartes de fidélité digitales." />
      </Head>
      <section className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0F] text-slate-200">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-white">Contact</h1>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6 text-slate-400">
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">Email</h2>
                <a href="mailto:support@stamply.fr" className="text-indigo-400 hover:text-indigo-300 transition-colors">support@stamply.fr</a>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">Adresse</h2>
                <p>Stamply SASU<br/>123 Rue de la République<br/>75001 Paris, France</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">Horaires du support</h2>
                <p>Lundi — Vendredi : 9h00 à 18h00</p>
                <p>Heure de Paris (UTC+1 / UTC+2 en été)</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">Réponse garantie</h2>
                <p>Nous nous engageons à répondre à toute demande sous 24 heures ouvrées.</p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Envoyez-nous un message</h2>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Merci pour votre message ! Nous vous répondrons rapidement à support@stamply.fr');
                }}
              >
                <div>
                  <label htmlFor="name" className="block text-sm mb-1 text-slate-400">Nom complet</label>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Votre nom"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm mb-1 text-slate-400">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="votre@email.com"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="sujet" className="block text-sm mb-1 text-slate-400">Sujet</label>
                  <select
                    id="sujet"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Choisir un sujet</option>
                    <option value="demo">Demander une démo</option>
                    <option value="tarifs">Question sur les tarifs</option>
                    <option value="technique">Support technique</option>
                    <option value="partenariat">Partenariat</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm mb-1 text-slate-400">Message</label>
                  <textarea
                    id="message"
                    rows={5}
                    required
                    placeholder="Décrivez votre demande..."
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-400 transition-colors font-medium shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                >
                  Envoyer le message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
