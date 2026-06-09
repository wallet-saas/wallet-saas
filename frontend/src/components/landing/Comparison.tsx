'use client';

import { motion } from "framer-motion";
import { XCircle, CheckCircle } from "lucide-react";

export function Comparison() {
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
      <div className="absolute inset-0 bg-black/50" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Passez à la vitesse supérieure
          </h2>
          <p className="text-slate-400 text-lg">
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
            className="bg-gradient-to-b from-[#15151a] to-[#0A0A0F] border border-white/5 rounded-[2rem] p-8 lg:p-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6">
              <XCircle className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-300 mb-8 flex items-center gap-4">
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-sm">Avant</span>
              Carte papier
            </h3>
            <ul className="space-y-6 text-slate-400">
              {paperProblems.map((text, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-2.5 shrink-0" />
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
            className="bg-gradient-to-b from-indigo-500/10 to-[#0A0A0F] border border-indigo-500/20 rounded-[2rem] p-8 lg:p-12 relative overflow-hidden shadow-[0_0_80px_-20px_rgba(99,102,241,0.2)]"
          >
            {/* Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/30 blur-[50px] rounded-full pointer-events-none" />

            <div className="absolute top-0 right-0 p-6">
              <CheckCircle className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-8 flex items-center gap-4">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-sm">Après</span>
              Carte Stamply
            </h3>
            <ul className="space-y-6 text-slate-300 relative z-10">
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
