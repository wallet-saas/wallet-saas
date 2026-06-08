import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function AppInstall() {
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [browser, setBrowser] = useState('');

  useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);
    setIsAndroid(/Android/.test(ua));

    if (ua.includes('Chrome')) setBrowser('chrome');
    else if (ua.includes('Safari')) setBrowser('safari');
    else if (ua.includes('Firefox')) setBrowser('firefox');
    else if (ua.includes('SamsungBrowser')) setBrowser('samsung');

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      router.replace('/merchant/dashboard');
      return;
    }

    // Register SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-merchant.js', { scope: '/merchant/' })
        .catch(() => {});
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      router.replace('/merchant/dashboard');
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, [router]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      router.replace('/merchant/dashboard');
    }
  };

  const handleContinue = () => {
    router.replace('/merchant/dashboard');
  };

  return (
    <>
      <Head>
        <title>Installer Stamply</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#6C63FF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest-merchant.json" />
      </Head>

      <div style={{
        minHeight: '100dvh',
        background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 50%, #3730A3 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: 'white',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24, fontSize: 36,
        }}>
          🏪
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Stamply
        </h1>
        <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 40, maxWidth: 300 }}>
          Installez l'application sur votre téléphone pour un accès rapide à votre programme de fidélité
        </p>

        {/* Install prompt */}
        {deferredPrompt && !isInstalled && (
          <button
            onClick={handleInstall}
            style={{
              background: 'white', color: '#6C63FF',
              border: 'none', borderRadius: 16,
              padding: '16px 32px', fontSize: 18, fontWeight: 700,
              cursor: 'pointer', width: '100%', maxWidth: 320,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              marginBottom: 16,
            }}
          >
            📱 Installer l'application
          </button>
        )}

        {/* iOS instructions */}
        {isIOS && !deferredPrompt && !isInstalled && (
          <div style={{
            background: 'rgba(255,255,255,0.15)', borderRadius: 16,
            padding: 20, marginBottom: 16, maxWidth: 320, width: '100%',
            textAlign: 'left',
          }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
              📱 Installation sur iPhone/iPad :
            </p>
            <ol style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 20 }}>
              <li>Appuyez sur <strong>Partager</strong> <span style={{ fontSize: 18 }}>⎋</span></li>
              <li>Descendez et appuyez sur <strong>"Sur l'écran d'accueil"</strong></li>
              <li>Appuyez sur <strong>"Ajouter"</strong></li>
            </ol>
          </div>
        )}

        {/* Android instructions */}
        {isAndroid && !deferredPrompt && !isInstalled && browser !== 'chrome' && (
          <div style={{
            background: 'rgba(255,255,255,0.15)', borderRadius: 16,
            padding: 20, marginBottom: 16, maxWidth: 320, width: '100%',
            textAlign: 'left',
          }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
              📱 Installation sur Android :
            </p>
            <ol style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 20 }}>
              <li>Ouvrez ce lien dans <strong>Chrome</strong></li>
              <li>Appuyez sur le <strong>menu ⋮</strong></li>
              <li>Appuyez sur <strong>"Installer l'application"</strong></li>
            </ol>
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={handleContinue}
          style={{
            background: 'transparent', color: 'white',
            border: '2px solid rgba(255,255,255,0.3)', borderRadius: 16,
            padding: '14px 32px', fontSize: 16, fontWeight: 600,
            cursor: 'pointer', width: '100%', maxWidth: 320,
          }}
        >
          Continuer sans installer →
        </button>

        {/* Features */}
        <div style={{
          marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 16, maxWidth: 320, width: '100%',
        }}>
          {[
            { icon: '📱', label: 'Scan QR' },
            { icon: '📊', label: 'Statistiques' },
            { icon: '🏪', label: 'Boutiques' },
            { icon: '🎁', label: 'Récompenses' },
          ].map((f) => (
            <div key={f.label} style={{
              background: 'rgba(255,255,255,0.1)', borderRadius: 12,
              padding: 16, textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{f.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
