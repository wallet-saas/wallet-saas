import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { CreditCard, Loader2, XCircle, Smartphone, Monitor } from 'lucide-react';

// QR code — client-side only
const QRCode = dynamic(() => import('qrcode.react').then(m => m.QRCodeCanvas), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type OS = 'android' | 'ios' | 'desktop' | 'unknown';
type State = 'loading' | 'ready' | 'error';

interface CardData {
  serial_number: string;
  google_wallet_url: string | null;
  apple_wallet_url: string | null;
  nom_enseigne: string;
  couleur_primaire: string;
  couleur_secondaire: string;
  logo_url: string | null;
  points_recompense: number;
  google_wallet_configured: boolean;
  apple_wallet_configured: boolean;
}

function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return 'ios';
  if (/android/i.test(ua)) return 'android';
  if (/Mobi|Android/i.test(ua)) return 'android';
  return 'desktop';
}

export default function InstallPage() {
  const router = useRouter();
  const { commercantId } = router.query;

  const [state, setState] = useState<State>('loading');
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [os, setOs] = useState<OS>('unknown');
  const [errorMsg, setErrorMsg] = useState('');

  // Detect OS client-side (after hydration)
  useEffect(() => {
    setOs(detectOS());
  }, []);

  useEffect(() => {
    if (!commercantId || typeof commercantId !== 'string') return;

    const generate = async () => {
      try {
        const res = await fetch(`${API_URL}/api/wallet/generate-for/${commercantId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const body = await res.json();

        if (!res.ok || !body.success) {
          setErrorMsg(body?.error || 'Impossible de créer la carte.');
          setState('error');
          return;
        }

        const data: CardData = body.data ?? body;
        setCardData(data);
        setState('ready');
      } catch {
        setErrorMsg('Erreur réseau. Veuillez réessayer.');
        setState('error');
      }
    };

    generate();
  }, [commercantId]);

  const couleur = cardData?.couleur_primaire || '#6366f1';
  const installPageUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <>
      <Head>
        <title>
          {cardData ? `Carte ${cardData.nom_enseigne} — Stamply` : 'Installer ma carte — Stamply'}
        </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Hint for Google Wallet button styling */}
        <meta name="theme-color" content={couleur} />
      </Head>

      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${couleur} 0%, #764ba2 100%)` }}
      >
        <div className="w-full max-w-sm">
          {/* Logo + commerce name */}
          <div className="text-center mb-6">
            {cardData?.logo_url ? (
              <img
                src={cardData.logo_url}
                alt={cardData.nom_enseigne}
                className="w-16 h-16 rounded-2xl object-contain bg-white/20 mx-auto mb-3 p-1"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                <CreditCard className="h-7 w-7 text-white" />
              </div>
            )}
            {cardData && (
              <p className="text-white/90 font-semibold text-lg">{cardData.nom_enseigne}</p>
            )}
          </div>

          {/* ── Loading ── */}
          {state === 'loading' && (
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 text-center text-white">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
              <h1 className="text-lg font-semibold mb-1">Création de votre carte…</h1>
              <p className="text-sm text-white/80">Quelques secondes</p>
            </div>
          )}

          {/* ── Error ── */}
          {state === 'error' && (
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 text-center text-white">
              <div className="w-12 h-12 rounded-full bg-red-500/30 flex items-center justify-center mx-auto mb-3">
                <XCircle className="h-6 w-6" />
              </div>
              <h1 className="text-lg font-semibold mb-1">Erreur</h1>
              <p className="text-sm text-white/80 mb-4">{errorMsg}</p>
              <button
                onClick={() => router.reload()}
                className="text-sm font-semibold underline text-white"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* ── Ready ── */}
          {state === 'ready' && cardData && (
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 text-white space-y-5">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-green-400/30 flex items-center justify-center mx-auto mb-2">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-lg font-semibold">Votre carte est prête !</h1>
                <p className="text-sm text-white/80 mt-0.5">
                  Récompense à {cardData.points_recompense} points
                </p>
              </div>

              {/* ── QR code fidélité (toujours visible) ── */}
              <div className="bg-white/10 rounded-2xl p-4 text-center space-y-2">
                <p className="text-sm font-semibold">Votre QR code fidélité</p>
                <p className="text-xs text-white/70">
                  Montrez ce QR code en caisse à chaque visite
                </p>
                <div className="flex justify-center mt-1">
                  <div className="bg-white p-3 rounded-xl">
                    <QRCode value={cardData.serial_number} size={160} />
                  </div>
                </div>
              </div>

              {/* ── Android : bouton Google Wallet ── */}
              {os === 'android' && (
                <div className="space-y-2">
                  {cardData.google_wallet_url ? (
                    <a
                      href={cardData.google_wallet_url}
                      className="block w-full"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div className="flex items-center justify-center gap-3 bg-black text-white rounded-xl px-5 py-3.5 font-semibold text-base shadow-lg hover:bg-gray-900 transition-colors">
                        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.4 8.4h-3v2.4h3v2.4h-3V18H12V6h5.4v2.4z"/>
                        </svg>
                        Ajouter à Google Wallet
                      </div>
                    </a>
                  ) : (
                    <div className="bg-white/10 rounded-xl px-5 py-3 text-center">
                      <p className="text-xs text-white/70">
                        Google Wallet non configuré par le commerçant
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── iOS : Apple Wallet (désactivé) ── */}
              {os === 'ios' && (
                <div className="bg-white/10 rounded-xl px-5 py-3 text-center">
                  <p className="text-xs text-white/70">
                    Apple Wallet bientôt disponible
                  </p>
                </div>
              )}

              {/* ── Desktop : lien pour ouvrir sur téléphone ── */}
              {(os === 'desktop' || os === 'unknown') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5">
                    <Monitor className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm">Ouvrez cette page sur votre téléphone pour ajouter la carte à votre Wallet</p>
                  </div>
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-xl">
                      <QRCode value={installPageUrl} size={140} />
                    </div>
                  </div>
                  <p className="text-xs text-white/60 text-center">
                    Scannez pour ouvrir sur mobile
                  </p>
                </div>
              )}

              {/* Serial number (discret, pour référence) */}
              <div className="border-t border-white/20 pt-3 text-center">
                <p className="text-xs text-white/50">Référence</p>
                <code className="text-xs text-white/70 font-mono break-all">
                  {cardData.serial_number}
                </code>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
