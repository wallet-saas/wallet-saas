import { motion } from "framer-motion";
import { Coffee, Scissors, ShoppingBag, Utensils, Beer, Dumbbell, Sparkles, Store } from "lucide-react";

export function SocialProof() {
  const types = [
    { icon: Coffee, label: "Cafés" },
    { icon: Utensils, label: "Restaurants" },
    { icon: Scissors, label: "Salons de coiffure" },
    { icon: ShoppingBag, label: "Boutiques" },
    { icon: Beer, label: "Bars" },
    { icon: Dumbbell, label: "Salles de sport" },
    { icon: Store, label: "Concept Stores" },
    { icon: Sparkles, label: "Instituts de beauté" },
  ];

  const duplicatedTypes = [...types, ...types, ...types];

  return (
    <section className="py-20 relative overflow-hidden border-y border-white/5 bg-transparent">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

      <div className="absolute top-0 bottom-0 left-0 w-32 md:w-64 bg-gradient-to-r from-[#0A0A0F] to-transparent z-20 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-32 md:w-64 bg-gradient-to-l from-[#0A0A0F] to-transparent z-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center flex flex-col items-center gap-3"
        >
          <div className="inline-flex items-center justify-center p-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <span className="px-3 py-1 text-xs font-semibold text-indigo-400 uppercase tracking-widest bg-black/50 rounded-full">
              Rejoignez le mouvement
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Déjà adopté par plus de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">500 commerçants</span>
          </h2>
        </motion.div>
      </div>

      <div className="relative flex overflow-hidden h-32 items-center" style={{ perspective: 1000 }}>
        <motion.div
          initial={{ rotateX: 10 }}
          animate={{ x: ["0%", "-33.33%"] }}
          transition={{ ease: "linear", duration: 25, repeat: Infinity }}
          style={{ transformStyle: "preserve-3d" }}
          className="flex whitespace-nowrap gap-8 pl-8"
        >
          {duplicatedTypes.map((type, i) => (
            <motion.div
              key={i}
              whileHover={{
                scale: 1.1,
                rotateY: 0,
                translateZ: 30,
                backgroundColor: "rgba(99,102,241,0.15)",
                borderColor: "rgba(99,102,241,0.4)"
              }}
              style={{ transformStyle: "preserve-3d" }}
              className="group flex shrink-0 items-center gap-4 px-8 py-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md shadow-xl transition-all duration-300 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:border-indigo-400/50 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-300">
                <type.icon className="w-6 h-6 text-slate-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <span className="font-semibold text-lg text-slate-300 group-hover:text-white transition-colors">
                {type.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
