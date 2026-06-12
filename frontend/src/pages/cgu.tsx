import Head from "next/head";

export default function CGV() {
  return (
    <>
      <Head>
        <title>Conditions Générales de Vente - Stamply</title>
        <meta name="description" content="Conditions générales de vente du service Stamply, SaaS B2B cartes de fidélité digitales." />
      </Head>
      <section className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0F] text-slate-200">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-white">Conditions Générales de Vente</h1>
          <p className="text-slate-500 mb-8">En vigueur au 12 juin 2026</p>
          
          <div className="space-y-8 text-slate-400 leading-relaxed">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Article 1 — Objet</h2>
              <p>Les présentes conditions générales de vente (CGV) régissent les relations contractuelles entre Stamply SASU, ci-après dénommée « le Prestataire », et ses clients professionnels (commerçants, artisans, indépendants), ci-après dénommés « le Client », dans le cadre de la fourniture du service SaaS de cartes de fidélité digitales via Google Wallet et Apple Wallet.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Article 2 — Description du service</h2>
              <p>Stamply est une plateforme SaaS B2B permettant aux commerçants de créer, gérer et distribuer des cartes de fidélité digitales compatibles Google Wallet et Apple Wallet. Le service comprend :</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Création et personnalisation de cartes de fidélité</li>
                <li>Intégration native Google Wallet & Apple Wallet</li>
                <li>Scan QR code et gestion des points</li>
                <li>Dashboard analytique en temps réel</li>
                <li>Base de données clients</li>
                <li>Notifications push (simulation en V1, production avec clé Firebase)</li>
                <li>Support par email 7j/7</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Article 3 — Prix et facturation</h2>
              <p>Le service Stamply est proposé au tarif unique de <strong className="text-white">49 € HT / mois</strong> par commerçant. Ce tarif inclut l'ensemble des fonctionnalités décrites à l'article 2. La facturation est mensuelle, par prélèvement automatique via Stripe. Aucun frais d'installation ni de mise en service n'est facturé.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Article 4 — Durée et résiliation</h2>
              <p>L'abonnement est souscrit pour une durée indéterminée, <strong className="text-white">sans engagement</strong>. Le Client peut résilier son abonnement à tout moment depuis son espace commerçant, sans préavis ni frais de résiliation. La résiliation prend effet à la fin de la période de facturation en cours. Aucun remboursement n'est dû pour le mois en cours.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Article 5 — Paiement</h2>
              <p>Le paiement s'effectue exclusivement par carte bancaire via la plateforme sécurisée Stripe. Le prélèvement mensuel intervient à la date anniversaire de la souscription. En cas de défaut de paiement après un délai de 7 jours, le service peut être suspendu sans préjudice du montant restant dû.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Article 6 — Données personnelles</h2>
              <p>Les données collectées sont traitées conformément à notre politique de confidentialité et au Règlement Général sur la Protection des Données (RGPD). Les données sont hébergées chez Supabase (infrastructure UE) et ne sont jamais revendues à des tiers. Le Client dispose d'un droit d'accès, de rectification et de suppression de ses données.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Article 7 — Responsabilité</h2>
              <p>Stamply s'engage à fournir le service avec diligence et selon les règles de l'art. La responsabilité de Stamply ne saurait être engagée en cas de force majeure, de dysfonctionnement des services tiers (Google Wallet, Apple Wallet, Firebase, Stripe), ou de mauvaise utilisation du service par le Client.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Article 8 — Propriété intellectuelle</h2>
              <p>Le logiciel, le design, les textes et les éléments graphiques de la plateforme Stamply sont la propriété exclusive de Stamply SASU. Le Client conserve la propriété de ses données (logo, informations commerciales, base clients).</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Article 9 — Droit applicable et juridiction</h2>
              <p>Les présentes CGV sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, les tribunaux compétents seront ceux de Paris.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Article 10 — Contact</h2>
              <p>Pour toute question relative aux présentes CGV, le Client peut contacter Stamply à l'adresse : <a href="mailto:support@stamply.fr" className="text-indigo-400 hover:text-indigo-300 underline">support@stamply.fr</a></p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
