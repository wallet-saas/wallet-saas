'use client';

import { Palette, QrCode, LineChart, Cpu, Fingerprint, Lock } from "lucide-react";
import { useLandingTheme } from "./theme";

export function Features() {
  const t = useLandingTheme();

  return (
    <section className={`py-20 sm:py-32 relative overflow-hidden ${t.sectionBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${t.badgeBg} text-xs font-mono uppercase tracking-widest mb-4 sm:mb-6`}>
            <Cpu className="w-3 h-3" /> Infrastructure
          </div>
          <h2 className={`text-2xl sm:text-4xl lg:text-5xl font-bold ${t.textPrimary} mb-4 sm:mb-6 tracking-tight`}>
            L'infrastructure de demain,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-600">
              dès aujourd'hui.
            </span>
          </h2>
          <p className={`${t.textSecondary} text-base sm:text-lg`}>
            Une technologie de pointe condensée dans une interface ultra-simple.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1 - Analytics */}
          <div className={`group relative ${t.cardBg} ${t.cardBorder} rounded-2xl sm:rounded-3xl p-6 sm:p-8 overflow-hidden hover:border-indigo-500/30 transition-all duration-500 card-reveal`}>
            <div className="absolute top-0 right-0 p-4 sm:p-8">
              <LineChart className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400/50" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
              <LineChart className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
            </div>
            <h3 className={`text-lg sm:text-xl font-semibold ${t.textPrimary} mb-2 sm:mb-3`}>Dashboard analytique</h3>
            <p className={`${t.textSecondary} text-sm sm:text-base`}>
              Analysez vos flux de clients en temps réel. Comprenez la rétention et optimisez vos campagnes de fidélité.
            </p>
          </div>

          {/* Card 2 - Scan QR */}
          <div className={`group relative ${t.cardBg} ${t.cardBorder} rounded-2xl sm:rounded-3xl p-6 sm:p-8 overflow-hidden hover:border-purple-500/30 transition-all duration-500 card-reveal`}>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <div className="w-16 h-10 sm:w-20 sm:h-12 border border-white/10 rounded-xl flex items-center justify-center relative">
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-purple-400 animate-scan-line" />
              </div>
            </div>
            <h3 className={`text-lg sm:text-xl font-semibold ${t.textPrimary} mb-2`}>Scan QR Code</h3>
            <p className={`${t.textSecondary} text-sm sm:text-base`}>
              Validation en 0.8s via notre lecteur QR intelligent. Fluidité totale en caisse.
            </p>
          </div>

          {/* Card 3 - Digital Identity */}
          <div className={`group relative ${t.cardBg} ${t.cardBorder} rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:border-blue-500/30 transition-all duration-500 card-reveal`}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
              <Fingerprint className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <h3 className={`text-lg sm:text-xl font-semibold ${t.textPrimary} mb-2`}>Identité Digitale</h3>
            <p className={`${t.textSecondary} text-sm sm:text-base`}>Intégration native Apple Wallet & Google Wallet.</p>
          </div>

          {/* Card 4 - Security */}
          <div className={`group relative ${t.cardBg} ${t.cardBorder} rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:border-emerald-500/30 transition-all duration-500 card-reveal`}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
              <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <h3 className={`text-lg sm:text-xl font-semibold ${t.textPrimary} mb-2`}>Sécurité Bancaire</h3>
            <p className={`${t.textSecondary} text-sm sm:text-base`}>Infrastructure sécurisée et données chiffrées de bout en bout.</p>
          </div>

          {/* Card 5 - Customization */}
          <div className={`group relative ${t.cardBg} ${t.cardBorder} rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:col-span-2 hover:border-pink-500/30 transition-all duration-500 card-reveal`}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-pink-500/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
              <Palette className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
            </div>
            <h3 className={`text-lg sm:text-xl font-semibold ${t.textPrimary} mb-2 sm:mb-3`}>API de Design</h3>
            <p className={`${t.textSecondary} text-sm sm:text-base`}>
              Personnalisez chaque pixel de la carte de fidélité. Reprenez le contrôle de votre image de marque avec notre API de personnalisation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
