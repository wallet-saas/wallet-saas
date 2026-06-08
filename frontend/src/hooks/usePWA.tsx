import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches) {
      setIsInstalled(true);
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-merchant.js', { scope: '/app/' })
        .then(reg => console.log('[PWA] SW registered:', reg.scope))
        .catch(err => console.log('[PWA] SW registration failed:', err));
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      setTimeout(() => setShowPrompt(true), 2000);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
    return outcome === 'accepted';
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
  }, []);

  return { isInstalled, isInstallable, showPrompt, install, dismissPrompt };
}

export function PWAHead() {
  return (
    <Head>
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Stamply" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="theme-color" content="#6C63FF" />
      <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      <link rel="manifest" href="/manifest-merchant.json" />
    </Head>
  );
}
