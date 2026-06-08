import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Search, MapPin, Star, CreditCard, Bell, TrendingUp, ArrowRight, CheckCircle, Store } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface Commercant {
  id: string;
  nom_enseigne: string;
  template_type: string | null;
  carte_couleur_primaire: string;
  carte_programme_nom: string | null;
  points_recompense: number;
}

interface Category {
  id: string;
  label: string;
  count: number;
}

const CATEGORY_EMOJI: Record<string, string> = {
  boulangerie: '🍞',
  coiffeur: '✂️',
  restaurant: '🍽️',
  kine: '💆',
  garagiste: '🚗',
};

const FEATURES = [
  { icon: CreditCard, title: 'Cartes digitales', desc: 'Google Wallet & Apple Wallet pour vos clients' },
  { icon: Bell, title: 'Notifications push', desc: 'Relancez vos clients dormants automatiquement' },
  { icon: TrendingUp, title: 'Analytics', desc: 'Suivez vos performances en temps réel' },
  { icon: Star, title: 'Fidélité', desc: 'Récompensez vos clients les plus fidèles' },
];

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [commercants, setCommercants] = useState<Commercant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if logged in
    const token = localStorage.getItem('stamply_token');
    if (token) {
      router.replace('/dashboard');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [searchRes, catRes] = await Promise.all([
        fetch(`${API_URL}/api/commercants/search?limit=6`),
        fetch(`${API_URL}/api/commercants/categories`),
      ]);
      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.success) setCommercants(data.data);
      }
      if (catRes.ok) {
        const data = await catRes.json();
        if (data.success) setCategories(data.data);
      }
    } catch (e) {
      console.error('Erreur chargement:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/commercants/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
      const data = await res.json();
      if (data.success) setCommercants(data.data);
    } catch (e) {
      console.error('Erreur recherche:', e);
    }
  };

  return (
    <>
      <Head>
        <title>Stamply — Cartes de fidélité digitales pour TPE</title>
        <meta name="description" content="Créez des cartes de fidélité Google Wallet et Apple Wallet pour votre commerce. 49€/mois." />
      </Head>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">S</div>
            <span className="font-bold text-lg text-gray-900">Stamply</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Connexion
            </Link>
            <Link href="/register" className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Store className="h-4 w-4" />
            Pour les TPE françaises
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Cartes de fidélité
            <br />
            <span className="text-indigo-600">digitales</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-8">
            Vos clients ajoutent votre carte à Google Wallet ou Apple Wallet.
            Scannez, fidélisez, relancez — le tout depuis votre téléphone.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-lg mx-auto mb-8">
            <div className="flex items-center bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <Search className="h-5 w-5 text-gray-400 ml-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un commerce..."
                className="flex-1 px-3 py-4 text-base outline-none bg-transparent"
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-4 font-semibold hover:bg-indigo-700 transition-colors"
              >
                Chercher
              </button>
            </div>
          </form>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSearchQuery('');
                    fetch(`${API_URL}/api/commercants/search?categorie=${cat.id}&limit=20`)
                      .then((r) => r.json())
                      .then((d) => { if (d.success) setCommercants(d.data); });
                  }}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                >
                  <span>{CATEGORY_EMOJI[cat.id] || '🏪'}</span>
                  {cat.label}
                  <span className="text-gray-400">({cat.count})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Commerçants */}
      {!loading && commercants.length > 0 && (
        <section className="pb-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Commerçants partenaires</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {commercants.map((c) => (
                <Link
                  key={c.id}
                  href={`/install/${c.id}`}
                  className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                      style={{ background: c.carte_couleur_primaire || '#6366f1' }}
                    >
                      {c.nom_enseigne.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {c.nom_enseigne}
                      </p>
                      {c.template_type && (
                        <p className="text-xs text-gray-400">
                          {CATEGORY_EMOJI[c.template_type] || '🏪'} {c.template_type}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {c.carte_programme_nom || 'Carte de fidélité'}
                    </span>
                    <span className="text-indigo-600 font-semibold">
                      {c.points_recompense} pts
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Installer la carte <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Tout ce qu'il faut</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            Une solution complète pour fidéliser vos clients sans friction.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple et transparent</h2>
          <p className="text-gray-500 mb-8">Un seul prix, tout inclus.</p>
          <div className="bg-white rounded-3xl border-2 border-indigo-200 p-8 shadow-lg">
            <div className="text-5xl font-extrabold text-gray-900 mb-2">49€<span className="text-lg font-normal text-gray-400">/mois</span></div>
            <p className="text-gray-500 mb-6">Par commerçant, tout inclus</p>
            <ul className="space-y-3 mb-8 text-left">
              {['Cartes Google Wallet illimitées', 'Notifications push', 'Analytics en temps réel', 'Support email', 'Sans engagement'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="block w-full bg-indigo-600 text-white text-center font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-100">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">S</div>
            Stamply © 2026
          </div>
          <div className="flex gap-4">
            <Link href="/cgu" className="hover:text-gray-600">CGU</Link>
            <Link href="/mentions-legales" className="hover:text-gray-600">Mentions légales</Link>
            <Link href="/politique-confidentialite" className="hover:text-gray-600">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
