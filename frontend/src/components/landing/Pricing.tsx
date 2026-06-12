'use client';

import { CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useLandingTheme } from "./theme";

export function Pricing() {
  const t = useLandingTheme();

  const features = [
    "Création de carte personnalisée",
    "Intégration Google Wallet & Apple Wallet",
    "Scans et tampons illimités",
    "Dashboard analytique",
    "Base de données clients",
    "Notifications push",
    "Support 7j/7",
  ];

  return (
    <section className={`py-20 sm:py-32 relative overflow-hidden ${t.sectionBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-20">
          <h2 className={`text-2xl sm:text-3xl lg:text-5xl font-bold ${t.textPrimary} mb-4 sm:mb-6`}>
            Un tarif simple,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">sans surprise</span>
          </h2>
          <p className={`${t.textSecondary} text-base sm:text-lg`}>
            Tout ce dont vous avez besoin pour fidéliser vos clients, dans un seul abonnement.
          </p>
        </div>

        <div className="max-w-lg mx-auto relative group pricing-reveal">
          <div className="absolute -inset-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-[2rem] sm:rounded-[2.5rem] opacity-70 group-hover:opacity-100 blur-[2px] transition-opacity duration-500" />

          <div className={`relative rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 lg:p-12 shadow-2xl shadow-indigo-500/20 overflow-hidden h-full ${t.cardBg}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative z-10">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${t.badgeBg} text-sm font-medium mb-4 sm:mb-6`}>
                <Sparkles className="w-4 h-4" />
                Plan Pro
              </div>

              <h3 className={`text-2xl sm:text-3xl font-semibold ${t.textPrimary} mb-2`}>Plan Pro</h3>
              <div className="flex items-baseline gap-2 mb-4 sm:mb-6">
                <span className={`text-4xl sm:text-6xl font-bold ${t.textPrimary} tracking-tight`}>49€</span>
                <span className={`${t.textSecondary} text-base sm:text-lg`}>/ mois</span>
              </div>
              <p className={`${t.textSecondary} mb-6 sm:mb-10 text-base sm:text-lg`}>
                Sans engagement. Annulez à tout moment.
              </p>

              <Link
                href="/register"
                className="block w-full py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-2xl bg-indigo-500 text-white hover:bg-indigo-400 transition-all duration-200 text-center mb-6 sm:mb-10 shadow-[0_0_30px_rgba(99,102,241,0.3)] active:scale-[0.98]"
              >
                Commencer maintenant
              </Link>

              <div className="space-y-3 sm:space-y-5">
                {features.map((feature, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 sm:gap-4 ${t.textSecondary} feature-item`}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                    </div>
                    <span className="text-sm sm:text-lg">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
