import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
}

// Bottom nav items
const navItems = [
  { icon: '🏠', label: 'Accueil', href: '/merchant/dashboard' },
  { icon: '📷', label: 'Scan', href: '/merchant/scan' },

  { icon: '📊', label: 'Stats', href: '/merchant/analytics' },
  { icon: '⚙️', label: 'Config', href: '/merchant/config' },
];

export function MobileLayout({ children, title = 'Stamply' }: MobileLayoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('token');
    const commercant = localStorage.getItem('commercant');

    if (!token || !commercant) {
      router.replace('/login');
      return;
    }

    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f8f9fa',
      }}>
        <div style={{ fontSize: 32 }}>🏪</div>
      </div>
    );
  }

  const currentPath = router.pathname;

  return (
    <>
      <Head>
        <title>{title} — Stamply</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#6C63FF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>

      {/* Main content */}
      <div style={{
        minHeight: '100dvh',
        background: '#f5f5f7',
        paddingBottom: '80px', // Space for bottom nav
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)',
          padding: '16px 20px',
          paddingTop: 'max(16px, env(safe-area-inset-top))',
          color: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                {title || '🏪 Stamply'}
              </h1>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('commercant');
                router.replace('/login');
              }}
              style={{
                background: 'rgba(255,255,255,0.2)', border: 'none',
                borderRadius: 10, padding: '8px 12px',
                color: 'white', fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Déco
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
          {children}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-around',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        zIndex: 1000,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
      }}>
        {navItems.map((item) => {
          const isActive = currentPath === item.href ||
            (item.href !== '/merchant/dashboard' && currentPath.startsWith(item.href));

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px 12px',
                cursor: 'pointer',
                color: isActive ? '#6C63FF' : '#9CA3AF',
                flex: 1,
              }}
            >
              <span style={{ fontSize: 22, marginBottom: 2 }}>{item.icon}</span>
              <span style={{
                fontSize: 10, fontWeight: isActive ? 700 : 500,
              }}>
                {item.label}
              </span>
              {isActive && (
                <div style={{
                  width: 20, height: 3, borderRadius: 2,
                  background: '#6C63FF', marginTop: 2,
                }} />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
