import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { subscriptionApi } from '@/services/api';
import {
  CreditCard, CheckCircle, Zap, Shield, Bell, Star,
  UtensilsCrossed, Tag, MapPin, BarChart3, LogOut
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const features = [
  { icon: CreditCard, label: 'Cartes Apple & Google Wallet illimitées' },
  { icon: Bell, label: 'Notifications Push (iOS & Android)' },
  { icon: Star, label: 'Module Avis Google + réponses IA' },
  { icon: UtensilsCrossed, label: 'Menu du Jour' },
  { icon: Tag, label: 'Offres Flash' },
  { icon: MapPin, label: 'Géolocalisation proximité' },
  { icon: BarChart3, label: 'Analytics avancés' },
  { icon: Shield, label: 'Support prioritaire' },
];

export default function AbonnementPage() {
  const router = useRouter();
  const { commercant, loading, isAuthenticated, logout, refreshUser } = useAuth();
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'polling' | 'timeout'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  // Guard: if already subscribed → dashboard | if not logged in → login
  useEffect(() => {
    if (loading) return;
    // Don't redirect if we're handling a post-payment success flow
    if (router.query.success === '1') return;
    if (isAuthenticated && commercant?.statut_abonnement === 'actif') {
      router.replace('/dashboard');
    }
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, commercant, router]);

  // After Whop payment: force-sync then poll until actif
  useEffect(() => {
    if (router.query.success !== '1') return;
    if (loading) return;
    if (!isAuthenticated) return;

    // Already active (fast webhook)
    if (commercant?.statut_abonnement === 'actif') {
      router.replace('/dashboard');
      return;
    }

    setPollingStatus('polling');
    let tries = 0;
    const MAX_TRIES = 15; // 15 × 2s = 30 seconds

    const trySync = async () => {
      tries++;
      try {
        // Step 1: force Whop → Supabase sync
        const syncResult = await subscriptionApi.sync();
        console.log('[abonnement] sync result:', syncResult);
        if (syncResult.abonnement_statut === 'actif') {
          // Step 2: refresh auth context so DashboardLayout sees updated status
          await refreshUser();
          router.replace('/dashboard');
          return;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[abonnement] sync error:', msg);
        setSyncError(msg);
        // Fall back: check status directly (read only, no side effects)
        try {
          const sub = await subscriptionApi.status();
          console.log('[abonnement] status fallback:', sub);
          if (sub.statut === 'actif') {
            setSyncError(null);
            await refreshUser();
            router.replace('/dashboard');
            return;
          }
        } catch (statusErr: unknown) {
          console.error('[abonnement] status fallback error:', statusErr);
        }
      }
      if (tries >= MAX_TRIES) {
        setPollingStatus('timeout');
      }
    };

    // First attempt immediately, then every 2s
    trySync();
    const interval = setInterval(trySync, 2000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.success, loading, isAuthenticated]);

  const handleCheckout = () => {
    const token = localStorage.getItem('stamply_token');
    window.location.href = `${API_URL}/api/subscription/checkout?token=${token}`;
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // ── Success screen (post-payment polling) ───────────────────────────────────
  if (router.query.success === '1') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm px-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Paiement confirmé !</h2>

          {pollingStatus === 'timeout' ? (
            <>
              <p className="text-sm text-gray-500 mb-4">
                L&apos;activation prend plus de temps que prévu.<br />
                Cliquez ci-dessous pour accéder au tableau de bord.
              </p>
              {syncError && (
                <p className="text-xs text-red-500 mb-3 font-mono bg-red-50 rounded p-2 break-all">
                  Erreur : {syncError}
                </p>
              )}
              <Button
                onClick={async () => {
                  await refreshUser();
                  router.replace('/dashboard');
                }}
              >
                Accéder au dashboard
              </Button>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Spinner size="sm" />
                Activation de votre abonnement en cours…
              </div>
              {syncError && (
                <p className="text-xs text-red-400 font-mono bg-red-50 rounded p-2 break-all text-left">
                  {syncError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading || !commercant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Main subscription page ──────────────────────────────────────────────────
  return (
    <>
      <Head><title>Choisissez votre plan — Stamply</title></Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Stamply</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 hidden sm:block">
                Connecté : <strong>{commercant.nom_enseigne}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Lancez votre programme de fidélité
            </h1>
            <p className="text-gray-500 text-lg">
              Un abonnement unique. Toutes les fonctionnalités incluses.
            </p>
          </div>

          {/* Pricing card */}
          <div className="max-w-sm mx-auto">
            <div className="bg-white rounded-2xl border-2 border-primary-200 shadow-lg overflow-hidden">
              {/* Badge */}
              <div className="bg-primary-600 text-white text-xs font-semibold text-center py-2 tracking-wide uppercase">
                Plan Pro — Tout inclus
              </div>

              <div className="p-8">
                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-5xl font-bold text-gray-900">49€</span>
                    <span className="text-gray-400 mb-2">/mois HT</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Sans engagement · Annulation en 1 clic</p>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                >
                  <Zap className="h-4 w-4" />
                  Souscrire maintenant
                </Button>

                <p className="text-xs text-center text-gray-400 mt-3">
                  Paiement sécurisé par Whop
                </p>

                {/* Features */}
                <ul className="mt-6 space-y-3">
                  {features.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-3 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {label}
                    </li>
                  ))}
                </ul>

                {/* Trial */}
                <div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-100 text-center">
                  <p className="text-sm font-semibold text-primary-800">14 jours d&apos;essai gratuit</p>
                  <p className="text-xs text-primary-700 mt-0.5">Aucun prélèvement pendant la période d&apos;essai</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
