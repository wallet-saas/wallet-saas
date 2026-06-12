import { useEffect, useState } from 'react';
import Head from 'next/head';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { SocialProof } from '@/components/landing/SocialProof';
import { Comparison } from '@/components/landing/Comparison';
import { Features } from '@/components/landing/Features';
import { Demo } from '@/components/landing/Demo';
import { Steps } from '@/components/landing/Steps';
import { Pricing } from '@/components/landing/Pricing';
import { FAQ } from '@/components/landing/FAQ';
import { Footer } from '@/components/landing/Footer';
import { GlobalBackground } from '@/components/landing/GlobalBackground';
import { useRouter } from 'next/router';

function Loader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A0F] overflow-hidden" style={{ perspective: '1200px' }}>
      <div className="absolute w-[800px] h-[800px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="relative flex items-center justify-center w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
        <div className="absolute flex flex-col items-center" style={{ transform: 'translateZ(150px) translateY(-140px)' }}>
          <h1 className="text-5xl md:text-8xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-200 to-indigo-600 uppercase text-center">
            Stamply
          </h1>
          <div className="flex items-center gap-6 mt-4">
            <div className="h-[2px] w-12 md:w-24 bg-gradient-to-r from-transparent to-indigo-500" />
            <span className="text-indigo-300 tracking-[0.8em] text-xs md:text-sm font-mono uppercase font-bold">Project</span>
            <div className="h-[2px] w-12 md:w-24 bg-gradient-to-l from-transparent to-indigo-500" />
          </div>
        </div>
        <div className="relative w-56 h-80 lg:w-64 lg:h-96" style={{ transformStyle: 'preserve-3d', transform: 'translateY(40px)' }}>
          <div className="absolute inset-0 bg-indigo-900/20 border border-indigo-500/20 rounded-[2rem]" style={{ transform: 'translateZ(-40px)' }} />
          <div className="absolute inset-0 border-[2px] border-indigo-400/60 rounded-[2rem] bg-indigo-500/10 backdrop-blur-sm" style={{ transform: 'translateZ(0px)' }}>
            <div className="absolute top-8 left-8 w-14 h-14 border-2 border-indigo-400/50 rounded-full" />
            <div className="absolute top-8 left-8 w-14 h-14 border border-indigo-300/80 rounded-full animate-ping" />
            <div className="absolute top-10 right-8 w-16 h-3 border border-indigo-400/40 rounded-full" />
            <div className="absolute top-16 right-8 w-10 h-2 border border-indigo-400/40 rounded-full" />
            <div className="absolute bottom-12 left-8 right-8 h-2 bg-indigo-400/20 rounded-full overflow-hidden border border-indigo-400/30">
              <div className="h-full bg-indigo-400 shadow-[0_0_15px_#818cf8] animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeContent() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const token = localStorage.getItem('stamply_token');
    if (token) {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>Stamply — Cartes de fidélité digitales Google Wallet & Apple Wallet</title>
        <meta name="description" content="Créez des cartes de fidélité digitales pour Google Wallet et Apple Wallet. 49€/mois. Configuration en 2 minutes. Sans engagement." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={`min-h-screen font-sans selection:bg-indigo-500/30 relative ${
        isDark
          ? "bg-[#0A0A0F] text-slate-200"
          : "bg-white text-gray-900"
      }`}>
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
      </div>
    </>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      {loading && <Loader />}
      <div style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.8s ease-in' }}>
        <HomeContent />
      </div>
    </ThemeProvider>
  );
}
