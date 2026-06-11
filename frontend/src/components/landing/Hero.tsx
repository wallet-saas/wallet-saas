'use client';

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Wallet, CheckCircle2 } from "lucide-react";
import { MouseEvent } from "react";
import Link from "next/link";
import { useLandingTheme } from "./theme";

export function Hero() {
  const t = useLandingTheme();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), { damping: 30, stiffness: 100 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), { damping: 30, stiffness: 100 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;
    const xPct = mouseXPos / width - 0.5;
    const yPct = mouseYPos / height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section className="relative pt-24 pb-12 sm:pt-32 sm:pb-20 lg:pt-48 lg:pb-32 overflow-hidden" style={{ perspective: 1000 }}>
      {/* Background glowing orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/30 blur-[150px] rounded-full pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/20 blur-[150px] rounded-full pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${t.border} text-indigo-400 text-sm font-medium mb-8 backdrop-blur-sm ${t.sectionBgAlt}`}
            >
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              Nouveau : Intégration Apple & Google Wallet
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className={`text-3xl sm:text-4xl lg:text-7xl font-bold tracking-tight ${t.textPrimary} mb-4 sm:mb-6 leading-tight`}
            >
              La carte de fidélité de vos clients, <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-600">dans leur téléphone</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className={`text-xl ${t.textSecondary} mb-10 leading-relaxed max-w-lg`}
            >
              Fini le papier. Stamply génère une vraie carte Google Wallet & Apple Wallet en 2 minutes. Simplifiez la vie de vos clients et boostez votre rétention.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold rounded-2xl bg-indigo-500 text-white hover:bg-indigo-400 transition-colors gap-2 shadow-[0_0_30px_-10px_rgba(99,102,241,0.4)]"
                >
                  Essayer gratuitement
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.95 }}
              >
                <a
                  href="#demo"
                  className={`inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-2xl ${t.sectionBgAlt} ${t.textPrimary} ${t.border} transition-colors backdrop-blur-sm`}
                >
                  Voir la démo
                </a>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
              className={`mt-10 flex items-center gap-6 text-sm ${t.textSecondary}`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Sans engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Configuration en 2 min</span>
              </div>
            </motion.div>
          </motion.div>

          {/* 3D Phone Mockup Container */}
          <div
            className="relative lg:ml-auto w-full flex justify-center"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ perspective: 2000 }}
          >
            <motion.div
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d"
              }}
              className="relative w-[220px] h-[450px] sm:w-[280px] sm:h-[570px] lg:w-[320px] lg:h-[650px] bg-black rounded-[40px] sm:rounded-[50px] border-[6px] sm:border-[8px] border-slate-800 shadow-[0_0_80px_-20px_rgba(99,102,241,0.6)] flex flex-col overflow-hidden"
            >
              {/* Dynamic Island */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full z-30" style={{ transform: 'translateZ(20px)' }}></div>

              <div className="flex-1 bg-[#1c1c1e] p-6 relative flex flex-col h-full w-full" style={{ transformStyle: 'preserve-3d' }}>
                <motion.div
                  className="mt-12 flex justify-between items-center text-white mb-8"
                  style={{ transform: 'translateZ(30px)' }}
                >
                  <span className="text-lg font-semibold">Wallet</span>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </motion.div>

                {/* Loyalty Card Mockup - Parallax Element */}
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, type: "spring" as const, stiffness: 100 }}
                  style={{ transform: 'translateZ(60px)', transformStyle: 'preserve-3d' }}
                  className="w-full h-[420px] bg-gradient-to-br from-indigo-900 via-slate-900 to-black rounded-2xl p-6 shadow-2xl border border-white/10 flex flex-col relative overflow-hidden"
                >
                  {/* Glassmorphism shine */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/30 blur-[40px] rounded-full"
                  />

                  <div className="flex items-center justify-between mb-8 z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                        C
                      </div>
                      <div>
                        <div className="text-white font-semibold">Le Club</div>
                        <div className={`text-slate-400 text-xs`}>Coffee Shop</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center my-auto z-10" style={{ transform: 'translateZ(20px)' }}>
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1, type: "spring" as const, stiffness: 200 }}
                      className="text-4xl lg:text-6xl font-bold text-white mb-2"
                    >
                      1,250
                    </motion.div>
                    <div className="text-indigo-400 text-xs sm:text-sm font-medium uppercase tracking-wider">Points accumulés</div>
                  </div>

                  <div className="mt-auto z-10 bg-white/5 rounded-xl p-4 backdrop-blur-md border border-white/10" style={{ transform: 'translateZ(10px)' }}>
                    <div className="flex justify-between items-center mb-3">
                      <div className={`text-slate-300 text-sm`}>Prochaine récompense</div>
                      <div className="text-white font-bold">1,500 pts</div>
                    </div>
                    <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "80%" }}
                        transition={{ delay: 1.2, duration: 1.5, ease: "easeOut" }}
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
