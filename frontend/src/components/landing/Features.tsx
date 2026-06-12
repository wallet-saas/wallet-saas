import { motion } from "framer-motion";
import { Palette, QrCode, LineChart, Cpu, Fingerprint, Lock } from "lucide-react";

export function Features() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 90, damping: 20 } }
  };

  return (
    <section className="py-32 relative overflow-hidden bg-transparent">
      {/* Tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Floating Light orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.05] text-indigo-400 text-xs font-mono uppercase tracking-widest mb-6">
            <Cpu className="w-3 h-3" /> Architecture Next-Gen
          </div>
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
            L'infrastructure de demain, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-600">
              dès aujourd'hui.
            </span>
          </h2>
          <p className="text-slate-400 text-lg lg:text-xl font-light">
            Une technologie de pointe condensée dans une interface ultra-simple. Stamply est pensé comme un outil SaaS B2B premium, robuste et évolutif.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[300px]"
        >
          {/* Big Card - Analytics */}
          <motion.div 
            variants={item}
            className="md:col-span-2 lg:col-span-2 row-span-2 group relative bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden hover:border-indigo-500/30 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="absolute top-0 right-0 p-8">
              <LineChart className="w-8 h-8 text-indigo-400/50" />
            </div>

            <div className="absolute bottom-0 left-0 p-8 w-full z-20">
              <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight">Intelligence & Analytics</h3>
              <p className="text-slate-400 font-light max-w-md">
                Analysez vos flux de clients en temps réel. Notre moteur de données vous permet de comprendre la rétention et d'optimiser vos campagnes de fidélité instantanément.
              </p>
            </div>

            {/* Abstract visual */}
            <div className="absolute top-12 left-8 right-12 h-48 border-b border-l border-white/10 opacity-50 group-hover:opacity-100 transition-opacity">
               <svg viewBox="0 0 100 50" className="w-full h-full stroke-indigo-500/40 stroke-[0.5] fill-none" preserveAspectRatio="none">
                 <motion.path 
                   d="M0 40 Q 20 40, 30 20 T 50 10 T 70 30 T 100 5" 
                   initial={{ pathLength: 0 }}
                   whileInView={{ pathLength: 1 }}
                   transition={{ duration: 2, ease: "easeInOut" }}
                   className="stroke-indigo-400 stroke-1 shadow-[0_0_10px_#818cf8]"
                 />
                 <motion.path d="M0 50 L0 40 Q 20 40, 30 20 T 50 10 T 70 30 T 100 5 L100 50 Z" className="fill-indigo-500/10 stroke-none" />
               </svg>
            </div>
          </motion.div>

          {/* Medium Card - Scanner */}
          <motion.div 
            variants={item}
            className="md:col-span-1 lg:col-span-2 group relative bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden hover:border-purple-500/30 transition-all duration-500 flex flex-col justify-end p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Holographic scanner visual */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-32 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center">
              <QrCode className="w-12 h-12 text-slate-600 group-hover:text-purple-400 transition-colors" />
              <motion.div 
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 w-full h-[2px] bg-purple-400 shadow-[0_0_15px_#c084fc]"
              />
            </div>

            <div className="relative z-20 mt-auto text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Scan Cryptographique</h3>
              <p className="text-slate-400 font-light text-sm">
                Validation en 0.8s via notre lecteur de QR intelligent. Fluidité totale en caisse.
              </p>
            </div>
          </motion.div>

          {/* Small Card 1 */}
          <motion.div 
            variants={item}
            className="group relative bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-8 hover:border-blue-500/30 transition-all duration-500"
          >
             <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <Fingerprint className="w-6 h-6 text-blue-400" />
             </div>
             <h3 className="text-lg font-semibold text-white mb-2">Identité Digitale</h3>
             <p className="text-slate-400 text-sm font-light">Intégration native Apple Wallet & Google Pay.</p>
          </motion.div>

          {/* Small Card 2 */}
          <motion.div 
            variants={item}
            className="group relative bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-8 hover:border-emerald-500/30 transition-all duration-500"
          >
             <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <Lock className="w-6 h-6 text-emerald-400" />
             </div>
             <h3 className="text-lg font-semibold text-white mb-2">Sécurité Bancaire</h3>
             <p className="text-slate-400 text-sm font-light">Infrastructure sécurisée et données chiffrées de bout en bout.</p>
          </motion.div>
          
          {/* Medium Card - Customization */}
          <motion.div 
            variants={item}
            className="md:col-span-3 lg:col-span-2 group relative bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden hover:border-pink-500/30 transition-all duration-500 p-8"
          >
            <div className="absolute right-0 top-0 w-64 h-full">
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/80 z-10" />
              {/* Fake lines of code or grid */}
              <div className="w-full h-full opacity-20 group-hover:opacity-40 transition-opacity font-mono text-[10px] text-pink-500 leading-tight pt-8 pl-4">
                <div>{"{"}</div>
                <div className="pl-4">"theme": "dark",</div>
                <div className="pl-4">"accent": "#EC4899",</div>
                <div className="pl-4">"logo": "url(logo.png)",</div>
                <div className="pl-4">"points": 1250,</div>
                <div className="pl-4">"status": "active"</div>
                <div>{"}"}</div>
              </div>
            </div>

            <div className="relative z-20 max-w-sm">
              <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center mb-6">
                <Palette className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">API de Design</h3>
              <p className="text-slate-400 font-light text-sm leading-relaxed">
                Reprenez le contrôle de votre image de marque. Personnalisez chaque pixel de la carte de fidélité pour qu'elle s'intègre parfaitement à votre identité visuelle.
              </p>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
