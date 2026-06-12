import Head from 'next/head';

export default function CGV() {
  return (
    <>
      <Head>
        <title>CGV - Stamply</title>
        <meta name="description" content="Conditions générales de vente du service Stamply." />
      </Head>
      <section className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0A0F] text-slate-200">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-white">Conditions Générales de Vente</h1>
          
          <div className="space-y-6 text-slate-400">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Article 1 — Objet</h2>
              <p>Les présentes conditions générales de vente régissent les relations contractuelles entre Stamply SASU et ses clients dans le cadre de la fourniture du service SaaS de cartes de fidélité digitales.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Article 2 — Prix</h2>
              <p>Le service Stamply est proposé au tarif de 49€/mois par commerçant, HT. Ce tarif inclut l'ensemble des fonctionnalités décrites sur le site. Les prix sont révisables à tout moment, les conditions applicables étant celles en vigueur au jour de la souscription.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Article 3 — Durée et résiliation</h2>
              <p>L'abonnement est souscrit pour une durée indéterminée sans engagement. Le client peut résilier son abonnement à tout moment depuis son espace commerçant. La résiliation prend effet à la fin de la période de facturation en cours.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Article 4 — Paiement</h2>
              <p>Le paiement s'effectue par carte bancaire via Stripe. Le prélèvement mensuel intervient à la date anniversaire de la souscription. En cas de défaut de paiement, le service peut être suspendu après un délai de 7 jours.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Article 5 — Données personnelles</h2>
              <p>Les données collectées sont traitées conformément à notre politique de confidentialité. Les données sont hébergées chez Supabase (UE) et ne sont jamais revendues à des tiers.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Article 6 — Responsabilité</h2>
              <p>Stamply s'engage à fournir le service avec diligence et selon les règles de l'art. La responsabilité de Stamply ne saurait être engagée en cas de force majeure ou de dysfonctionnement des services tiers (Google Wallet, Apple Wallet, Firebase).</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Article 7 — Droit applicable</h2>
              <p>Les présentes CGV sont soumises au droit français. En cas de litige, les tribunaux compétents seront ceux de Paris.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
