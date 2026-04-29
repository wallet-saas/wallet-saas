import Head from 'next/head';
import Link from 'next/link';
import { CreditCard } from 'lucide-react';

export default function CguPage() {
  return (
    <>
      <Head><title>Conditions Générales d'Utilisation — Stamply</title></Head>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <Link href="/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
              <span>← Retour</span>
            </Link>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Stamply</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Conditions Générales d'Utilisation</h1>
            <p className="text-sm text-gray-500 mt-1">Dernière mise à jour : 26 avril 2026</p>
          </div>

          <div className="card p-8 space-y-8 text-sm text-gray-700 leading-relaxed">

            {/* Article 1 */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Article 1 — Objet</h2>
              <p>
                Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et l'utilisation de la plateforme <strong>Stamply</strong>, service SaaS B2B de gestion de cartes de fidélité digitales compatibles Apple Wallet et Google Wallet, édité par GERBER RAEPPEL Jules, micro-entreprise établie à Mulhouse, France.
              </p>
              <p className="mt-2">
                Toute souscription à un abonnement Stamply implique l'acceptation sans réserve des présentes CGU.
              </p>
            </section>

            {/* Article 2 */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Article 2 — Accès au service</h2>
              <p>
                L'accès à la plateforme Stamply est réservé aux professionnels (commerçants, artisans, prestataires de services) disposant d'un compte validé.
              </p>
              <p className="mt-2">
                Pour créer un compte, le commerçant doit fournir un nom d'enseigne, une adresse email valide et un mot de passe sécurisé. L'accès complet aux fonctionnalités est conditionné à la souscription d'un abonnement actif.
              </p>
              <p className="mt-2">
                Chaque compte est strictement personnel. Le commerçant est responsable de la confidentialité de ses identifiants de connexion.
              </p>
            </section>

            {/* Article 3 */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Article 3 — Prix et paiement</h2>
              <p>
                L'abonnement Stamply est proposé au tarif de <strong>49 € HT par mois</strong> (montant susceptible d'évoluer, avec information préalable de 30 jours).
              </p>
              <p className="mt-2">
                Le paiement est effectué via <strong>Stripe</strong>, prestataire de paiement sécurisé. Stamply ne stocke aucune donnée bancaire. Le prélèvement intervient à chaque début de période mensuelle.
              </p>
              <p className="mt-2">
                En cas d'échec de paiement, l'accès au service peut être suspendu jusqu'à régularisation.
              </p>
            </section>

            {/* Article 4 */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Article 4 — Durée et résiliation</h2>
              <p>
                L'abonnement est souscrit sans engagement de durée minimale. Il est renouvelé tacitement chaque mois.
              </p>
              <p className="mt-2">
                Le commerçant peut résilier son abonnement à tout moment depuis l'espace « Abonnement » de son tableau de bord ou en contactant <a href="mailto:jules.gerber2@gmail.com" className="text-primary-600 hover:underline">jules.gerber2@gmail.com</a>. La résiliation prend effet à la fin de la période mensuelle en cours.
              </p>
              <p className="mt-2">
                Stamply se réserve le droit de résilier un compte en cas de manquement grave aux présentes CGU, sans remboursement de la période en cours.
              </p>
            </section>

            {/* Article 5 */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Article 5 — Obligations du commerçant</h2>
              <p>Le commerçant s'engage à :</p>
              <ul className="mt-2 space-y-1 pl-4 list-disc list-outside text-gray-600">
                <li>Utiliser la plateforme conformément à sa destination légale et aux présentes CGU.</li>
                <li>Ne pas tenter d'accéder de manière non autorisée aux systèmes de Stamply.</li>
                <li>Informer ses propres clients de la collecte de leurs données dans le cadre du programme de fidélité, conformément au RGPD.</li>
                <li>Agir en qualité de <strong>responsable de traitement</strong> vis-à-vis des données personnelles de ses clients fidélité.</li>
                <li>Ne pas utiliser le service à des fins illicites ou frauduleuses.</li>
              </ul>
            </section>

            {/* Article 6 */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Article 6 — Responsabilités de Stamply</h2>
              <p>
                Stamply s'engage à mettre en œuvre les moyens raisonnables pour assurer la disponibilité et la sécurité de la plateforme. Stamply agit en tant que <strong>sous-traitant RGPD</strong> pour les données des clients finaux des commerçants.
              </p>
              <p className="mt-2">
                Stamply ne peut être tenu responsable des interruptions de service dues à des opérations de maintenance, à des défaillances des prestataires d'hébergement (Vercel, Railway, Supabase) ou à des événements indépendants de sa volonté (force majeure).
              </p>
              <p className="mt-2">
                La responsabilité de Stamply est limitée au montant des sommes effectivement versées par le commerçant au cours du mois précédant le fait générateur du dommage.
              </p>
            </section>

            {/* Article 7 */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Article 7 — Propriété intellectuelle</h2>
              <p>
                La plateforme Stamply, son interface, ses algorithmes, son code source et tous les éléments qui la composent sont la propriété exclusive de GERBER RAEPPEL Jules. L'abonnement confère au commerçant un droit d'usage personnel, non exclusif et non transférable.
              </p>
              <p className="mt-2">
                Le commerçant conserve la propriété des données qu'il génère via la plateforme (données de son enseigne, données de fidélité de ses clients).
              </p>
            </section>

            {/* Article 8 */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Article 8 — Modification des CGU</h2>
              <p>
                Stamply se réserve le droit de modifier les présentes CGU à tout moment. Les commerçants seront informés par email au moins 15 jours avant l'entrée en vigueur des nouvelles conditions. La poursuite de l'utilisation du service après cette date vaut acceptation des nouvelles CGU.
              </p>
            </section>

            {/* Article 9 */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Article 9 — Droit applicable et juridiction compétente</h2>
              <p>
                Les présentes CGU sont soumises au <strong>droit français</strong>. En cas de litige, et à défaut de résolution amiable, les tribunaux compétents seront ceux du ressort du <strong>Tribunal de Mulhouse (68)</strong>.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Contact</h2>
              <p>
                Pour toute question relative aux présentes CGU :{' '}
                <a href="mailto:jules.gerber2@gmail.com" className="text-primary-600 hover:underline">
                  jules.gerber2@gmail.com
                </a>
              </p>
            </section>
          </div>

          {/* Footer liens */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-gray-400">
            <Link href="/mentions-legales" className="hover:text-gray-600">Mentions légales</Link>
            <Link href="/cgu" className="hover:text-gray-600">CGU</Link>
            <Link href="/politique-confidentialite" className="hover:text-gray-600">Confidentialité</Link>
          </div>
        </div>
      </div>
    </>
  );
}
