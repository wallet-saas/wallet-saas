'use client';

import { useState } from 'react';
import { Wallet, Sun, Moon, Menu, X } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import { useLandingTheme } from "./theme";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const t = useLandingTheme();
  const isDark = theme === "dark";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 backdrop-blur-md transition-colors duration-300 border-b ${t.border}`} style={{ backgroundColor: isDark ? 'rgba(10,10,15,0.8)' : 'rgba(255,255,255,0.8)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <span className={`text-lg sm:text-xl font-bold tracking-tight ${t.textPrimary}`}>Stamply</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-colors ${isDark ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
            title={isDark ? "Mode clair" : "Mode sombre"}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link
            href="/login"
            className={`text-sm font-medium transition-colors px-4 ${isDark ? "text-slate-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-400 transition-colors"
          >
            Essayer gratuitement
          </Link>
        </div>

        {/* Mobile buttons */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`p-2 rounded-xl transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={`sm:hidden border-t ${t.border}`} style={{ backgroundColor: isDark ? 'rgba(10,10,15,0.95)' : 'rgba(255,255,255,0.95)' }}>
          <div className="px-4 py-3 space-y-2">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className={`block text-sm font-medium py-2.5 px-3 rounded-xl transition-colors ${isDark ? "text-slate-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-100"}`}
            >
              Connexion
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium bg-indigo-500 text-white py-2.5 px-3 rounded-xl hover:bg-indigo-400 transition-colors text-center"
            >
              Essayer gratuitement
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
