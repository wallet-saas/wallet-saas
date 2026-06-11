import { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
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

// Build ID for cache busting — changes on every deploy
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_BUILD_ID || Date.now().toString();

function HomeContent() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const token = localStorage.getItem('stamply_token');
    if (token) {
      router.replace('/dashboard');
    }
  }, []);

  return (
    <>
      <Head>
        <title>Stamply — Cartes de fidélité digitales Google Wallet & Apple Wallet</title>
        <meta name="description" content="Créez des cartes de fidélité digitales pour Google Wallet et Apple Wallet. 49€/mois. Configuration en 2 minutes. Sans engagement." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="build-id" content={BUILD_ID} />
        <script dangerouslySetInnerHTML={{ __html: `
          // Force cache invalidation on new deployments
          if (window.__STAMPLY_BUILD__ && window.__STAMPLY_BUILD__ !== '${BUILD_ID}') {
            window.location.reload(true);
          }
          window.__STAMPLY_BUILD__ = '${BUILD_ID}';
        `}} />
      </Head>
      <div className={`min-h-screen font-sans transition-colors duration-300 ${
        isDark
          ? "bg-[#0A0A0F] text-slate-200 selection:bg-indigo-500/30"
          : "bg-white text-gray-900 selection:bg-indigo-500/20"
      }`}>
        <Navbar />
        <main className="pt-16">
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
  return (
    <ThemeProvider>
      <HomeContent />
    </ThemeProvider>
  );
}
