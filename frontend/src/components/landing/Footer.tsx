'use client';

import { Wallet } from "lucide-react";
import Link from "next/link";
import { useLandingTheme } from "./theme";

export function Footer() {
  const t = useLandingTheme();

  return (
    <footer className={`py-10 sm:py-12 border-t ${t.border} ${t.sectionBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className={`text-lg sm:text-xl font-bold tracking-tight ${t.textPrimary}`}>Stamply</span>
          </Link>
          <div className={`flex items-center gap-4 sm:gap-6 text-xs sm:text-sm ${t.textSecondary} flex-wrap justify-center`}>
            <Link href="/mentions-legales" className="hover:opacity-80 transition-opacity">Mentions légales</Link>
            <Link href="/cgu" className="hover:opacity-80 transition-opacity">CGV</Link>
            <Link href="/politique-confidentialite" className="hover:opacity-80 transition-opacity">Confidentialité</Link>
            <Link href="/contact" className="hover:opacity-80 transition-opacity">Contact</Link>
          </div>
          <div className={`text-xs sm:text-sm ${t.textMuted}`}>
            © {new Date().getFullYear()} Stamply. Tous droits réservés.
          </div>
        </div>
      </div>
    </footer>
  );
}
