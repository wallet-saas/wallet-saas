import Head from 'next/head';
import Link from 'next/link';
import { CreditCard } from 'lucide-react';

export default function MentionsLegalesPage() {
  return (
    <>
      <Head><title>Mentions légales — Stamply</title></Head>
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
            <h1 className="text-2xl font-bold text-gray-900">Mentions légales</h1>
            <p className="text-sm text-gray-500 mt-1">Dernière mise à jour : 26 avril 2026</p>
          </div>

          <div className="card p-8 space-y-8 text-sm text-gray-700 leading-relaxed">

            {/* Éditeur */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">1. Éditeur du site</h2>
              <p>Le site <strong>stamply.fr</strong> (accessible provisoirement à l'adresse wallet-saas.vercel.app) est édité par :</p>
              <ul className="mt-2 space-y-1 pl-4 list-disc list-outside text-gray-600">
                <li><strong>Nom :</strong> GERBER RAEPPEL Jules</li>
                <li><strong>Forme juridique :</strong> Micro-entreprise</li>
                <li><strong>Marque commerciale :</strong> Stamply</li>
                <li><strong>Siège :</strong> Mulhouse, France</li>
                <li><strong>Email :</strong>{' '}
                  <a href="mailto:jules.gerber2@gmail.com" className="text-primary-600 hover:underline">
                    jules.gerber2@gmail.com
                  </a>
                </li>
              </ul>
            </section>

            {/* Directeur de publication */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">2. Directeur de la publication</h2>
              <p>Le directeur de la publication est <strong>GERBER RAEPPEL Jules</strong>.</p>
            </section>

            {/* Hébergement */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">3. Hébergement</h2>
              <p>Le site et ses services sont hébergés par les prestataires suivants :</p>

              <div className="mt-3 space-y-4">
                <div>
                  <p className="font-medium text-gray-800">Frontend — Vercel Inc.</p>
                  <p className="text-gray-500 text-xs mt-0.5">440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</p>
                  <p className="text-gray-500 text-xs">
                    <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">vercel.com</a>
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Backend — Railway Corp.</p>
                  <p className="text-gray-500 text-xs mt-0.5">548 Market St PMB 68957, San Francisco, CA 94104, États-Unis</p>
                  <p className="text-gray-500 text-xs">
                    <a href="https://railway.app" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">railway.app</a>
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Base de données — Supabase Inc.</p>
                  <p className="text-gray-500 text-xs mt-0.5">970 Toa Payoh North #07-04, Singapour 318992 — données hébergées dans l'Union Européenne</p>
                  <p className="text-gray-500 text-xs">
                    <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">supabase.com</a>
                  </p>
                </div>
              </div>
            </section>

            {/* Propriété intellectuelle */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">4. Propriété intellectuelle</h2>
              <p>
                L'ensemble des contenus présents sur le site Stamply (textes, images, logos, interface, code source) sont la propriété exclusive de GERBER RAEPPEL Jules et sont protégés par le droit français de la propriété intellectuelle.
              </p>
              <p className="mt-2">
                Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans autorisation écrite préalable est strictement interdite.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">5. Contact</h2>
              <p>
                Pour toute question relative au site, vous pouvez nous contacter par email :{' '}
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
