'use client';

import { motion } from "framer-motion";
import { Palette, QrCode, LineChart } from "lucide-react";
import { useLandingTheme } from "./theme";

export function Features() {
  const t = useLandingTheme();

  const features = [
    {
      icon: Palette,
      title: "Carte 100% personnalisable",
      description: "Couleurs, logo, image de fond. Créez une carte qui reflète parfaitement l'identité de votre commerce."
    },
    {
      icon: QrCode,
      title: "Scan ultra-rapide",
      description: "Scannez le QR code de vos clients en 1 seconde à chaque passage en caisse. Ajouter des points n'a jamais été aussi simple."
    },
    {
      icon: LineChart,
      title: "Dashboard & Analytics",
      description: "Suivez vos visites, vos points distribués et les récompenses réclamées. Comprenez enfin qui sont vos meilleurs clients."
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 100 } }
  } as const;

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className={`absolute top-1/2 left-0 -translate-y-1/2 w-full h-[500px] bg-gradient-to-b from-indigo-500/5 via-purple-500/5 to-transparent blur-[100px] pointer-events-none ${t.glowOrb}`} />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <h2 className={`text-3xl lg:text-5xl font-bold ${t.textPrimary} mb-6`}>
            Tout ce qu'il vous faut, <span className="text-indigo-400">sans la complexité</span>
          </h2>
          <p className={`${t.textSecondary} text-lg`}>
            Nous avons pensé Stamply pour être l'outil le plus simple de votre quotidien. Aucune compétence technique n'est requise.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-8"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={item}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
              className={`group relative ${t.cardBg} border ${t.border} p-8 rounded-[2rem]} ${t.cardBgHover} transition-colors shadow-lg overflow-hidden`}
              style={{ boxShadow: t.pageBg.includes('bg-white') ? '0 4px 20px rgba(0,0,0,0.05)' : '0 4px 20px rgba(0,0,0,0.5)' }}
            >
              {/* Hover glow effect inside card */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/5 transition-all duration-500 ease-out" />

              <div className="relative z-10">
                <div className={`w-14 h-14 ${t.sectionBgAlt} border ${t.border} rounded-2xl flex items-center justify-center mb-8 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all duration-300`}>
                  <feature.icon className="w-7 h-7 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                </div>
                <h3 className={`text-2xl font-semibold ${t.textPrimary} mb-4 group-hover:text-indigo-100 transition-colors`}>{feature.title}</h3>
                <p className={`${t.textSecondary} leading-relaxed group-hover:${t.pageText} transition-colors`}>
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
