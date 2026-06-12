'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wallet, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLandingTheme } from './theme';

const navLinks = [
  { href: '#hero', label: 'Produit' },
  { href: '#features', label: 'Fonctionnalités' },
  { href: '#pricing', label: 'Tarifs' },
];

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const t = useLandingTheme();
  const isDark = theme === 'dark';

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleMobileLink = () => setMobileOpen(false);

  return (
    <nav
      className={`
        fixed top-0 left-0 w-full z-50
        transition-all duration-300 ease-in-out
        border-b
        ${scrolled
          ? isDark
            ? 'bg-[#0A0A0F]/80 backdrop-blur-xl border-white/5 shadow-lg shadow-black/20'
            : 'bg-white/80 backdrop-blur-xl border-gray-200 shadow-lg shadow-gray-900/5'
          : isDark
            ? 'bg-[#0A0A0F]/60 backdrop-blur-md border-white/[0.03]'
            : 'bg-white/60 backdrop-blur-md border-gray-100'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className={`text-lg sm:text-xl font-bold tracking-tight ${t.textPrimary}`}>
            Stamply
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors duration-200 ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-white/10'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link
            href="/login"
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200 ${
              isDark
                ? 'text-slate-300 hover:text-white hover:bg-white/5'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Connexion
          </Link>

          <Link
            href="/register"
            className="text-sm font-medium bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-400 transition-colors duration-200 shadow-sm shadow-indigo-500/20"
          >
            Essayer gratuitement
          </Link>
        </div>

        {/* Mobile actions */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-white/10'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-white/10'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={`
          md:hidden fixed inset-0 top-14 z-40
          transition-opacity duration-300
          ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={handleMobileLink}
      >
        {/* Backdrop */}
        <div className={`absolute inset-0 ${isDark ? 'bg-black/60' : 'bg-gray-900/20'} backdrop-blur-sm`} />

        {/* Panel */}
        <div
          className={`
            absolute top-0 left-0 right-0
            border-b rounded-b-2xl
            transition-transform duration-300 ease-out
            ${isDark
              ? 'bg-[#0A0A0F]/95 border-white/5 shadow-2xl shadow-black/40'
              : 'bg-white/95 border-gray-200 shadow-2xl shadow-gray-900/10'
            }
            ${mobileOpen ? 'translate-y-0' : '-translate-y-4'}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleMobileLink}
                className={`
                  block text-sm font-medium py-3 px-4 rounded-xl
                  transition-colors duration-200
                  ${isDark
                    ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className={`border-t px-4 py-4 space-y-2 ${t.border}`}>
            <Link
              href="/login"
              onClick={handleMobileLink}
              className={`
                block text-sm font-medium py-3 px-4 rounded-xl text-center
                transition-colors duration-200
                ${isDark
                  ? 'text-slate-300 hover:bg-white/5'
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              Connexion
            </Link>
            <Link
              href="/register"
              onClick={handleMobileLink}
              className="block text-sm font-medium bg-indigo-500 text-white py-3 px-4 rounded-xl hover:bg-indigo-400 transition-colors duration-200 text-center shadow-sm shadow-indigo-500/20"
            >
              Essayer gratuitement
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
