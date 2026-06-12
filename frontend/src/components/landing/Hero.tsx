'use client';

import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLandingTheme } from "./theme";

export function Hero() {
  const t = useLandingTheme();

  return (
    <section className="relative pt-24 pb-12 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background glowing orbs — CSS-only animation */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/30 blur-[150px] rounded-full pointer-events-none animate-[heroGlow_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/20 blur-[150px] rounded-full pointer-events-none animate-[heroGlow_10s_ease-in-out_1s_infinite]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Text Content ── */}
          <div className="max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">

            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${t.border} text-indigo-400 text-xs sm:text-sm font-medium mb-6 sm:mb-8 backdrop-blur-sm ${t.sectionBgAlt} animate-[heroFadeUp_0.5s_ease-out_0.2s_both]`}
            >
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              Nouveau : Intégration Apple &amp; Google Wallet
            </div>

            {/* Title */}
            <h1
              className={`text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight ${t.textPrimary} mb-4 sm:mb-6 leading-tight animate-[heroFadeUp_0.8s_ease-out_0.3s_both]`}
            >
              La carte de fidélité de vos clients,{" "}
              <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-600">
                dans leur téléphone
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className={`text-base sm:text-lg lg:text-xl ${t.textSecondary} mb-8 sm:mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0 animate-[heroFadeUp_0.8s_ease-out_0.4s_both]`}
            >
              Fini le papier. Stamply génère une vraie carte Google Wallet &amp; Apple Wallet en 2 minutes.
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start animate-[heroFadeUp_0.8s_ease-out_0.5s_both]"
            >
              <Link
                href="/register"
                className="group inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold rounded-2xl bg-indigo-500 text-white hover:bg-indigo-400 transition-all duration-200 gap-2 shadow-[0_0_30px_-10px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_-8px_rgba(99,102,241,0.5)] hover:scale-[1.03] active:scale-[0.97]"
              >
                Essayer gratuitement
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="#demo"
                className={`inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold rounded-2xl ${t.sectionBgAlt} ${t.textPrimary} ${t.border} transition-all duration-200 backdrop-blur-sm hover:scale-[1.03] active:scale-[0.97] hover:bg-white/10`}
              >
                Voir la démo
              </a>
            </div>

            {/* Trust badges */}
            <div
              className={`mt-8 sm:mt-10 flex flex-wrap items-center gap-4 sm:gap-6 text-sm ${t.textSecondary} justify-center lg:justify-start animate-[heroFadeUp_1s_ease-out_0.8s_both]`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Sans engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Configuration en 2 min</span>
              </div>
            </div>
          </div>

          {/* ── Phone Mockup ── */}
          <div className="relative flex justify-center lg:justify-end animate-[heroFadeUp_1s_ease-out_0.6s_both]">
            <div className="relative w-[240px] h-[480px] sm:w-[280px] sm:h-[560px] lg:w-[300px] lg:h-[600px]">
              {/* Glow behind phone */}
              <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full scale-75 pointer-events-none" />

              {/* Phone frame */}
              <div className="relative w-full h-full bg-[#1a1a1e] rounded-[40px] sm:rounded-[48px] border-[6px] sm:border-[7px] border-slate-700/80 shadow-[0_0_80px_-20px_rgba(99,102,241,0.5)] overflow-hidden">

                {/* Dynamic Island */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-[28px] sm:h-[30px] bg-black rounded-full z-20" />

                {/* Screen content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pt-10 pb-4 sm:px-5 sm:pt-12 sm:pb-5">
                  {/* Status bar area */}
                  <div className="w-full flex items-center justify-between mb-4 sm:mb-6">
                    <span className="text-white text-sm sm:text-base font-semibold">Wallet</span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                  </div>

                  {/* Loyalty Card Image */}
                  <div className="relative w-full flex-1 max-h-[380px] sm:max-h-[440px] lg:max-h-[460px] rounded-2xl overflow-hidden shadow-2xl animate-[heroCardFloat_6s_ease-in-out_infinite]">
                    <Image
                      src="/landing-card.png"
                      alt="Carte de fidélité Stamply dans Google Wallet et Apple Wallet"
                      fill
                      sizes="(max-width: 640px) 200px, (max-width: 1024px) 240px, 260px"
                      className="object-cover rounded-2xl"
                      priority
                    />
                    {/* Subtle overlay gradient for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none rounded-2xl" />
                  </div>
                </div>

                {/* Home indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/20 rounded-full" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Keyframe styles injected once */}
      <style jsx>{`
        @keyframes heroGlow {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.5; }
        }
        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes heroCardFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </section>
  );
}
