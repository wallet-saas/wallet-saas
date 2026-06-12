import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Head from "next/head";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { SocialProof } from "@/components/landing/SocialProof";
import { Comparison } from "@/components/landing/Comparison";
import { Features } from "@/components/landing/Features";
import { Demo } from "@/components/landing/Demo";
import { Steps } from "@/components/landing/Steps";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { GlobalBackground } from "@/components/landing/GlobalBackground";

// ─── Loader 3D (exactement comme dans le ZIP App.tsx) ───────────────────────
function Loader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A0F] overflow-hidden"
      style={{ perspective: "1200px" }}
    >
      {/* Ambient background glow */}
      <div className="absolute w-[800px] h-[800px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* 3D Holodeck Grid Floor */}
      <motion.div
        className="absolute bottom-[-20vh] left-1/2 -translate-x-1/2 w-[300vw] h-[80vh] border-t border-indigo-500/30"
        style={{
          backgroundImage: `
            linear-gradient(to top, rgba(99,102,241,0.3) 1px, transparent 1px),
            linear-gradient(to right, rgba(99,102,241,0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          transform: "rotateX(75deg) translateZ(0px)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)",
          maskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)",
          transformOrigin: "top center",
        }}
        animate={{ backgroundPosition: ["0px 0px", "0px 60px"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />

      {/* BIG ZOOM WRAPPER */}
      <motion.div
        exit={{
          scale: 25,
          translateZ: 1000,
          opacity: 0,
          filter: "blur(20px)",
        }}
        transition={{
          duration: 1.2,
          ease: [0.7, 0, 0.1, 1],
        }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative flex items-center justify-center w-full h-full"
      >
        {/* Orbiting Holographic Rings */}
        <motion.div
          animate={{ rotateX: 65, rotateZ: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute w-[450px] h-[450px] border border-indigo-500/20 rounded-full border-t-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.2)_inset]"
          style={{ transformStyle: "preserve-3d" }}
        />
        <motion.div
          animate={{ rotateX: 75, rotateY: 15, rotateZ: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute w-[600px] h-[600px] border-2 border-indigo-500/10 rounded-full border-b-indigo-400 border-dashed"
          style={{ transformStyle: "preserve-3d" }}
        />

        {/* Floating Text: STAMPLY PROJECT */}
        <motion.div
          className="absolute flex flex-col items-center"
          style={{ transform: "translateZ(150px) translateY(-140px)" }}
        >
          <motion.h1
            animate={{
              textShadow: [
                "0 0 15px rgba(99,102,241,0.6)",
                "0 0 40px rgba(99,102,241,1)",
                "0 0 15px rgba(99,102,241,0.6)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-5xl md:text-8xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-200 to-indigo-600 uppercase text-center"
          >
            Stamply
          </motion.h1>
          <div className="flex items-center gap-6 mt-4">
            <div className="h-[2px] w-12 md:w-24 bg-gradient-to-r from-transparent to-indigo-500" />
            <span className="text-indigo-300 tracking-[0.8em] text-xs md:text-sm font-mono uppercase font-bold drop-shadow-[0_0_10px_rgba(99,102,241,0.8)]">
              Project
            </span>
            <div className="h-[2px] w-12 md:w-24 bg-gradient-to-l from-transparent to-indigo-500" />
          </div>
        </motion.div>

        {/* The 3D Multi-layered Hologram Card */}
        <motion.div
          initial={{ rotateY: -180, scale: 0 }}
          animate={{
            rotateY: [-10, 20, -10],
            rotateX: [5, 15, 5],
            scale: 1,
            translateY: [0, -20, 0],
          }}
          transition={{
            rotateY: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            rotateX: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            translateY: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 1.2, ease: "easeOut" },
          }}
          style={{ transformStyle: "preserve-3d", transform: "translateY(40px)" }}
          className="relative w-56 h-80 lg:w-64 lg:h-96"
        >
          {/* Back Layer - Dark Glass */}
          <div
            className="absolute inset-0 bg-indigo-900/20 border border-indigo-500/20 rounded-[2rem]"
            style={{ transform: "translateZ(-40px)" }}
          />

          {/* Middle Layer - Wireframe Data */}
          <div
            className="absolute inset-0 border-[2px] border-indigo-400/60 rounded-[2rem] bg-indigo-500/10 backdrop-blur-sm"
            style={{ transform: "translateZ(0px)" }}
          >
            <div className="absolute top-8 left-8 w-14 h-14 border-2 border-indigo-400/50 rounded-full" />
            <div className="absolute top-8 left-8 w-14 h-14 border border-indigo-300/80 rounded-full animate-ping" />
            <div className="absolute top-10 right-8 w-16 h-3 border border-indigo-400/40 rounded-full" />
            <div className="absolute top-16 right-8 w-10 h-2 border border-indigo-400/40 rounded-full" />
            <div className="absolute bottom-12 left-8 right-8 h-2 bg-indigo-400/20 rounded-full overflow-hidden border border-indigo-400/30">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
                className="h-full bg-indigo-400 shadow-[0_0_15px_#818cf8]"
              />
            </div>
          </div>

          {/* Front Layer - Floating Holographic Core */}
          <motion.div
            animate={{ rotateY: 360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-indigo-300 rounded-full flex items-center justify-center shadow-[0_0_30px_#818cf8]"
            style={{ transform: "translateZ(50px)" }}
          >
            <div
              className="w-8 h-8 bg-white rounded-sm shadow-[0_0_20px_#fff]"
              style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            />
          </motion.div>

          {/* Scanning Laser Line */}
          <motion.div
            animate={{ top: ["-5%", "105%", "-5%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-[-5%] right-[-5%] h-[3px] bg-indigo-200 shadow-[0_0_30px_#818cf8] z-20"
            style={{ transform: "translateZ(20px)" }}
          />
        </motion.div>

        {/* Floating Energy Particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -150, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 2, 0.5],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            className="absolute w-2 h-2 bg-indigo-300 rounded-full shadow-[0_0_10px_#fff]"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${20 + Math.random() * 60}%`,
              transform: `translateZ(${(Math.random() - 0.5) * 300}px)`,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────
export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Head>
        <title>Stamply — Cartes de fidélité digitales Google Wallet & Apple Wallet</title>
        <meta name="description" content="Créez des cartes de fidélité digitales pour Google Wallet et Apple Wallet. 49€/mois. Configuration en 2 minutes. Sans engagement." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Stamply — Cartes de fidélité digitales" />
        <meta property="og:description" content="Fini le papier. Stamply génère une vraie carte Google Wallet & Apple Wallet en 2 minutes." />
        <meta property="og:type" content="website" />
      </Head>

      <AnimatePresence>{loading && <Loader />}</AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="min-h-screen text-slate-200 font-sans selection:bg-indigo-500/30 relative"
      >
        <GlobalBackground />
        <Navbar />
        <main className="pt-16 relative z-10">
          <Hero />
          <SocialProof />
          <Comparison />
          <Features />
          <Demo />
          <Steps />
          <Pricing />
          <FAQ />
        </main>
        <Footer />
      </motion.div>
    </>
  );
}
