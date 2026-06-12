import { motion } from "framer-motion";
import { XCircle, CheckCircle, Database, Shield, Zap } from "lucide-react";

export function Comparison() {
  return (
    <section className="py-24 lg:py-40 relative overflow-hidden bg-transparent">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center max-w-3xl mx-auto mb-24"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.05] text-slate-400 text-xs font-mono uppercase tracking-widest mb-6">
            <Database className="w-3 h-3" /> Transition Technologique
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Du carton à la <span className="text-indigo-400 font-serif italic">donnée pure.</span>
          </h2>
          <p className="text-slate-400 text-lg font-light">
            Délaissez les systèmes archaïques. Entrez dans l'ère de la fidélité programmatique et maximisez la Life Time Value de chaque client.
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white/5 -translate-x-1/2 overflow-hidden">
            <motion.div
              animate={{ top: ["-100%", "200%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 w-full h-32 bg-gradient-to-b from-transparent via-indigo-500 to-transparent shadow-[0_0_10px_#6366f1]"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-12 md:gap-24 relative" style={{ perspective: '2000px' }}>

            {/* Legacy System (Left) */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-red-500/5 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="p-8 border-l border-white/5 relative">
                <div className="absolute -left-[5px] top-8 w-[9px] h-[9px] rounded-full bg-black border-2 border-slate-700" />

                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-300">Système Legacy</h3>
                    <div className="text-xs font-mono text-slate-500 mt-1">CARTE_PAPIER_V1</div>
                  </div>
                </div>

                <div className="space-y-6">
                  {[
                    { title: "Perte de données", desc: "Aucun traçage analytique possible. Les clients sont anonymes." },
                    { title: "Friction UX", desc: "Support physique requis. Oubli fréquent par l'utilisateur final." },
                    { title: "Coûts latents", desc: "Impressions récurrentes et logistique de distribution." }
                  ].map((item, i) => (
                    <div key={i} className="group/item">
                      <h4 className="text-slate-400 font-medium mb-1 group-hover/item:text-slate-300 transition-colors">{item.title}</h4>
                      <p className="text-sm text-slate-600 font-light leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Stamply Protocol (Right) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="p-8 border-l border-indigo-500/30 relative bg-gradient-to-r from-indigo-500/[0.02] to-transparent">
                <div className="absolute -left-[5px] top-8 w-[9px] h-[9px] rounded-full bg-black border-2 border-indigo-500 shadow-[0_0_10px_#6366f1]" />

                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center relative overflow-hidden">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(99,102,241,0.5)_360deg)]"
                    />
                    <Zap className="w-6 h-6 text-indigo-400 relative z-10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Protocole Stamply</h3>
                    <div className="text-xs font-mono text-indigo-400 mt-1">WALLET_API_V2</div>
                  </div>
                </div>

                <div className="space-y-6 relative z-10">
                  {[
                    { title: "Data Analytics native", desc: "Suivi en temps réel des cohortes, de la fréquence et du churn." },
                    { title: "Rétention OS-Level", desc: "Intégration profonde iOS/Android via notifications Push natives." },
                    { title: "Scalabilité infinie", desc: "0 coût marginal par nouvel utilisateur. Déploiement instantané." }
                  ].map((item, i) => (
                    <div key={i} className="group/item">
                      <h4 className="text-indigo-100 font-medium mb-1 group-hover/item:text-white transition-colors">{item.title}</h4>
                      <p className="text-sm text-slate-400 font-light leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
