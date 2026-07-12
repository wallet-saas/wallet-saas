import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { CreditCard, Loader2, XCircle, Smartphone, Monitor } from 'lucide-react';
import { GeolocationTracker } from '@/components/GeolocationTracker';

// QR code — client-side only
const QRCode = dynamic(() => import('qrcode.react').then(m => m.QRCodeCanvas), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type OS = 'android' | 'ios' | 'desktop' | 'unknown';
type State = 'loading' | 'info' | 'ready' | 'error';

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

  // Form state
  const [clientNom, setClientNom] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [clientDateNaissance, setClientDateNaissance] = useState('');
  const [consentementEmail, setConsentementEmail] = useState(false);
  const [consentementSms, setConsentementSms] = useState(false);
  const [clientInfoLoading, setClientInfoLoading] = useState(false);
  const [clientInfoSkip, setClientInfoSkip] = useState(false);
  const [clientInfoError, setClientInfoError] = useState('');

  // Email validation helper
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Handle client info submit
  const handleSaveClientInfo = async () => {
    const trimmedNom = clientNom.trim();
    const trimmedEmail = clientEmail.trim();

    if (!trimmedNom) {
      setClientInfoError('Veuillez saisir votre prénom et nom.');
      return;
    }
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setClientInfoError('Veuillez saisir un email valide.');
      return;
    }

    setClientInfoLoading(true);
    setClientInfoError('');

    try {
      const body = {
        commercantId,
        serial_number: cardData?.serial_number,
        nom: trimmedNom,
        email: trimmedEmail,
        telephone: clientTelephone.trim(),
        date_naissance: clientDateNaissance || null,
        consentement_email: consentementEmail,
        consentement_sms: consentementSms,
      };

      const res = await fetch(`${API_URL}/api/commercants/save-client-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result?.error || 'Erreur lors de l\'enregistrement.');
      }

      // Stocker dans localStorage
      try {
        localStorage.setItem(`stamply_client_${commercantId}`, JSON.stringify(body));
      } catch {}

      setState('ready');
    } catch (e: any) {
      setClientInfoError(e?.message || 'Erreur réseau.');
    } finally {
      setClientInfoLoading(false);
    }
  };

  // Skip client info
  const handleSkipClientInfo = () => {
    setClientInfoSkip(true);
    try {
      localStorage.setItem(`stamply_client_${commercantId}_skip`, 'true');
    } catch {}
    setState('ready');
  };

  // Detect OS client-side (after hydration)
  useEffect(() => {
    setOs(detectOS());
  }, []);

  useEffect(() => {
    if (!commercantId || typeof commercantId !== 'string') return;

    const STORAGE_KEY = `stamply_card_${commercantId}`;

    const generate = async () => {
      try {
        const res = await fetch(`${API_URL}/api/wallet/generate-for/${commercantId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const body = await res.json();

        if (!res.ok || !body.success) {
          if (
            res.status === 403 &&
            typeof body?.error === 'string' &&
            body.error.toLowerCase().includes('pas encore configuré')
          ) {
            setErrorMsg(
              "Ce commerce n'a pas encore activé son programme de fidélité. Revenez plus tard."
            );
          } else {
            setErrorMsg(body?.error || 'Impossible de créer la carte.');
          }
          setState('error');
          return;
        }

        const data: CardData = body.data ?? body;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
        setCardData(data);

        // Vérifier si l'utilisateur a déjà rempli ou skip le formulaire client
        const clientInfoStorageKey = `stamply_client_${commercantId}`;
        const skipKey = `stamply_client_${commercantId}_skip`;
        const savedInfo = typeof window !== 'undefined' ? localStorage.getItem(clientInfoStorageKey) : null;
        const hasSkipped = typeof window !== 'undefined' ? localStorage.getItem(skipKey) === 'true' : false;

        if (savedInfo) {
          // Déjà rempli, passer directement aux boutons Wallet
          setState('ready');
        } else if (hasSkipped) {
          setState('ready');
          setClientInfoSkip(true);
        } else {
          // Afficher le formulaire optionnel
          setState('info');
        }
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

      {/* Géolocalisation arrière-plan pour les notifications de proximité */}
      {cardData && <GeolocationTracker carteId={cardData.serial_number} />}

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

          {/* ── Info (formulaire client) ── */}
          {state === 'info' && cardData && (
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

              {/* ── Formulaire optionnel ── */}
              <div className="bg-white/10 rounded-2xl p-5 space-y-4">
                <div className="text-center">
                  <p className="text-sm font-semibold">Recevez des avantages exclusifs</p>
                  <p className="text-xs text-white/70 mt-1">
                    Laissez-nous vos coordonnées pour profiter d'offres personnalisées
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Prénom & Nom */}
                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1">Prénom & Nom *</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <input
                        type="text"
                        value={clientNom}
                        onChange={e => setClientNom(e.target.value)}
                        placeholder="Votre prénom et nom"
                        className="w-full pl-10 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1">Email *</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={e => setClientEmail(e.target.value)}
                        placeholder="votre@email.com"
                        className="w-full pl-10 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Téléphone (optionnel) */}
                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1">Téléphone <span className="text-white/40">(optionnel)</span></label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <input
                        type="tel"
                        value={clientTelephone}
                        onChange={e => setClientTelephone(e.target.value)}
                        placeholder="06 12 34 56 78"
                        className="w-full pl-10 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Date de naissance (optionnel) */}
                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1">Date de naissance <span className="text-white/40">(optionnel)</span></label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="date"
                        value={clientDateNaissance}
                        onChange={e => setClientDateNaissance(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                {/* Consentements */}
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentementEmail}
                      onChange={e => setConsentementEmail(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                    />
                    <span className="text-xs text-white/70">J'accepte de recevoir des offres par email</span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentementSms}
                      onChange={e => setConsentementSms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                    />
                    <span className="text-xs text-white/70">J'accepte de recevoir des SMS</span>
                  </label>
                </div>

                {/* Erreur */}
                {clientInfoError && (
                  <div className="bg-red-500/20 rounded-lg px-3 py-2 text-xs text-red-200">
                    {clientInfoError}
                  </div>
                )}

                {/* Boutons */}
                <div className="space-y-2">
                  <button
                    onClick={handleSaveClientInfo}
                    disabled={clientInfoLoading}
                    className="w-full flex items-center justify-center gap-2 bg-white text-indigo-600 rounded-xl px-5 py-3 font-semibold text-sm shadow-lg hover:bg-white/90 transition-colors disabled:opacity-60"
                  >
                    {clientInfoLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {clientInfoLoading ? 'Enregistrement…' : 'Enregistrer mes informations'}
                  </button>
                  <button
                    onClick={handleSkipClientInfo}
                    className="w-full text-sm text-white/60 hover:text-white/80 transition-colors py-2"
                  >
                    Passer
                  </button>
                </div>
              </div>

              {/* Serial number (discret) */}
              <div className="border-t border-white/20 pt-3 text-center">
                <p className="text-xs text-white/50">Référence</p>
                <code className="text-xs text-white/70 font-mono break-all">
                  {cardData.serial_number}
                </code>
              </div>
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

              {/* ── iOS : Apple Wallet ── */}
              {os === 'ios' && (
                <div className="space-y-2">
                  {cardData.apple_wallet_configured && cardData.apple_wallet_url ? (
                    <a
                      href={cardData.apple_wallet_url}
                      className="block w-full"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div className="flex items-center justify-center gap-3 bg-black text-white rounded-xl px-5 py-3.5 font-semibold text-base shadow-lg hover:bg-gray-900 transition-colors">
                        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        Ajouter à Apple Wallet
                      </div>
                    </a>
                  ) : (
                    <div className="bg-white/10 rounded-xl px-5 py-3 text-center">
                      <p className="text-xs text-white/70">
                        Apple Wallet en cours de configuration
                      </p>
                    </div>
                  )}
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
