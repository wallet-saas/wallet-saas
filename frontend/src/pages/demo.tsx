/**
 * Démo interactive — /demo
 *
 * Plutôt qu'une vidéo, le visiteur fabrique sa carte en direct : il choisit son
 * programme de fidélité, ses couleurs, son enseigne, et voit la carte se
 * transformer sous ses yeux. C'est la démonstration la plus convaincante
 * possible : il manipule le produit avant de payer.
 *
 * Chaque étape se termine par un appel à l'action vers l'inscription.
 */
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { PremiumCardPreview } from '@/components/PremiumCardPreview';
import { LOYALTY_TYPES, scanHint } from '@/components/LoyaltyTypeSelector';
import { ArrowRight, Check, Smartphone, Bell, MapPin, Star } from 'lucide-react';

const COULEURS = [
  { nom: 'Indigo', valeur: '#6366f1' },
  { nom: 'Rouge', valeur: '#e63946' },
  { nom: 'Vert', valeur: '#16a34a' },
  { nom: 'Ambre', valeur: '#f59e0b' },
  { nom: 'Rose', valeur: '#ec4899' },
  { nom: 'Noir', valeur: '#111827' },
];

const CONFIG_PAR_TYPE: Record<string, any> = {
  tampons: { tampons_requis: 10, tampon_emoji: '☕' },
  points: { points_par_euro: 1, points_recompense: 100 },
  cashback: { cashback_pourcent: 5 },
  remise: { paliers: [{ seuil: 0, nom: 'Bronze', remise: 0 }, { seuil: 200, nom: 'Argent', remise: 5 }, { seuil: 500, nom: 'Or', remise: 10 }] },
  carte_cadeau: {},
  membre: { statut_defaut: 'Membre' },
  coupon: { offre: '-10% sur votre première commande' },
};

function CTA({ children = 'Créer ma carte de fidélité', variant = 'primaire' }: { children?: string; variant?: 'primaire' | 'clair' }) {
  return (
    <Link
      href="/register"
      className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold transition-all hover:scale-105 ${
        variant === 'primaire'
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700'
          : 'bg-white text-indigo-700 border border-indigo-100 shadow-sm hover:border-indigo-300'
      }`}
    >
      {children} <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export default function DemoPage() {
  const [type, setType] = useState('tampons');
  const [couleur, setCouleur] = useState('#6366f1');
  const [enseigne, setEnseigne] = useState('Café des Amis');
  const [format, setFormat] = useState<'apple' | 'google'>('apple');

  const design = {
    background_image_url: '',
    logo_url: '',
    font_family: 'sans' as const,
    text_color: '#FFFFFF',
    text_color_auto: true,
    overlay_opacity: 20,
    overlay_color: couleur,
    overlay_type: 'solid' as const,
    overlay_gradient_color2: couleur,
    overlay_gradient_direction: 'diagonal' as const,
  };

  return (
    <>
      <Head>
        <title>Démo interactive — Stamply</title>
        <meta name="description" content="Composez votre carte de fidélité digitale en direct et voyez le résultat sur Apple Wallet et Google Wallet." />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Barre du haut */}
        <header className="px-5 py-4 flex items-center justify-between max-w-6xl mx-auto">
          <Link href="/" className="font-bold text-lg text-gray-900">Stamply</Link>
          <CTA variant="clair">Commencer</CTA>
        </header>

        {/* Titre */}
        <section className="max-w-3xl mx-auto text-center px-5 pt-8 pb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">Démo interactive</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            Composez votre carte maintenant.<br />Elle sera prête en 5 minutes.
          </h1>
          <p className="text-gray-500 mt-4">
            Choisissez votre programme et vos couleurs : la carte se met à jour en direct,
            exactement comme la verront vos clients dans leur téléphone.
          </p>
        </section>

        {/* Atelier */}
        <section className="max-w-6xl mx-auto px-5 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Réglages */}
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">1. Votre programme de fidélité</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {LOYALTY_TYPES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setType(t.id)}
                      className={`text-left rounded-xl border-2 p-3 transition ${
                        type === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="text-lg leading-none mb-1">{t.emoji}</div>
                      <div className="text-sm font-medium text-gray-900">{t.nom}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                  {scanHint(type)}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">2. Vos couleurs</p>
                <div className="flex flex-wrap gap-2">
                  {COULEURS.map(c => (
                    <button
                      key={c.valeur}
                      onClick={() => setCouleur(c.valeur)}
                      className={`h-10 w-10 rounded-full border-2 transition ${
                        couleur === c.valeur ? 'border-gray-900 scale-110' : 'border-white shadow'
                      }`}
                      style={{ background: c.valeur }}
                      title={c.nom}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">3. Le nom de votre commerce</p>
                <input
                  value={enseigne}
                  onChange={e => setEnseigne(e.target.value.slice(0, 28))}
                  className="w-full rounded-xl border border-gray-200 p-3 text-lg"
                  placeholder="Le nom de votre commerce"
                />
              </div>

              <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-900 mb-3">Et ensuite, tout est automatique</p>
                <ul className="space-y-2.5 text-sm text-gray-600">
                  {[
                    { icon: Smartphone, txt: 'Vos clients ajoutent la carte en 10 secondes, sans installer d\u2019application.' },
                    { icon: Bell, txt: 'Vous envoyez des notifications quand vous voulez, gratuitement.' },
                    { icon: MapPin, txt: 'Leur carte remonte sur leur écran quand ils passent devant chez vous.' },
                    { icon: Star, txt: 'Les clients satisfaits sont dirigés vers votre fiche Google.' },
                  ].map(({ icon: Icon, txt }, i) => (
                    <li key={i} className="flex gap-2.5">
                      <Icon className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <span>{txt}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5"><CTA /></div>
              </div>
            </div>

            {/* Aperçu */}
            <div className="lg:sticky lg:top-8">
              <div className="flex justify-center gap-2 mb-5">
                {(['apple', 'google'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      format === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    {f === 'apple' ? 'Apple Wallet' : 'Google Wallet'}
                  </button>
                ))}
              </div>

              <PremiumCardPreview
                format={format}
                design={design}
                data={{
                  commercantNom: enseigne || 'Votre commerce',
                  programmeNom: 'Carte de fidélité',
                  clientNom: 'Marie',
                  tamponsActuels: type === 'points' ? 250 : 7,
                  tamponsPalier: 10,
                  carteType: type,
                  typeConfig: CONFIG_PAR_TYPE[type] || {},
                  recompense: 'une boisson offerte',
                  qrValue: 'stamply://demo',
                }}
              />

              <p className="text-center text-xs text-gray-400 mt-4">
                Aperçu réel — c'est exactement ce que verront vos clients.
              </p>
            </div>
          </div>
        </section>

        {/* Rappel de l'offre + CTA final */}
        <section className="bg-gray-900 text-white py-16 px-5">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
              Un seul plan. Tout compris. 49 € par mois.
            </h2>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/70 mb-8">
              {[
                'Cartes illimitées',
                'Notifications illimitées',
                'Les 7 programmes de fidélité',
                'Avis Google',
                'Géolocalisation',
                'Sans engagement',
              ].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-green-400" /> {t}
                </span>
              ))}
            </div>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transition-all"
            >
              Créer ma carte maintenant <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="text-xs text-white/50 mt-4">Résiliable en 1 clic, à tout moment.</p>
          </div>
        </section>
      </div>
    </>
  );
}
