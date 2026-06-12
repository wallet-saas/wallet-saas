'use client';

import { Coffee, Scissors, ShoppingBag, Utensils, Beer, Dumbbell, Sparkles, Store } from "lucide-react";
import { useLandingTheme } from "./theme";

export function SocialProof() {
  const t = useLandingTheme();

  const types = [
    { icon: Coffee, label: "Cafés" },
    { icon: Utensils, label: "Restaurants" },
    { icon: Scissors, label: "Salons de coiffure" },
    { icon: ShoppingBag, label: "Boutiques" },
    { icon: Beer, label: "Bars" },
    { icon: Dumbbell, label: "Salles de sport" },
    { icon: Store, label: "Concept Stores" },
    { icon: Sparkles, label: "Instituts de beauté" },
  ];

  const duplicatedTypes = [...types, ...types, ...types];

  return (
    <section className={`py-16 sm:py-20 relative overflow-hidden border-y ${t.border}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-8 sm:mb-12">
        <div className="text-center flex flex-col items-center gap-3">
          <div className={`inline-flex items-center justify-center p-1.5 rounded-full ${t.badgeBg}`}>
            <span className="px-3 py-1 text-xs font-semibold text-indigo-400 uppercase tracking-widest rounded-full">
              Rejoignez le mouvement
            </span>
          </div>
          <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold ${t.textPrimary}`}>
            Déjà adopté par plus de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">500 commerçants</span>
          </h2>
        </div>
      </div>

      <div className="relative flex overflow-hidden h-28 sm:h-32 items-center mask-linear-fade">
        <div className="flex whitespace-nowrap gap-4 sm:gap-8 pl-4 sm:pl-8 animate-scroll">
          {duplicatedTypes.map((type, i) => (
            <div
              key={`${type.label}-${i}`}
              className={`group flex shrink-0 items-center gap-3 sm:gap-4 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl ${t.cardBg} ${t.cardBorder} backdrop-blur-md shadow-xl transition-all duration-300 cursor-pointer hover:scale-105`}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all duration-300">
                <type.icon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <span className={`font-semibold text-sm sm:text-lg ${t.textSecondary} group-hover:${t.textPrimary} transition-colors`}>
                {type.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
