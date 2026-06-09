import Head from 'next/head';
import Link from 'next/link';
import { CreditCard } from 'lucide-react';

export default function CguPage() {
  return (
    <>
      <Head><title>Conditions Générales d'Utilisation — Stamply</title></Head>
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
              <Link href="/register" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors">Essayer gratuitement</Link>
            </div>
          </div>
        </nav>

        <main className="pt-24 pb-20 px-6">
          <div className="max-w-2xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">← Retour à l'accueil</Link>
            <h1 className="text-3xl font-bold text-white mb-2">Conditions Générales d'Utilisation</h1>
            <p className="text-sm text-slate-500 mb-10">Dernière mise à jour : 9 juin 2026</p>

            <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
              <section>
                <h2 className="text-base font-semibold text-white mb-3">Article 1 — Objet</h2>
                <p>Les présentes CGU régissent l'accès et l'utilisation de <strong className="text-white">Stamply</strong>, service SaaS B2B de gestion de cartes de fidélité digitales compatibles Apple Wallet et Google Wallet, édité par GERBER RAEPPEL Jules, micro-entreprise établie à Mulhouse, France.</p>
                <p className="mt-2">Toute souscription à un abonnement Stamply implique l'acceptation sans réserve des présentes CGU.</p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white mb-3">Article 2 — Accès au service</h2>
                <p>L'accès à la plateforme est réservés aux professionnels disposant d'un compte validé. L'accès complet est conditionné à la souscription d'un abonnement actif. Chaque compte est strictement personnel.</p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white mb-3">Article 3 — Prix et paiement</h2>
                <p>L'abonnement est de <strong className="text-white">49 € HT par mois</strong>. Le paiement est effectué via <strong className="text-white">Stripe</strong>. Stamply ne stocke aucune donnée bancaire.</p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white mb-3">Article 4 — Durée et résiliation</h2>
                <p>Aucun engagement de durée minimale. Résiliation possible à tout moment depuis le tableau de bord ou par email à <a href="mailto:jules.gerber2@gmail.com" className="text-indigo-400 hover:underline">jules.gerber2@gmail.com</a>. Effet à la fin de la période en cours.</p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white mb-3">Article 5 — Obligations du commerçant</h2>
                <ul className="mt-2 space-y-1 pl-4 list-disc list-outside text-slate-400">
                  <li>Utiliser la plateforme conformément à sa destination légale</li>
                  <li>Informer ses clients de la collecte de données (RGPD)</li>
                  <li>Agir en qualité de responsable de traitement pour ses clients fidélité</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white mb-3">Article 6 — Responsabilités</h2>
                <p>Stamply agit en tant que sous-traitant RGPD. La responsabilité de Stamply est limitée au montant des sommes versées par le commerçant au cours du mois précédent le fait générateur.</p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white mb-3">Article 7 — Propriété intellectuelle</h2>
                <p>La plateforme Stamply est la propriété exclusive de GERBER RAEPPEL Jules. Le commerçant conserve la propriété des données qu'il génère.</p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white mb-3">Article 8 — Droit applicable</h2>
                <p>Les présentes CGU sont soumises au <strong className="text-white">droit français</strong>. Tribunaux compétents : <strong className="text-white">Tribunal de Mulhouse (68)</strong>.</p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-white mb-3">Contact</h2>
                <p><a href="mailto:jules.gerber2@gmail.com" className="text-indigo-400 hover:underline">jules.gerber2@gmail.com</a></p>
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
