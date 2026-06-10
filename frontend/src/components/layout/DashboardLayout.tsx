import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import {
  LayoutDashboard, CreditCard, QrCode, Bell, Star,
  UtensilsCrossed, Tag, MapPin, BarChart3, Settings,
  CreditCard as StripeCard, LogOut, ChevronLeft, Menu, X,
  Store, MessageSquare, Sun, Moon
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

const THEME_KEY = 'stamply_dashboard_theme';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { commercant, loading, isAuthenticated, logout, refreshUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const isAbonnementPage = router.pathname === '/dashboard/abonnement' || router.pathname === '/abonnement';
  const isSetupCardPage = router.pathname === '/dashboard/setup-card';

  // Load theme from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    setIsDark(stored === 'dark');
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isAbonnementPage && commercant && commercant.statut_abonnement !== 'actif' && commercant.statut_abonnement !== 'trialing') {
      router.push('/abonnement'); return;
    }
    if (commercant && commercant.statut_abonnement === 'actif' && !commercant.wallet_class_configured && !isSetupCardPage) {
      router.push('/dashboard/setup-card'); return;
    }
  }, [loading, isAuthenticated, commercant, router, isAbonnementPage, isSetupCardPage]);

  if (loading) return <div className="flex items-center justify-center h-screen"><Spinner size="lg" /></div>;
  if (!isAuthenticated) return null;
  if (!isAbonnementPage && commercant && commercant.statut_abonnement !== 'actif' && commercant.statut_abonnement !== 'trialing') return null;
  if (!isSetupCardPage && commercant && commercant.statut_abonnement === 'actif' && !commercant.wallet_class_configured) return null;

  const handleLogout = () => { logout(); router.push('/login'); };

  const handleToggleModule = async (moduleField: string) => {
    try {
      await commercantApi.update({ [moduleField]: true });
      await refreshUser();
    } catch (e: any) {
      console.error('[Module toggle] Error:', e);
    }
  };

  // Dark mode classes
  const bgMain = isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50';
  const bgSidebar = isDark ? 'bg-[#12121a] border-white/5' : 'bg-white border-gray-100';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-gray-500';
  const textMuted = isDark ? 'text-slate-500' : 'text-gray-400';
  const borderColor = isDark ? 'border-white/5' : 'border-gray-100';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50';

  return (
    <div className={cn('flex h-screen overflow-hidden transition-colors duration-300', bgMain, isDark && 'dark')}>
      {/* Sidebar — desktop */}
      <aside className={cn('hidden md:flex flex-col w-60 border-r flex-shrink-0 transition-colors duration-300', bgSidebar, borderColor)}>
        <SidebarContent
          router={router} commercant={commercant} onLogout={handleLogout}
          onToggleModule={handleToggleModule}
          isDark={isDark} toggleTheme={toggleTheme}
          textPrimary={textPrimary} textSecondary={textSecondary} textMuted={textMuted}
          borderColor={borderColor} hoverBg={hoverBg}
        />
      </aside>

      {/* Sidebar — mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className={cn('relative z-50 flex flex-col w-60 h-full shadow-xl transition-colors duration-300', bgSidebar)}>
            <SidebarContent
              router={router} commercant={commercant} onLogout={handleLogout}
              onToggleModule={handleToggleModule}
              isDark={isDark} toggleTheme={toggleTheme}
              textPrimary={textPrimary} textSecondary={textSecondary} textMuted={textMuted}
              borderColor={borderColor} hoverBg={hoverBg}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className={cn('md:hidden flex items-center justify-between px-4 py-3 border-b transition-colors duration-300', bgSidebar, borderColor)}>
          <button onClick={() => setMobileOpen(true)} className={textSecondary}>
            <Menu className="h-5 w-5" />
          </button>
          <span className={cn('font-semibold text-sm', textPrimary)}>Stamply</span>
          <button onClick={toggleTheme} className={cn('p-1.5 rounded-lg transition-colors', hoverBg, textSecondary)}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
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
  isDark: boolean;
  toggleTheme: () => void;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderColor: string;
  hoverBg: string;
  onClose?: () => void;
}

function SidebarContent({ router, commercant, onLogout, onToggleModule, isDark, toggleTheme, textPrimary, textSecondary, textMuted, borderColor, hoverBg, onClose }: SidebarContentProps) {
  const visibleNavItems = navItems;

  return (
    <>
      {/* Logo */}
      <div className={cn('flex items-center justify-between px-5 py-5 border-b', borderColor)}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-white" />
          </div>
          <span className={cn('font-bold', textPrimary)}>Stamply</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className={cn('p-1.5 rounded-lg transition-colors', hoverBg, textSecondary)}
            title={isDark ? 'Mode clair' : 'Mode sombre'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {onClose && (
            <button onClick={onClose} className={cn('p-1.5 rounded-lg transition-colors', hoverBg, textSecondary)}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Commerce name */}
      <div className={cn('px-5 py-3 border-b', borderColor)}>
        <p className={cn('text-xs font-medium uppercase tracking-wide mb-0.5', textMuted)}>Commerce</p>
        <p className={cn('text-sm font-semibold truncate', textPrimary)}>
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
                  if (isDisabled) { e.preventDefault(); return; }
                  onClose?.();
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isDisabled && 'opacity-40 cursor-not-allowed',
                  active && !isDisabled && 'bg-indigo-50 text-indigo-700',
                  !active && !isDisabled && cn(textSecondary, hoverBg),
                  active && isDisabled && cn('bg-gray-50', textMuted),
                )}
                title={isDisabled ? `${item.label} — module désactivé (cliquer pour réactiver)` : undefined}
              >
                <item.icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-indigo-600' : isDisabled ? 'text-gray-300' : textMuted)} />
                <span className="flex-1 truncate">{item.label}</span>
                {isDisabled && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (item.module && onToggleModule) onToggleModule(item.module, true);
                    }}
                    className="flex-shrink-0 text-[10px] text-gray-300 hover:text-indigo-500 transition-colors cursor-pointer"
                    title="Réactiver ce module"
                  >
                    🔒
                  </button>
                )}
              </Link>
            );
          })}
        </div>

        <div className={cn('px-3 mt-4 pt-4 border-t space-y-0.5', borderColor)}>
          {bottomItems.map((item) => {
            const active = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active ? 'bg-indigo-50 text-indigo-700' : cn(textSecondary, hoverBg)
                )}
                onClick={onClose}
              >
                <item.icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-indigo-600' : textMuted)} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className={cn('px-4 py-4 border-t', borderColor)}>
        <button
          onClick={onLogout}
          className={cn('flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors', textSecondary, 'hover:text-red-500 hover:bg-red-50')}
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>

      {/* Legal footer */}
      <div className={cn('px-5 py-3 border-t', borderColor)}>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link href="/mentions-legales" className={cn('text-xs transition-colors', textMuted, `hover:${textPrimary}`)}>Mentions légales</Link>
          <Link href="/cgu" className={cn('text-xs transition-colors', textMuted, `hover:${textPrimary}`)}>CGU</Link>
          <Link href="/politique-confidentialite" className={cn('text-xs transition-colors', textMuted, `hover:${textPrimary}`)}>Confidentialité</Link>
        </div>
      </div>
    </>
  );
}
