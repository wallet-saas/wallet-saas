import { Wallet } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-12 border-t border-white/10 bg-transparent relative z-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Stamply</span>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-slate-400">
          <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
          <Link href="/cgu" className="hover:text-white transition-colors">CGV</Link>
          <Link href="/politique-confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
        
        <div className="text-sm text-slate-500">
          © {new Date().getFullYear()} Stamply. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}