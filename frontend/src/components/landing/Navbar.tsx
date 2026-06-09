'use client';

import { Wallet } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Stamply</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block px-4"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-white text-black px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Essayer gratuitement
          </Link>
        </div>
      </div>
    </nav>
  );
}
