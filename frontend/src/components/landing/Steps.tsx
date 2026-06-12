'use client';

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
      description: "À chaque visite, scannez leur carte avec votre téléphone pour ajouter des tampons automatiquement."
    }
  ];

  return (
    <section className={`py-20 sm:py-32 relative overflow-hidden ${t.sectionBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-20">
          <h2 className={`text-2xl sm:text-3xl lg:text-5xl font-bold ${t.textPrimary} mb-4 sm:mb-6`}>
            Comment ça marche ?
          </h2>
          <p className={`${t.textSecondary} text-base sm:text-lg`}>
            Aussi simple pour vous que pour vos clients.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 sm:gap-12 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-8 left-[10%] w-[80%] h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent -z-10" />

          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center group step-card" style={{ animationDelay: `${i * 200}ms` }}>
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${t.cardBg} border border-indigo-500/30 flex items-center justify-center text-xl sm:text-2xl font-bold text-indigo-400 mb-6 sm:mb-8 shadow-xl shadow-indigo-500/10 group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:border-indigo-400 transition-all duration-300 z-10`}>
                {step.number}
              </div>
              <h3 className={`text-lg sm:text-2xl font-semibold ${t.textPrimary} mb-3 sm:mb-4 group-hover:text-indigo-300 transition-colors duration-300`}>{step.title}</h3>
              <p className={`${t.textSecondary} text-sm sm:text-base leading-relaxed group-hover:text-slate-300 transition-colors duration-300`}>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
