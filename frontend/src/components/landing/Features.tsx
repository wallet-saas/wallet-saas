'use client';

import { motion } from "framer-motion";
import { Wallet, QrCode, Palette, BarChart3, Bell, Smartphone, Zap, Shield } from "lucide-react";
import { useLandingTheme } from "./theme";

const features = [
  { icon: Wallet, title: "Google & Apple Wallet", desc: "Vos clients ajoutent leur carte directement dans leur app Wallet." },
  { icon: QrCode, title: "QR Code à scanner", desc: "Scannez le QR code client pour incrémenter ses tampons en 1 clic." },
  { icon: Palette, title: "Éditeur de carte", desc: "Personnalisez logo, couleurs, fond, overlay et polices en temps réel." },
  { icon: BarChart3, title: "Statistiques", desc: "Suivez les passages, tampons et récompenses en temps réel." },
  { icon: Bell, title: "Notifications push", desc: "Gardez le contact avec vos clients après chaque visite." },
  { icon: Smartphone, title: "100% mobile", desc: "Vos clients n'ont rien à installer. Wallet suffit." },
  { icon: Zap, title: "Configuration 2 min", desc: "Créez votre programme de fidélité en quelques clics." },
  { icon: Shield, title: "RGPD compliant", desc: "Données hébergées en France. Consentement explicite." },
];

export function Features() {
  const t = useLandingTheme();

  return (
    <section className={`py-16 sm:py-24 lg:py-32 ${t.sectionBg} relative`} id="features">
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[500px] bg-gradient-to-b from-indigo-500/5 via-purple-500/5 to-transparent blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-20">
          <h2 className={`text-2xl sm:text-3xl lg:text-5xl font-bold ${t.textPrimary} mb-4 sm:mb-6`}>
            Tout ce qu'il vous faut, <span className="text-indigo-400">sans la complexité</span>
          </h2>
          <p className={`${t.textSecondary} text-base sm:text-xl leading-relaxed`}>
            Stamply remplace vos cartes papier et fidélise vos clients automatiquement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className={`group p-5 sm:p-6 rounded-2xl border ${t.cardBorder} hover:border-indigo-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 ${t.cardBg}`}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-indigo-500/20 transition-colors">
                <f.icon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
              </div>
              <h3 className={`font-semibold ${t.textPrimary} mb-2 text-sm sm:text-base`}>{f.title}</h3>
              <p className={`${t.textSecondary} text-xs sm:text-sm leading-relaxed`}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
