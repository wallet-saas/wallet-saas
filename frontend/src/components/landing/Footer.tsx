'use client';

import { Wallet } from "lucide-react";
import Link from "next/link";
import { useLandingTheme } from "./theme";

export function Footer() {
  const t = useLandingTheme();

  return (
    <footer className={`py-12 border-t ${t.border}`} style={{ backgroundColor: t.pageBg.includes('bg-white') ? '#ffffff' : '#0A0A0F' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className={`text-xl font-bold tracking-tight ${t.textPrimary}`}>Stamply</span>
        </Link>

        <div className={`flex items-center gap-6 text-sm ${t.textSecondary}`}>
          <Link href="/mentions-legales" className={`hover:${t.textPrimary} transition-colors`}>Mentions légales</Link>
          <Link href="/cgu" className={`hover:${t.textPrimary} transition-colors`}>CGV</Link>
          <Link href="/politique-confidentialite" className={`hover:${t.textPrimary} transition-colors`}>Confidentialité</Link>
          <Link href="/contact" className={`hover:${t.textPrimary} transition-colors`}>Contact</Link>
        </div>

        <div className={`text-sm ${t.textMuted}`}>
          © {new Date().getFullYear()} Stamply. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
