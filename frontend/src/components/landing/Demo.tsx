'use client';

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Demo() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.4], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const rotateX = useTransform(scrollYProgress, [0, 0.4], [20, 0]);

  const stats = [
    { label: "Clients actifs", value: "1,204" },
    { label: "Visites ce mois", value: "458" },
    { label: "Récompenses", value: "89" }
  ];

  const chartData = [40, 70, 45, 90, 65, 85, 120, 95, 110, 140, 100, 130];
  const maxChart = Math.max(...chartData);

  return (
    <section id="demo" ref={containerRef} className="py-32 overflow-hidden relative" style={{ perspective: 1000 }}>
      {/* Dynamic Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-[100%] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Gérez tout depuis votre Dashboard
          </h2>
          <p className="text-slate-400 text-lg">
            Une interface simple et intuitive pour suivre votre activité et éditer votre carte en temps réel.
          </p>
        </motion.div>

        <motion.div
          style={{ scale, opacity, rotateX, transformStyle: "preserve-3d" }}
          className="relative mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[#12121a] shadow-[0_0_100px_-20px_rgba(99,102,241,0.3)] overflow-hidden"
        >
          {/* Browser Chrome */}
          <div className="h-14 border-b border-white/5 flex items-center px-4 justify-between bg-[#0A0A0F] backdrop-blur-md">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
            </div>
            <div className="flex gap-4 text-sm text-slate-400">
              <span className="text-white bg-white/10 px-3 py-1 rounded-md shadow-inner">Vue d&apos;ensemble</span>
              <span className="px-3 py-1 hover:text-white transition-colors cursor-pointer">Clients</span>
              <span className="px-3 py-1 hover:text-white transition-colors cursor-pointer">Design</span>
            </div>
          </div>

          {/* Dashboard Body */}
          <div className="p-8 grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4">
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -5 }}
                    className="bg-white/5 border border-white/5 p-5 rounded-2xl shadow-lg transition-colors hover:bg-white/10 hover:border-indigo-500/30"
                  >
                    <div className="text-slate-400 text-sm mb-2">{stat.label}</div>
                    <div className="text-3xl font-bold text-white">{stat.value}</div>
                  </motion.div>
                ))}
              </div>

              {/* Chart Mockup */}
              <div className="bg-white/5 border border-white/5 p-6 rounded-2xl h-72 flex flex-col justify-end gap-2 relative overflow-hidden group">
                <div className="absolute top-6 left-6 text-white font-medium">Visites des 30 derniers jours</div>

                {/* Simulated Chart Bars */}
                <div className="flex items-end justify-between h-48 mt-12 gap-2 relative z-10">
                  {chartData.map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${(h / maxChart) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05, type: "spring", stiffness: 100 }}
                      className="w-full bg-gradient-to-t from-indigo-600/50 to-indigo-400/80 rounded-t-md hover:from-indigo-500 hover:to-indigo-300 transition-colors cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0)] hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar - Card Editor Mock */}
            <div className="bg-[#0A0A0F]/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center backdrop-blur-xl">
              <div className="text-white font-medium w-full mb-6">Aperçu de la carte</div>

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-[200px] h-[320px] bg-gradient-to-br from-indigo-900 via-slate-900 to-black rounded-2xl p-5 shadow-2xl border border-indigo-500/30 flex flex-col relative"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(99,102,241,0.5)]">C</div>
                  <div className="text-white font-semibold">Le Club</div>
                </div>

                <div className="mt-auto bg-white/10 rounded-xl p-4 backdrop-blur-md border border-white/5">
                  <div className="w-full h-1.5 bg-black/50 rounded-full mb-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "60%" }}
                      transition={{ delay: 0.5, duration: 1 }}
                      className="h-full bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                    />
                  </div>
                  <div className="text-xs text-slate-300 flex justify-between font-medium">
                    <span>500 pts</span>
                    <span className="text-white">1000 pts</span>
                  </div>
                </div>
              </motion.div>

              <div className="w-full space-y-3 mt-8">
                <div className="w-full h-10 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer" />
                <div className="w-full h-10 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer" />
                <div className="w-full h-10 bg-indigo-500/20 border border-indigo-500/50 rounded-lg hover:bg-indigo-500/30 transition-colors cursor-pointer" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
