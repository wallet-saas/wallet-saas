import { Wallet } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

export function Navbar() {
  const { scrollY } = useScroll();
  const background = useTransform(scrollY, [0, 50], ["rgba(10,10,15,0.8)", "rgba(10,10,15,0.95)"]);
  const border = useTransform(scrollY, [0, 50], ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.1)"]);

  return (
    <motion.nav
      style={{ backgroundColor: background, borderColor: border }}
      className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo à gauche */}
        <Link href="/" className="flex items-center gap-3 text-white shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Stamply</span>
        </Link>

        {/* Liens centrés */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <a href="#hero" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Produit</a>
          <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Fonctionnalités</a>
          <a href="#pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Tarifs</a>
        </div>

        {/* Boutons à droite */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/admin/login"
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            title="Administration"
          >
            ⚙
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="relative group overflow-hidden rounded-xl p-[1px]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 group-hover:opacity-100 transition-opacity opacity-70" />
            <div className="relative bg-black text-white px-4 py-2 rounded-xl text-sm font-medium group-hover:bg-opacity-0 transition-all">
              Démarrer le projet
            </div>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
