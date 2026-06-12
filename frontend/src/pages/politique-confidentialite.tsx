import Head from 'next/head';

export default function PolitiqueConfidentialite() {
  return (
    <>
      <Head>
        <title>Confidentialité - Stamply</title>
        <meta name="description" content="Politique de confidentialité du service Stamply." />
      </Head>
      <section className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0A0F] text-slate-200">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-white">Politique de confidentialité</h1>
          
          <div className="space-y-6 text-slate-400">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">1. Responsable de traitement</h2>
              <p>Le responsable du traitement des données est Stamply SASU, 123 Rue de la République, 75001 Paris, France.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">2. Données collectées</h2>
              <p>Stamply collecte uniquement les données nécessaires à l'utilisation du service :</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Données du commerçant : nom, email, adresse, SIRET</li>
                <li>Données clients : nom, email, historique de points (fournies par le commerçant)</li>
                <li>Données de navigation : cookies techniques uniquement</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">3. Hébergement et sécurité</h2>
              <p>Les données sont stockées chez Supabase (infrastructure UE) et sont chiffrées au repos et en transit. Les accès sont restreints et tracés.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">4. Vos droits</h2>
              <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Contactez-nous à support@stamply.fr pour exercer vos droits.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">5. Conservation des données</h2>
              <p>Les données sont conservées pendant la durée de l'abonnement et supprimées dans un délai de 30 jours après la résiliation.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
