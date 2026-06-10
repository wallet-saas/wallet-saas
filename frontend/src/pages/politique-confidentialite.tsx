import Head from 'next/head';
import Link from 'next/link';
import { CreditCard } from 'lucide-react';

export default function PolitiqueConfidentialitePage() {
  return (
    <>
      <Head><title>Politique de confidentialité — Stamply</title></Head>
      <div className="min-h-screen bg-[#0A0A0F] text-slate-200">
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
              <Link href="/register" className="text-sm font-medium bg-white dark:bg-gray-800 text-black px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors">Essayer gratuitement</Link>
            </div>
          </div>
        </nav>

        <main className="pt-24 pb-20 px-6">
          <div className="max-w-2xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">← Retour à l'accueil</Link>
            <h1 className="text-3xl font-bold text-white mb-2">Politique de confidentialité</h1>
            <p className="text-sm text-slate-500 mb-10">Dernière mise à jour : 9 juin 2026 — Conforme RGPD</p>

            <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
              <section>
                <h2 className="text-base font-semibold text-white mb-3">1. Responsable de traitement</h2>
                <p>Le responsable de traitement est <strong className="text-white">GERBER RAEPPEL Jules</strong>, micro-entreprise, Mulhouse, France.</p>
                <p className="mt-2">Pour les données des clients finaux des commerçants, Stamply agit en qualité de <strong className="text-white">sous-traitant RGPD</strong>.</p>
                <p className="mt-2">Contact : <a href="mailto:jules.gerber2@gmail.com" className="text-indigo-400 hover:underline">jules.gerber2@gmail.com</a></p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white mb-3">2. Données collectées</h2>
                <p className="font-medium text-slate-200 mb-2">Commerçants :</p>
                <ul className="space-y-1 pl-4 list-disc list-outside text-slate-400 mb-4">
                  <li>Email, nom enseigne, coordonnées (téléphone, adresse)</li>
                  <li>Données de facturation gérées par Stripe (pas de données bancaires stockées)</li>
                </ul>
                <p className="font-medium text-slate-200 mb-2">Clients fidélité :</p>
                <ul className="space-y-1 pl-4 list-disc list-outside text-slate-400">
                  <li><strong className="text-slate-300">UUID anonyme</strong> — aucun nom, prénom ou email requis</li>
                  <li>Points/visites, dates de passage</li>
                </ul>
                <p className="mt-3 text-slate-500 text-xs">Le système est conçu pour minimiser la collecte de données personnelles.</p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white mb-3">3. Hébergement</h2>
                <ul className="space-y-2 pl-4 list-disc list-outside text-slate-400">
                  <li><strong className="text-slate-300">Supabase</strong> (base de données) : Union Européenne</li>
                  <li><strong className="text-slate-300">Render</strong> (backend) : États-Unis (CCT)</li>
                  <li><strong className="text-slate-300">Vercel</strong> (frontend) : États-Unis (CCT)</li>
                  <li><strong className="text-slate-300">Stripe</strong> (paiement) : pas de données bancaires stockées</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white mb-3">4. Durée de conservation</h2>
                <ul className="space-y-1 pl-4 list-disc list-outside text-slate-400">
                  <li>Données commerçant : durée de l'abonnement + suppression sur demande</li>
                  <li>Données fidélité : tant que le commerçant est actif</li>
                  <li>Logs techniques : 90 jours</li>
                  <li>Facturation : 10 ans (obligation légale)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white mb-3">5. Cookies</h2>
                <p>Stamply <strong className="text-white">n'utilise aucun cookie tiers</strong> publicitaire. Seul un token JWT dans le localStorage pour l'authentification.</p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white mb-3">6. Vos droits (RGPD)</h2>
                <p>Droit d'accès, rectification, effacement, portabilité, opposition. Contact : <a href="mailto:jules.gerber2@gmail.com" className="text-indigo-400 hover:underline">jules.gerber2@gmail.com</a></p>
                <p className="mt-2 text-slate-500 text-xs">Réclamation possible auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">CNIL</a>.</p>
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
