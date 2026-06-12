import { useTheme } from '@/contexts/ThemeContext';
import { useMemo } from 'react';

export function useLandingTheme() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return useMemo(() => ({
    sectionBg: isDark ? 'bg-[#0A0A0F]' : 'bg-white',
    sectionBgAlt: isDark ? 'bg-white/5' : 'bg-gray-50',
    textPrimary: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-slate-400' : 'text-gray-600',
    textMuted: isDark ? 'text-slate-500' : 'text-gray-400',
    border: isDark ? 'border-white/10' : 'border-gray-200',
    cardBg: isDark ? 'bg-white/[0.03]' : 'bg-white',
    cardBorder: isDark ? 'border-white/5' : 'border-gray-200',
  }), [isDark]);
}
