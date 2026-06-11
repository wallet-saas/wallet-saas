'use client';

import Head from 'next/head';
import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function CguPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <>
      <Head><title>Conditions Générales d'Utilisation — Stamply</title></Head>
      <div className={`min-h-screen ${isDark ? 'bg-[#0A0A0F] text-slate-200' : 'bg-white text-gray-900'}`}>
        <nav className={`fixed top-0 left-0 w-full z-50 border-b ${isDark ? 'border-white/5 bg-[#0A0A0F]/80' : 'border-gray-200 bg-white/80'} backdrop-blur-md`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Stamply</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className={`text-sm font-medium ${isDark ? 'text-slate-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Connexion</Link>
              <Link href="/register" className="text-sm font-medium bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-400 transition-colors">Essayer gratuitement</Link>
            </div>
          </div>
        </nav>

        <main className="pt-24 pb-20 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <Link href="/" className={`inline-flex items-center gap-2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} text-sm mb-8 transition-colors`}>
              ← Retour à l'accueil
            </Link>
            <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Conditions Générales d'Utilisation</h1>
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'} mb-10`}>Dernière mise à jour : 11 juin 2026</p>

            <div className={`space-y-8 text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'} leading-relaxed`}>
              <section>
                <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>1. Objet</h2>
                <p>Les présentes conditions générales d'utilisation (CGU) définissent les modalités et conditions dans lesquelles Stamply met à disposition son service de cartes de fidélité digitales (Google Wallet / Apple Wallet) et les conditions d'utilisation de ce service par l'utilisateur.</p>
              </section>

              <section>
                <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>2. Description du service</h2>
                <p>Stamply est un service SaaS B2B permettant aux commerçants de créer et gérer des cartes de fidélité digitales compatibles Google Wallet et Apple Wallet. Le service comprend :</p>
                <ul className={`mt-2 space-y-1 pl-4 list-disc list-outside ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  <li>Création et personnalisation de cartes de fidélité</li>
                  <li>Gestion des tampons et récompenses</li>
                  <li>Scan QR Code en caisse</li>
                  <li>Dashboard analytique</li>
                  <li>Notifications push</li>
                </ul>
              </section>

              <section>
                <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>3. Abonnement</h2>
                <p>Le service Stamply est accessible via un abonnement mensuel de 49€/mois, sans engagement. L'abonnement peut être résilié à tout moment depuis l'espace commerçant. Aucun remboursement n'est effectué pour le mois en cours.</p>
              </section>

              <section>
                <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>4. Responsabilités</h2>
                <p>Stamply s'engage à fournir le service avec diligence et selon les règles de l'art. Stamply ne saurait être tenue responsable des pertes indirectes (perte de données, perte de chiffre d'affaire) résultant de l'utilisation du service.</p>
              </section>

              <section>
                <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>5. Données personnelles</h2>
                <p>Les données collectées sont traitées conformément à notre politique de confidentialité. Les données des commerçants et de leurs clients sont hébergées sur Supabase dans l'Union Européenne.</p>
              </section>

              <section>
                <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>6. Propriété intellectuelle</h2>
                <p>L'interface, le code source, les designs et les contenus de Stamply sont protégés par le droit de la propriété intellectuelle. Toute reproduction sans autorisation est interdite.</p>
              </section>

              <section>
                <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>7. Contact</h2>
                <p>Pour toute question relative aux CGU, contactez-nous : <a href="mailto:jules.gerber2@gmail.com" className="text-indigo-400 hover:underline">jules.gerber2@gmail.com</a></p>
              </section>
            </div>

            <div className={`mt-10 flex flex-wrap justify-center gap-4 text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              <Link href="/mentions-legales" className="hover:opacity-80 transition-opacity">Mentions légales</Link>
              <Link href="/cgu" className="hover:opacity-80 transition-opacity">CGV</Link>
              <Link href="/politique-confidentialite" className="hover:opacity-80 transition-opacity">Confidentialité</Link>
              <Link href="/contact" className="hover:opacity-80 transition-opacity">Contact</Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
