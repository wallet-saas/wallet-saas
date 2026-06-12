'use client';

import { XCircle, CheckCircle2, Zap } from "lucide-react";
import { useLandingTheme } from "./theme";

export function Comparison() {
  const t = useLandingTheme();

  return (
    <section className={`py-20 sm:py-32 relative overflow-hidden ${t.sectionBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20 reveal-on-scroll">
          <h2 className={`text-2xl sm:text-4xl lg:text-5xl font-bold ${t.textPrimary} mb-4 sm:mb-6`}>
            Du carton à la{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">donnée pure.</span>
          </h2>
          <p className={`${t.textSecondary} text-base sm:text-lg`}>
            Délaissez les systèmes archaïques. Entrez dans l'ère de la fidélité programmatique et maximisez la Life Time Value de chaque client.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 max-w-5xl mx-auto">
          {/* Legacy */}
          <div className={`${t.cardBg} ${t.cardBorder} rounded-2xl sm:rounded-3xl p-6 sm:p-8 reveal-left`}>
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
              </div>
              <div>
                <h3 className={`text-lg sm:text-xl font-semibold ${t.textPrimary}`}>Carte papier</h3>
                <div className="text-xs font-mono text-slate-500 mt-0.5">SYSTÈME LEGACY</div>
              </div>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {[
                { title: "Perte de données", desc: "Aucun traçage analytique possible. Les clients sont anonymes." },
                { title: "Friction UX", desc: "Support physique requis. Oubli fréquent par l'utilisateur final." },
                { title: "Coûts latents", desc: "Impressions, distribution, gestion manuelle." },
              ].map((item, i) => (
                <div key={i}>
                  <h4 className={`font-medium mb-1 ${t.textSecondary}`}>{item.title}</h4>
                  <p className={`text-sm ${t.textMuted} leading-relaxed`}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stamply */}
          <div className="relative reveal-right">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-2xl sm:rounded-3xl opacity-30 pointer-events-none" />
            <div className={`relative ${t.cardBg} rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-indigo-500/20`}>
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className={`text-lg sm:text-xl font-semibold ${t.textPrimary}`}>Stamply</h3>
                  <div className="text-xs font-mono text-indigo-400 mt-0.5">PROTOCOL STAMPLY</div>
                </div>
              </div>
              <div className="space-y-4 sm:space-y-6">
                {[
                  { title: "Data Analytics native", desc: "Suivi en temps réel des cohortes, de la fréquence et du churn." },
                  { title: "Rétention OS-Level", desc: "Intégration profonde iOS/Android via notifications Push natives." },
                  { title: "Scalabilité infinie", desc: "0 coût marginal par nouvel utilisateur. Déploiement instantané." },
                ].map((item, i) => (
                  <div key={i}>
                    <h4 className="font-medium mb-1 text-indigo-100">{item.title}</h4>
                    <p className={`text-sm ${t.textSecondary} leading-relaxed`}>{item.desc}</p>
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
