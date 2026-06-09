'use client';

import { motion } from "framer-motion";
import { useLandingTheme } from "./theme";

export function Steps() {
  const t = useLandingTheme();

  const steps = [
    {
      number: "01",
      title: "Créez votre carte en 2 min",
      description: "Personnalisez les couleurs, ajoutez votre logo et définissez vos règles de fidélité depuis le dashboard."
    },
    {
      number: "02",
      title: "Vos clients l'ajoutent",
      description: "Ils scannent un QR code sur votre comptoir et ajoutent la carte à leur Wallet en un clic. Pas d'app à télécharger."
    },
    {
      number: "03",
      title: "Scannez et fidélisez",
      description: "À chaque visite, scannez leur carte avec votre téléphone pour ajouter des points automatiquement."
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.3 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 100 } }
  } as const;

  return (
    <section className="py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <h2 className={`text-3xl lg:text-5xl font-bold ${t.textPrimary} mb-6`}>
            Comment ça marche ?
          </h2>
          <p className={`${t.textSecondary} text-lg`}>
            Aussi simple pour vous que pour vos clients.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-12 relative"
        >
          {/* Connecting line for desktop */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5 }}
            className="hidden md:block absolute top-8 left-[10%] w-[80%] h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent -z-10 origin-left"
          />

          {steps.map((step, i) => (
            <motion.div key={i} variants={item} className="relative flex flex-col items-center text-center group">
              <div className={`w-16 h-16 rounded-2xl ${t.sectionBg} border border-indigo-500/30 flex items-center justify-center text-2xl font-bold text-indigo-400 mb-8 shadow-xl shadow-indigo-500/10 group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:border-indigo-400 transition-all duration-300 z-10`}>
                {step.number}
              </div>
              <h3 className={`text-2xl font-semibold ${t.textPrimary} mb-4 group-hover:text-indigo-300 transition-colors`}>{step.title}</h3>
              <p className={`${t.textSecondary} leading-relaxed text-lg group-hover:${t.pageText} transition-colors`}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
