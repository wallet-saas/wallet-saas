import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Wallet, CheckCircle2, Plus, Star, Gift, Sparkles, Bell } from "lucide-react";
import { MouseEvent, ReactNode } from "react";
import { ImageWithFallback } from "./ImageWithFallback";

function FloatingBadge({ delay, x, y, z, children }: { delay: number, x: string, y: string, z: number, children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring" as const, stiffness: 100, damping: 15 }}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translateZ(${z}px)`,
        transformStyle: 'preserve-3d',
        zIndex: 50
      }}
    >
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: delay * 0.5, ease: "easeInOut" }}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
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
    <section id="hero" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden" style={{ perspective: '2000px' }}>
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
            className="max-w-2xl relative z-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-sm font-medium mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            >
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              Nouveau : Intégration Apple & Google Wallet
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-tight"
            >
              La carte de fidélité de vos clients, <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-600">dans leur téléphone</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold mb-6"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              🚀 V1 Live — Auto-deploy opérationnel
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl text-slate-400 mb-10 leading-relaxed max-w-lg"
            >
              Fini le papier. Stamply génère une vraie carte Google Wallet & Apple Wallet en 2 minutes. Simplifiez la vie de vos clients et boostez votre rétention.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.a
                href="/register"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-2xl bg-indigo-500 text-white hover:bg-indigo-400 transition-colors gap-2 shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]"
              >
                Essayer gratuitement
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>
              <motion.a
                href="#demo"
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-2xl bg-white/5 text-white border border-white/10 transition-colors backdrop-blur-sm"
              >
                Voir la démo
              </motion.a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="mt-10 flex items-center gap-6 text-sm text-slate-400"
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
          <motion.div
            initial={{ y: 200, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, type: "spring" as const, bounce: 0.4 }}
            className="relative lg:ml-auto w-full flex justify-center"
            style={{ perspective: '2000px' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <motion.div
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              className="relative"
            >
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
                className="relative"
              >
                {/* Floating Elements */}
                <FloatingBadge delay={1.5} x="-50px" y="100px" z={80}>
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Star className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="font-bold text-white text-sm">+50 Pts</span>
                </FloatingBadge>

                <FloatingBadge delay={1.8} x="260px" y="280px" z={120}>
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Gift className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="font-bold text-white text-sm">Récompense!</span>
                </FloatingBadge>

                <FloatingBadge delay={2.1} x="-30px" y="450px" z={150}>
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="font-bold text-white text-sm">Niveau Or</span>
                </FloatingBadge>

                {/* The Phone Itself */}
                <div
                  className="relative w-[320px] h-[650px] rounded-[55px] p-[2px] bg-gradient-to-br from-slate-400 via-slate-800 to-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_80px_-20px_rgba(99,102,241,0.6)]"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="absolute inset-[2px] bg-black rounded-[53px] overflow-hidden flex flex-col transform-gpu" style={{ transformStyle: 'preserve-3d' }}>

                    {/* Dynamic Island */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[110px] h-[30px] bg-black rounded-full z-50 flex items-center justify-between px-3" style={{ transform: 'translateZ(30px)' }}>
                       <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                       <div className="w-2.5 h-2.5 rounded-full bg-indigo-500/50 blur-[1px]" />
                    </div>

                    {/* Screen Content - Apple Wallet Mock */}
                    <div className="flex-1 bg-[#000] p-5 pt-14 relative flex flex-col h-full w-full transform-gpu overflow-hidden" style={{ transformStyle: 'preserve-3d' }}>

                      {/* Background blurred card reflection */}
                      <div className="absolute inset-0 z-0 opacity-40">
                        <ImageWithFallback src="/landing-card.png" alt="" className="w-full h-full object-cover blur-[50px] scale-150" />
                        <div className="absolute inset-0 bg-black/60" />
                      </div>

                      <motion.div
                        className="flex justify-between items-center text-white mb-6 relative z-10"
                        style={{ transform: 'translateZ(20px)' }}
                      >
                        <span className="text-3xl font-bold tracking-tight">Wallet</span>
                        <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center">
                          <Plus className="w-5 h-5" />
                        </div>
                      </motion.div>

                      {/* Fake cards stacked behind */}
                      <motion.div
                        style={{ transform: 'translateZ(10px)', marginTop: '-10px' }}
                        className="w-[90%] mx-auto h-24 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-t-[1.5rem] opacity-50 border-t border-white/20"
                      />
                      <motion.div
                        style={{ transform: 'translateZ(15px)', marginTop: '-75px' }}
                        className="w-[95%] mx-auto h-24 bg-gradient-to-r from-orange-900 to-red-900 rounded-t-[1.5rem] opacity-70 border-t border-white/20"
                      />

                      {/* Loyalty Card Mockup - The Real Card */}
                      <motion.div
                        initial={{ y: 50, opacity: 0, rotateX: 20 }}
                        animate={{ y: 0, opacity: 1, rotateX: 0 }}
                        transition={{ delay: 0.6, type: "spring" as const, stiffness: 100 }}
                        style={{ transform: 'translateZ(60px)', transformStyle: 'preserve-3d', marginTop: '-70px' }}
                        className="w-full relative shadow-[0_20px_40px_rgba(0,0,0,0.8)] rounded-[1.5rem] overflow-hidden group cursor-pointer"
                      >
                        {/* Glassmorphism shine passing over */}
                        <motion.div
                          animate={{ left: ['-100%', '200%'] }}
                          transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
                          className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 z-20 pointer-events-none"
                        />

                        {/* Glowing backdrop matching the card */}
                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl scale-95 z-0" />

                        {/* The Real Card Image */}
                        <div className="relative z-10">
                          <ImageWithFallback
                            src="/landing-card.png"
                            alt="Votre carte de fidélité digitale"
                            className="w-full h-auto object-cover rounded-[1.5rem]"
                          />
                        </div>
                      </motion.div>

                      {/* Fake Wallet UI at the bottom */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                        style={{ transform: 'translateZ(40px)' }}
                        className="mt-auto bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white font-semibold text-sm">Dernier passage</p>
                          <p className="text-slate-400 text-xs mt-0.5">Aujourd'hui, 14:32</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-yellow-400" />
                        </div>
                      </motion.div>

                      {/* Fake home bar */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full z-50"></div>
                    </div>
                  </div>
                </div>

              </motion.div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
