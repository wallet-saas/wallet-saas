import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import {
  LayoutDashboard, CreditCard, QrCode, Bell, Star,
  UtensilsCrossed, Tag, MapPin, BarChart3, Settings,
  CreditCard as StripeCard, LogOut, ChevronLeft, Menu, X,
  Store, MessageSquare
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { commercantApi } from '@/services/api';

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  module?: 'module_avis' | 'module_menus' | 'module_offres' | 'module_geoloc' | 'module_notifications' | 'module_boutiques';
};

const navItems: NavItem[] = [
  { label: 'Vue d\'ensemble', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Cartes', href: '/dashboard/cartes', icon: CreditCard },
  { label: 'Scan QR', href: '/dashboard/scan', icon: QrCode },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell, module: 'module_notifications' },
  { label: 'Avis Google', href: '/dashboard/avis', icon: Star, module: 'module_avis' },
  { label: 'Menus', href: '/dashboard/menus', icon: UtensilsCrossed, module: 'module_menus' },
  { label: 'Offres Flash', href: '/dashboard/offres', icon: Tag, module: 'module_offres' },
  { label: 'Géolocalisation', href: '/dashboard/geolocalisation', icon: MapPin, module: 'module_geoloc' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Mes boutiques', href: '/dashboard/boutiques', icon: Store, module: 'module_boutiques' },
  { label: 'Avis automatiques', href: '/dashboard/auto-review', icon: MessageSquare },
];

const bottomItems = [
  { label: 'Paramètres', href: '/dashboard/parametres', icon: Settings },
  { label: 'Abonnement', href: '/dashboard/abonnement', icon: StripeCard },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { commercant, loading, isAuthenticated, logout, refreshUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAbonnementPage = router.pathname === '/dashboard/abonnement' || router.pathname === '/abonnement';
  const isSetupCardPage = router.pathname === '/dashboard/setup-card';

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    // Redirect to /abonnement only for dashboard pages (not when already there)
    if (!isAbonnementPage && commercant && commercant.statut_abonnement !== 'actif' && commercant.statut_abonnement !== 'trialing') {
      router.push('/abonnement');
      return;
    }
    // Redirect to setup-card when wallet class is not yet configured
    if (
      commercant &&
      commercant.statut_abonnement === 'actif' &&
      !commercant.wallet_class_configured &&
      !isSetupCardPage
    ) {
      router.push('/dashboard/setup-card');
      return;
    }
  }, [loading, isAuthenticated, commercant, router, isAbonnementPage, isSetupCardPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (!isAbonnementPage && commercant && commercant.statut_abonnement !== 'actif' && commercant.statut_abonnement !== 'trialing') return null;
  if (
    !isSetupCardPage &&
    commercant &&
    commercant.statut_abonnement === 'actif' &&
    !commercant.wallet_class_configured
  ) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleToggleModule = async (moduleField: string, enabled: boolean) => {
    try {
      await commercantApi.update({ [moduleField]: enabled });
      await refreshUser();
    } catch (e: any) {
      console.error('[Module toggle] Error:', e);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 flex-shrink-0">
        <SidebarContent
          router={router}
          commercant={commercant}
          onLogout={handleLogout}
          onToggleModule={handleToggleModule}
        />
      </aside>

      {/* Sidebar — mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-50 flex flex-col w-60 h-full bg-white shadow-xl">
            <SidebarContent
              router={router}
              commercant={commercant}
              onLogout={handleLogout}
              onToggleModule={handleToggleModule}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setMobileOpen(true)} className="text-gray-500">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-gray-900 text-sm">Stamply</span>
          <div className="w-5" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
      <PWAInstallPrompt />
    </div>
  );
}

interface SidebarContentProps {
  router: ReturnType<typeof useRouter>;
  commercant: ReturnType<typeof useAuth>['commercant'];
  onLogout: () => void;
  onToggleModule?: (moduleField: string, enabled: boolean) => void;
  onClose?: () => void;
}

function SidebarContent({ router, commercant, onLogout, onToggleModule, onClose }: SidebarContentProps) {
  // All nav items are visible; disabled modules show as locked/greyed out
  const visibleNavItems = navItems;

  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">Stamply</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Commerce name */}
      <div className="px-5 py-3 border-b border-gray-100">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Commerce</p>
        <p className="text-sm font-semibold text-gray-900 truncate">
          {commercant?.nom_enseigne || '—'}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <div className="px-3 space-y-0.5">
          {visibleNavItems.map((item) => {
            const active = router.pathname === item.href;
            const isDisabled = item.module && !commercant?.[item.module];
            return (
              <Link
                key={item.href}
                href={isDisabled ? '#' : item.href}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                    return;
                  }
                  onClose?.();
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isDisabled && 'opacity-40 cursor-not-allowed',
                  active && !isDisabled && 'bg-primary-50 text-primary-700',
                  !active && !isDisabled && 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  active && isDisabled && 'bg-gray-50 text-gray-400',
                )}
                title={isDisabled ? `${item.label} — module désactivé` : undefined}
              >
                <item.icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-primary-600' : isDisabled ? 'text-gray-300' : 'text-gray-400')} />
                {item.label}
                {isDisabled && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (item.module && onToggleModule) onToggleModule(item.module, true); }}
                    className="ml-auto text-[10px] text-gray-300 hover:text-indigo-500 transition-colors cursor-pointer"
                    title="Réactiver ce module"
                  >🔒</button>
                )}
              </Link>
            );
          })}
        </div>

        <div className="px-3 mt-4 pt-4 border-t border-gray-100 space-y-0.5">
          {bottomItems.map((item) => {
            const active = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
                onClick={onClose}
              >
                <item.icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-primary-600' : 'text-gray-400')} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>

      {/* Legal footer */}
      <div className="px-5 py-3 border-t border-gray-100">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link href="/mentions-legales" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Mentions légales
          </Link>
          <Link href="/cgu" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            CGU
          </Link>
          <Link href="/politique-confidentialite" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Confidentialité
          </Link>
        </div>
      </div>
    </>
  );
}
