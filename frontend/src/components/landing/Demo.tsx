import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { 
  Users, TrendingUp, Gift, CreditCard, Paintbrush, 
  Bell, QrCode, ArrowUpRight, Search, Menu, Zap
} from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
const cardImage = "/landing-card.png";

export function Demo() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.4], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const rotateX = useTransform(scrollYProgress, [0, 0.4], [20, 0]);

  return (
    <section ref={containerRef} id="demo" className="py-32 overflow-hidden perspective-[2000px] relative">
      {/* Dynamic Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-[100%] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <div className="inline-flex items-center justify-center p-1.5 mb-4 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <span className="px-3 py-1 text-xs font-semibold text-indigo-400 uppercase tracking-widest bg-black/50 rounded-full flex items-center gap-2">
              <Zap className="w-3 h-3" /> Espace Commerçant
            </span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Gérez tout depuis votre Dashboard
          </h2>
          <p className="text-slate-400 text-lg">
            Une interface puissante pour analyser votre trafic, engager vos clients et personnaliser votre programme de fidélité.
          </p>
        </motion.div>

        <motion.div 
          style={{ scale, opacity, rotateX, transformStyle: "preserve-3d" }}
          className="relative mx-auto max-w-6xl rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-[0_0_80px_-20px_rgba(99,102,241,0.4)] overflow-hidden"
        >
          {/* Dashboard Header / Nav */}
          <div className="h-16 border-b border-white/5 flex items-center px-6 justify-between bg-slate-900/60 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-6">
              <div className="flex gap-2 mr-4">
                <div className="w-3.5 h-3.5 rounded-full bg-red-500/80 border border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80 border border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-green-500/80 border border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              </div>
              <div className="hidden md:flex gap-1 text-sm font-medium">
                <span className="text-white bg-indigo-500/20 border border-indigo-500/30 px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.2)]">Vue d'ensemble</span>
                <span className="text-slate-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer">Clients</span>
                <span className="text-slate-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer">Campagnes</span>
                <span className="text-slate-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer">Réglages</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-[#12121A] border border-white/10 px-3 py-1.5 rounded-lg">
                <Search className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-500">Rechercher...</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(99,102,241,0.5)] cursor-pointer">
                JS
              </div>
              <Menu className="w-5 h-5 text-slate-400 md:hidden" />
            </div>
          </div>

          {/* Dashboard Body */}
          <div className="p-6 md:p-8 grid lg:grid-cols-3 gap-8 bg-gradient-to-br from-[#0A0A0F] to-[#12121A]">
            
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Clients actifs", value: "1,204", icon: Users, trend: "+12.5%", color: "text-indigo-400", bg: "bg-indigo-500/10" },
                  { label: "Passages (30j)", value: "458", icon: TrendingUp, trend: "+8.2%", color: "text-green-400", bg: "bg-green-500/10" },
                  { label: "Récompenses", value: "89", icon: Gift, trend: "+24.1%", color: "text-purple-400", bg: "bg-purple-500/10" }
                ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl transition-all hover:bg-white/[0.04] hover:border-white/10 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} border border-white/5`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                        <ArrowUpRight className="w-3 h-3" />
                        {stat.trend}
                      </div>
                    </div>
                    
                    <div className="text-3xl font-bold text-white mb-1 tracking-tight">{stat.value}</div>
                    <div className="text-slate-400 text-sm font-medium">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Chart section */}
              <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-white font-semibold text-lg">Fréquentation</h3>
                    <p className="text-slate-400 text-sm">Visites des 30 derniers jours</p>
                  </div>
                  <select className="bg-[#12121A] border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none">
                    <option>30 derniers jours</option>
                    <option>7 derniers jours</option>
                    <option>Cette année</option>
                  </select>
                </div>
                
                {/* Simulated Chart Bars with Data visualization */}
                <div className="h-56 flex items-end justify-between gap-1.5 relative z-10 w-full mt-auto">
                  {/* Background grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between border-y border-white/5 pointer-events-none">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                      <div key={i} className="w-full h-px bg-white/5" />
                    ))}
                  </div>

                  {/* Bars */}
                  {[40, 55, 45, 90, 65, 85, 120, 95, 110, 140, 100, 130, 80, 115, 75, 105, 125, 90].map((h, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ height: 0 }}
                      whileInView={{ height: `${(h / 140) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.03, type: "spring" as const, stiffness: 100 }}
                      className="w-full relative group/bar cursor-pointer flex flex-col justify-end"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none border border-white/10">
                        {h} visites
                      </div>
                      
                      <div className="w-full h-full bg-gradient-to-t from-indigo-900/40 to-indigo-500/60 rounded-t-sm group-hover/bar:to-indigo-400 transition-colors" />
                    </motion.div>
                  ))}
                </div>
                {/* X-axis labels */}
                <div className="flex justify-between text-xs text-slate-500 mt-4 px-1">
                  <span>1er Nov</span>
                  <span>15 Nov</span>
                  <span>30 Nov</span>
                </div>
              </div>

              {/* Recent Activity List */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                  <h3 className="text-white font-semibold">Activité Récente</h3>
                  <span className="text-indigo-400 text-sm hover:text-indigo-300 cursor-pointer">Voir tout</span>
                </div>
                <div className="divide-y divide-white/5">
                  {[
                    { name: "Sophie Martin", action: "Nouveau scan", time: "Il y a 5 min", points: "+10 pts" },
                    { name: "Thomas Dubois", action: "Récompense utilisée", time: "Il y a 22 min", points: "-50 pts" },
                    { name: "Lucas Bernard", action: "Nouveau client", time: "Il y a 1 heure", points: "Carte créée" },
                  ].map((item, i) => (
                    <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-medium text-sm shadow-inner">
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{item.name}</div>
                          <div className="text-slate-400 text-xs">{item.action} • {item.time}</div>
                        </div>
                      </div>
                      <div className={`text-sm font-medium ${item.points.includes('+') ? 'text-green-400' : item.points.includes('-') ? 'text-red-400' : 'text-indigo-400'}`}>
                        {item.points}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Sidebar - Actions & Card Preview */}
            <div className="bg-[#12121A]/80 border border-white/5 rounded-2xl p-6 flex flex-col backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="flex items-center gap-2 text-white font-semibold mb-6">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                Votre Carte Digitale
              </div>
              
              {/* The Real Card Image in Dashboard */}
              <div className="relative mx-auto w-[220px] shadow-[0_20px_40px_rgba(0,0,0,0.6)] rounded-[1.5rem] overflow-hidden group mb-8 border border-white/10">
                <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center backdrop-blur-[2px]">
                   <span className="bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 shadow-xl backdrop-blur-md">
                     Voir en taille réelle
                   </span>
                </div>
                <ImageWithFallback 
                  src={cardImage} 
                  alt="Aperçu de votre carte de fidélité" 
                  className="w-full h-auto object-cover"
                />
              </div>
              
              {/* Action Buttons with real meaning */}
              <div className="w-full flex flex-col gap-3 mt-auto">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Actions rapides</p>
                
                <button className="flex items-center gap-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white p-3.5 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:-translate-y-0.5">
                  <QrCode className="w-5 h-5" />
                  Générer un QR Code
                </button>
                
                <button className="flex items-center gap-3 w-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-slate-200 p-3.5 rounded-xl font-medium transition-all">
                  <Bell className="w-5 h-5 text-purple-400" />
                  Envoyer une Push Notif
                </button>
                
                <button className="flex items-center gap-3 w-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-slate-200 p-3.5 rounded-xl font-medium transition-all">
                  <Paintbrush className="w-5 h-5 text-sky-400" />
                  Modifier le design
                </button>
              </div>
              
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
