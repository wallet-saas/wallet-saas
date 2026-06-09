'use client';

import { Coffee, Scissors, ShoppingBag, Utensils, Beer } from "lucide-react";

export function SocialProof() {
  const types = [
    { icon: Coffee, label: "Cafés" },
    { icon: Utensils, label: "Restaurants" },
    { icon: Scissors, label: "Salons de coiffure" },
    { icon: ShoppingBag, label: "Boutiques" },
    { icon: Beer, label: "Bars" },
  ];

  return (
    <section className="py-12 border-y border-white/5 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-slate-400 mb-8 tracking-wider uppercase">
          Déjà adopté par plus de 500 commerçants
        </p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {types.map((type, i) => (
            <div key={i} className="flex items-center gap-3 text-slate-300">
              <type.icon className="w-6 h-6" />
              <span className="font-medium text-lg">{type.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
