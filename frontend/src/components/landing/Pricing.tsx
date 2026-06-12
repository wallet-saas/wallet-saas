import { motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";

export function Pricing() {
  const features = [
    "Création de carte personnalisée",
    "Intégration Google Wallet & Apple Wallet",
    "Scans et points illimités",
    "Dashboard analytique",
    "Base de données clients",
    "Support par email 7j/7"
  ];

  return (
    <section id="pricing" className="py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Un tarif simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">sans surprise</span>
          </h2>
          <p className="text-slate-400 text-lg">
            Tout ce dont vous avez besoin pour fidéliser vos clients, dans un seul abonnement. Rentabilisé dès les 5 premiers clients fidélisés.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, type: "spring" as const, stiffness: 100 }}
          className="max-w-lg mx-auto relative group"
        >
          {/* Animated gradient border via pseudo-element */}
          <div className="absolute -inset-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-[2.5rem] opacity-70 group-hover:opacity-100 blur-[2px] transition-opacity duration-500" />
          
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 lg:p-12 relative shadow-2xl shadow-indigo-500/20 overflow-hidden h-full">
            {/* Background ambient glow inside card */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Offre Unique
              </div>
              
              <h3 className="text-3xl font-semibold text-white mb-2">Plan Pro</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-6xl font-bold text-white tracking-tight">49€</span>
                <span className="text-slate-400 text-lg">/ mois</span>
              </div>
              <p className="text-slate-400 mb-10 text-lg">
                Sans engagement. Annulez à tout moment.
              </p>

              <motion.a
                href="/register"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 text-lg font-semibold rounded-2xl bg-white text-black hover:bg-slate-200 transition-colors mb-10 shadow-[0_0_30px_rgba(255,255,255,0.2)] inline-block text-center"
              >
                Commencer maintenant
              </motion.a>

              <div className="space-y-5">
                {features.map((feature, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                    key={i} 
                    className="flex items-center gap-4 text-slate-300"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="text-lg">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
