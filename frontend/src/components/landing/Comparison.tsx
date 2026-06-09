'use client';

import { motion } from "framer-motion";
import { XCircle, CheckCircle } from "lucide-react";
import { useLandingTheme } from "./theme";

export function Comparison() {
  const t = useLandingTheme();

  const paperProblems = [
    "Perdue ou oubliée par le client 1 fois sur 3",
    "Coût d'impression récurrent et impact écologique",
    "Aucune donnée client, impossible de les recontacter",
    "Image de marque vieillissante"
  ];

  const stamplyAdvantages = [
    "Toujours dans le téléphone (Apple/Google Wallet)",
    "Zéro impression, 100% digital",
    "Statistiques détaillées et base de données clients",
    "Image de marque premium et moderne"
  ];

  return (
    <section className="py-24 lg:py-40 relative">
      <div className={`absolute inset-0 ${t.sectionBgAlt}`} />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <h2 className={`text-3xl lg:text-5xl font-bold ${t.textPrimary} mb-6`}>
            Passez à la vitesse supérieure
          </h2>
          <p className={`${t.textSecondary} text-lg`}>
            La carte papier, c'est du passé. Offrez à vos clients une expérience moderne, mémorable et sans friction.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto" style={{ perspective: 1000 }}>
          {/* Paper Card Problem */}
          <motion.div
            initial={{ opacity: 0, rotateY: -15, x: -50 }}
            whileInView={{ opacity: 1, rotateY: 0, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`rounded-[2rem] p-8 lg:p-12 relative overflow-hidden border ${t.border} ${t.cardBg}`}
            style={{ background: t.pageBg.includes('bg-white') ? 'linear-gradient(to bottom, #f9fafb, #ffffff)' : 'linear-gradient(to bottom, #15151a, #0A0A0F)' }}
          >
            <div className="absolute top-0 right-0 p-6">
              <XCircle className={`w-10 h-10 ${t.textMuted}`} />
            </div>
            <h3 className={`text-2xl font-semibold ${t.pageText} mb-8 flex items-center gap-4`}>
              <span className={`px-3 py-1 rounded-full t.textMuted text-sm`} style={{ backgroundColor: t.pageBg.includes('bg-white') ? '#f3f4f6' : '#1e293b' }}>Avant</span>
              Carte papier
            </h3>
            <ul className={`space-y-6 ${t.textSecondary}`}>
              {paperProblems.map((text, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className={`w-1.5 h-1.5 rounded-full ${t.textMuted} mt-2.5 shrink-0`} />
                  <span className="leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Digital Solution */}
          <motion.div
            initial={{ opacity: 0, rotateY: 15, x: 50 }}
            whileInView={{ opacity: 1, rotateY: 0, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className={`rounded-[2rem] p-8 lg:p-12 relative overflow-hidden border ${t.borderLight}`}
            style={{ background: t.pageBg.includes('bg-white') ? 'linear-gradient(to bottom, #eef2ff, #ffffff)' : 'linear-gradient(to bottom, rgba(99,102,241,0.1), #0A0A0F)' }}
          >
            {/* Glow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/30 blur-[50px] rounded-full pointer-events-none ${t.glowOrb}`} />

            <div className="absolute top-0 right-0 p-6">
              <CheckCircle className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className={`text-2xl font-semibold ${t.textPrimary} mb-8 flex items-center gap-4`}>
              <span className={`px-3 py-1 rounded-full ${t.badgeBg} text-sm`}>Après</span>
              Carte Stamply
            </h3>
            <ul className={`space-y-6 ${t.pageText} relative z-10`}>
              {stamplyAdvantages.map((text, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2.5 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                  <span className="leading-relaxed font-medium">{text}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
