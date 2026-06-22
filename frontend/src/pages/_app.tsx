import App, { AppContext, AppInitialProps } from 'next/app';
import type { AppProps } from 'next/app';
import React from 'react';
import '@/styles/globals.css';
import { ToastProvider } from '@/components/ui/Toast';

// Service worker is managed by PWAInstallPrompt and sw.js
// Do NOT unregister here — it causes a reload loop when PWAInstallPrompt re-registers

interface ErrorBoundaryState { error: Error | null }

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Stamply] Client error:', error.message, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '40px', fontFamily: 'monospace' }}>
          <h2>Une erreur s&apos;est produite</h2>
          <pre style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', overflow: 'auto' }}>
            {this.state.error.message}
          </pre>
          <button onClick={() => window.location.href = '/login'} style={{ marginTop: '16px', padding: '8px 16px', cursor: 'pointer' }}>
            Retour à la connexion
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </ErrorBoundary>
  );
}

MyApp.getInitialProps = async (ctx: AppContext): Promise<AppInitialProps> => {
  return App.getInitialProps(ctx);
};
