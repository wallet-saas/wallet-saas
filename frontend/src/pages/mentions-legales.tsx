import Head from 'next/head';
import Link from 'next/link';
import { CreditCard } from 'lucide-react';

export default function MentionsLegalesPage() {
  return (
    <>
      <Head><title>Mentions légales — Stamply</title></Head>
      <div className="min-h-screen bg-[#0A0A0F] text-slate-200">
        {/* Nav */}
        <nav className="fixed top-0 left-0 w-full z-50 border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">Stamply</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Connexion</Link>
              <Link href="/register" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors">Essayer gratuitement</Link>
            </div>
          </div>
        </nav>

        <main className="pt-24 pb-20 px-6">
          <div className="max-w-2xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
              ← Retour à l'accueil
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">Mentions légales</h1>
            <p className="text-sm text-slate-500 mb-10">Dernière mise à jour : 9 juin 2026</p>

            <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
              <section>
                <h2 className="text-base font-semibold text-white mb-3">1. Éditeur du site</h2>
                <p>Le site <strong className="text-white">stamply.fr</strong> est édité par :</p>
                <ul className="mt-2 space-y-1 pl-4 list-disc list-outside text-slate-400">
                  <li><strong className="text-slate-300">Nom :</strong> GERBER RAEPPEL Jules</li>
                  <li><strong className="text-slate-300">Forme juridique :</strong> Micro-entreprise</li>
                  <li><strong className="text-slate-300">Marque commerciale :</strong> Stamply</li>
                  <li><strong className="text-slate-300">Siège :</strong> Mulhouse, France</li>
                  <li><strong className="text-slate-300">Email :</strong> <a href="mailto:jules.gerber2@gmail.com" className="text-indigo-400 hover:underline">jules.gerber2@gmail.com</a></li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white mb-3">2. Directeur de la publication</h2>
                <p>Le directeur de la publication est <strong className="text-white">GERBER RAEPPEL Jules</strong>.</p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white mb-3">3. Hébergement</h2>
                <div className="mt-3 space-y-4">
                  <div>
                    <p className="font-medium text-slate-200">Frontend — Vercel Inc.</p>
                    <p className="text-slate-500 text-xs mt-0.5">440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">vercel.com</a></p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">Backend — Render Inc.</p>
                    <p className="text-slate-500 text-xs mt-0.5">San Francisco, CA, États-Unis — <a href="https://render.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">render.com</a></p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">Base de données — Supabase Inc.</p>
                    <p className="text-slate-500 text-xs mt-0.5">Données hébergées dans l'Union Européenne — <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">supabase.com</a></p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white mb-3">4. Propriété intellectuelle</h2>
                <p>L'ensemble des contenus présents sur le site Stamply (textes, images, logos, interface, code source) sont la propriété exclusive de GERBER RAEPPEL Jules et sont protégés par le droit français de la propriété intellectuelle.</p>
                <p className="mt-2">Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans autorisation écrite préalable est strictement interdite.</p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white mb-3">5. Contact</h2>
                <p>Pour toute question relative au site, vous pouvez nous contacter par email : <a href="mailto:jules.gerber2@gmail.com" className="text-indigo-400 hover:underline">jules.gerber2@gmail.com</a></p>
              </section>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-4 text-xs text-slate-500">
              <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
              <Link href="/cgu" className="hover:text-white transition-colors">CGU</Link>
              <Link href="/politique-confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
