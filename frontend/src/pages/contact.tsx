import Head from 'next/head';

export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact - Stamply</title>
        <meta name="description" content="Contactez Stamply pour toute question." />
      </Head>
      <section className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0A0F] text-slate-200">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-white">Contact</h1>
          
          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-4 text-slate-400">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Email</h2>
                <a href="mailto:support@stamply.fr" className="hover:text-indigo-400 transition-colors">support@stamply.fr</a>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Adresse</h2>
                <p>123 Rue de la République<br/>75001 Paris, France</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Horaires</h2>
                <p>Lundi — Vendredi : 9h à 18h</p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Envoyez-nous un message</h2>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Merci pour votre message ! Nous vous répondrons rapidement.'); }}>
                <div>
                  <label htmlFor="name" className="block text-sm mb-1 text-slate-400">Nom</label>
                  <input id="name" type="text" required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm mb-1 text-slate-400">Email</label>
                  <input id="email" type="email" required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm mb-1 text-slate-400">Message</label>
                  <textarea id="message" rows={5} required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <button type="submit" className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 transition-colors font-medium">
                  Envoyer
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
