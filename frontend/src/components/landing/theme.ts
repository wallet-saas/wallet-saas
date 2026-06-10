import { useTheme } from '@/contexts/ThemeContext';

/**
 * Returns theme-aware class strings for the landing page.
 * Usage: import { useLandingTheme } from '@/components/landing/theme';
 * const t = useLandingTheme();
 * <div className={t.bg}>...</div>
 */
export function useLandingTheme() {
  const { theme } = useTheme();
  const d = theme === 'dark'; // isDark

  return {
    // Page background
    pageBg: d ? 'bg-[#0A0A0F]' : 'bg-white',
    pageText: d ? 'text-slate-200' : 'text-gray-900',

    // Section backgrounds
    sectionBg: d ? 'bg-[#0A0A0F]' : 'bg-white',
    sectionBgAlt: d ? 'bg-[#0F0F16]' : 'bg-gray-50',
    cardBg: d ? 'bg-[#0F0F16] border-white/5' : 'bg-white border-gray-200',
    cardBgHover: d ? 'hover:border-indigo-500/30' : 'hover:border-indigo-300',
    cardBorder: d ? 'border-white/10' : 'border-gray-200',

    // Text
    textPrimary: d ? 'text-white' : 'text-gray-900',
    textSecondary: d ? 'text-slate-400' : 'text-gray-500',
    textMuted: d ? 'text-slate-500' : 'text-gray-400',

    // Border
    border: d ? 'border-white/5' : 'border-gray-200',
    borderLight: d ? 'border-white/10' : 'border-gray-300',

    // Badge/tag
    badgeBg: d ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600',

    // Input
    inputBg: d ? 'bg-black/30 border-white/10 text-white placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',

    // Glow effects (dark only)
    glowOrb: d ? '' : 'opacity-0',

    // Gradient text
    gradientText: 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400',
    gradientTextAlt: 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500',
  };
}
