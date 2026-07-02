import Head from "next/head";

export default function PolitiqueConfidentialite() {
  return (
    <>
      <Head>
        <title>Politique de confidentialité - Stamply</title>
        <meta name="description" content="Politique de confidentialité du service Stamply, conforme au RGPD." />
      </Head>
      <section className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0F] text-slate-200">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-white">Politique de confidentialité</h1>
          <p className="text-slate-500 mb-8">Dernière mise à jour : 12 juin 2026</p>
          
          <div className="space-y-8 text-slate-400 leading-relaxed">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">1. Responsable de traitement</h2>
              <p>Le responsable du traitement des données est Stamply, représenté par BOZO. Contact : <a href="mailto:support@stamply.fr" className="text-indigo-400 hover:text-indigo-300 underline">support@stamply.fr</a></p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">2. Données collectées</h2>
              <p>Stamply collecte uniquement les données nécessaires à l'utilisation du service :</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li><strong>Données du commerçant :</strong> nom, email, adresse, SIRET, téléphone</li>
                <li><strong>Données clients du commerçant :</strong> nom, email, historique de points de fidélité (fournies volontairement par le commerçant)</li>
                <li><strong>Données de navigation :</strong> cookies techniques strictement nécessaires au fonctionnement du service</li>
                <li><strong>Données de l'appareil :</strong> token d'installation pour les notifications push (avec consentement de l'utilisateur final)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">3. Finalités du traitement</h2>
              <p>Les données sont utilisées exclusivement pour :</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Fournir et améliorer le service de cartes de fidélité digitales</li>
                <li>Gérer les comptes commerçants et l'authentification</li>
                <li>Envoyer des notifications push aux clients finaux (avec leur consentement)</li>
                <li>Générer des statistiques anonymisées sur l'utilisation du service</li>
                <li>Assurer le support client</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">4. Hébergement et sécurité</h2>
              <p>Les données sont stockées chez <strong className="text-white">Supabase</strong> (infrastructure cloud UE, région Francfort). Elles sont chiffrées au repos (AES-256) et en transit (TLS 1.3). Les accès sont restreints, tracés et soumis à une authentification forte.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">5. Sous-traitants</h2>
              <p>Stamply fait appel aux sous-traitants suivants :</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li><strong>Supabase</strong> — Base de données et authentification (UE)</li>
                <li><strong>Whop</strong> — Paiement (certifié PCI DSS)</li>
                <li><strong>Firebase (Google)</strong> — Notifications push (États-Unis, clauses contractuelles types)</li>
                <li><strong>Vercel</strong> — Hébergement frontend (États-Unis, clauses contractuelles types)</li>
                <li><strong>Render</strong> — Hébergement backend (États-Unis, clauses contractuelles types)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">6. Durée de conservation</h2>
              <p>Les données sont conservées pendant la durée de l'abonnement. En cas de résiliation, les données sont supprimées dans un délai de 30 jours. Les données de facturation sont conservées 10 ans conformément aux obligations légales françaises.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">7. Vos droits (RGPD)</h2>
              <p>Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez des droits suivants :</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li><strong>Droit d'accès</strong> — Obtenir une copie de vos données</li>
                <li><strong>Droit de rectification</strong> — Corriger vos données inexactes</li>
                <li><strong>Droit à l'effacement</strong> — Demander la suppression de vos données</li>
                <li><strong>Droit à la portabilité</strong> — Recevoir vos données dans un format structuré</li>
                <li><strong>Droit d'opposition</strong> — Vous opposer au traitement de vos données</li>
                <li><strong>Droit de limitation</strong> — Demander la limitation du traitement</li>
              </ul>
              <p className="mt-2">Pour exercer vos droits, contactez-nous à : <a href="mailto:support@stamply.fr" className="text-indigo-400 hover:text-indigo-300 underline">support@stamply.fr</a>. Nous répondrons dans un délai de 30 jours.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">8. Cookies</h2>
              <p>Stamply utilise uniquement des cookies techniques strictement nécessaires au fonctionnement du service (session, authentification). Aucun cookie publicitaire ou de tracking n'est utilisé. Aucun consentement n'est requis pour ces cookies essentiels.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">9. Modifications</h2>
              <p>Stamply se réserve le droit de modifier la présente politique de confidentialité. Toute modification substantielle sera notifiée par email aux commerçants inscrits.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
