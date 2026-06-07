import Head from 'next/head';
import Link from 'next/link';
import { CreditCard } from 'lucide-react';

export default function PolitiqueConfidentialitePage() {
  return (
    <>
      <Head><title>Politique de confidentialité — Stamply</title></Head>
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
            <h1 className="text-2xl font-bold text-gray-900">Politique de confidentialité</h1>
            <p className="text-sm text-gray-500 mt-1">Dernière mise à jour : 26 avril 2026 — Conforme RGPD</p>
          </div>

          <div className="card p-8 space-y-8 text-sm text-gray-700 leading-relaxed">

            {/* Article 1 */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">1. Responsable de traitement</h2>
              <p>
                Le responsable de traitement des données des <strong>commerçants</strong> utilisant la plateforme Stamply est :
              </p>
              <ul className="mt-2 space-y-1 pl-4 list-disc list-outside text-gray-600">
                <li><strong>GERBER RAEPPEL Jules</strong> — Micro-entreprise</li>
                <li>Mulhouse, France</li>
                <li>Email : <a href="mailto:jules.gerber2@gmail.com" className="text-primary-600 hover:underline">jules.gerber2@gmail.com</a></li>
              </ul>
              <p className="mt-3">
                Concernant les données des <strong>clients finaux des commerçants</strong> (porteurs de carte de fidélité), Stamply agit en qualité de <strong>sous-traitant RGPD</strong>. Le commerçant reste responsable de traitement vis-à-vis de ses propres clients.
              </p>
            </section>

            {/* Article 2 */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">2. Données collectées</h2>

              <p className="font-medium text-gray-800 mb-2">2.1 Données des commerçants (compte Stamply)</p>
              <ul className="space-y-1 pl-4 list-disc list-outside text-gray-600 mb-4">
                <li>Adresse email (identifiant de connexion)</li>
                <li>Nom de l'enseigne</li>
                <li>Numéro SIREN (optionnel)</li>
                <li>Coordonnées : téléphone, adresse, ville, code postal (facultatif)</li>
                <li>Données de facturation gérées par Stripe (Stamply n'accède pas aux données bancaires)</li>
              </ul>

              <p className="font-medium text-gray-800 mb-2">2.2 Données des clients fidélité (porteurs de carte)</p>
              <ul className="space-y-1 pl-4 list-disc list-outside text-gray-600">
                <li><strong>UUID anonyme</strong> généré automatiquement — aucun nom, prénom ou email n'est requis</li>
                <li>Nombre de points ou de visites enregistrés</li>
                <li>Date des passages (horodatage)</li>
              </ul>
              <p className="mt-2 text-gray-500 text-xs">
                Le système de fidélité Stamply est conçu pour minimiser la collecte de données personnelles. Aucune donnée d'identité n'est requise pour bénéficier d'une carte de fidélité.
              </p>
            </section>

            {/* Article 3 */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">3. Finalités et bases légales</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-2 border border-gray-100 font-semibold text-gray-600">Finalité</th>
                      <th className="text-left p-2 border border-gray-100 font-semibold text-gray-600">Base légale</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-gray-100">Gestion du compte commerçant</td>
                      <td className="p-2 border border-gray-100">Exécution du contrat</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-2 border border-gray-100">Facturation et paiement</td>
                      <td className="p-2 border border-gray-100">Exécution du contrat / obligation légale</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-gray-100">Fonctionnement du programme de fidélité</td>
                      <td className="p-2 border border-gray-100">Intérêt légitime / instructions du commerçant</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-2 border border-gray-100">Sécurité et logs techniques</td>
                      <td className="p-2 border border-gray-100">Intérêt légitime</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Article 4 */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">4. Hébergement et transferts de données</h2>
              <ul className="space-y-3 pl-4 list-disc list-outside text-gray-600">
                <li>
                  <strong>Supabase</strong> (base de données) : données hébergées dans l'<strong>Union Européenne</strong>. Conformité RGPD native.
                </li>
                <li>
                  <strong>Railway</strong> (serveur backend) : hébergé aux <strong>États-Unis</strong>. Le transfert est encadré par les Clauses Contractuelles Types (CCT) de la Commission européenne.
                </li>
                <li>
                  <strong>Vercel</strong> (frontend) : hébergé aux <strong>États-Unis</strong>. Même encadrement par CCT. Le frontend ne traite pas de données personnelles sensibles.
                </li>
                <li>
                  <strong>Stripe</strong> (paiement) : traitement des données de paiement soumis à la politique de confidentialité de Stripe. Stamply ne stocke aucune donnée bancaire.
                </li>
              </ul>
            </section>

            {/* Article 5 */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">5. Durée de conservation</h2>
              <ul className="space-y-1 pl-4 list-disc list-outside text-gray-600">
                <li>Données du compte commerçant : conservées pendant la durée de l'abonnement et supprimées sur demande.</li>
                <li>Données de fidélité des clients : conservées tant que le commerçant est actif ; supprimées à la clôture du compte.</li>
                <li>Logs techniques et de sécurité : 90 jours glissants.</li>
                <li>Données de facturation : 10 ans (obligation légale comptable).</li>
              </ul>
            </section>

            {/* Article 6 */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">6. Cookies et stockage local</h2>
              <p>
                Stamply <strong>n'utilise aucun cookie tiers</strong> à des fins publicitaires ou de traçage.
              </p>
              <p className="mt-2">
                La session de connexion est gérée via un <strong>token JWT</strong> stocké dans le <code className="bg-gray-100 px-1 rounded text-xs">localStorage</code> du navigateur. Ce token est utilisé exclusivement pour authentifier les requêtes vers l'API Stamply.
              </p>
            </section>

            {/* Article 7 */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">7. Droits des personnes concernées</h2>
              <p>
                Conformément au RGPD (Règlement UE 2016/679), vous disposez des droits suivants concernant vos données personnelles :
              </p>
              <ul className="mt-2 space-y-1 pl-4 list-disc list-outside text-gray-600">
                <li><strong>Droit d'accès</strong> : obtenir une copie de vos données</li>
                <li><strong>Droit de rectification</strong> : corriger des données inexactes</li>
                <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données</li>
                <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
                <li><strong>Droit d'opposition</strong> : vous opposer à certains traitements</li>
              </ul>
              <p className="mt-3">
                Pour exercer ces droits, contactez :{' '}
                <a href="mailto:jules.gerber2@gmail.com" className="text-primary-600 hover:underline">
                  jules.gerber2@gmail.com
                </a>
              </p>
              <p className="mt-2 text-gray-500 text-xs">
                Vous avez également le droit d'introduire une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">cnil.fr</a>.
              </p>
            </section>

            {/* Article 8 */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">8. Sécurité</h2>
              <p>
                Stamply met en œuvre des mesures techniques et organisationnelles adaptées pour protéger les données contre tout accès non autorisé, perte ou altération : chiffrement en transit (HTTPS/TLS), authentification par token, accès restreint à la base de données.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">9. Contact</h2>
              <p>
                Pour toute question relative à cette politique de confidentialité :{' '}
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
