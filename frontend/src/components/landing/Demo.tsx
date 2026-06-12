'use client';

import { Users, TrendingUp, Gift, QrCode, Bell, Paintbrush, Zap, ArrowUpRight, CreditCard } from "lucide-react";
import { useLandingTheme } from "./theme";

export function Demo() {
  const t = useLandingTheme();

  return (
    <section className={`py-20 sm:py-32 overflow-hidden ${t.sectionBg}`} id="demo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-20">
          <div className={`inline-flex items-center justify-center gap-2 p-1.5 mb-4 rounded-full ${t.badgeBg}`}>
            <Zap className="w-3 h-3" /> Espace Commerçant
          </div>
          <h2 className={`text-2xl sm:text-3xl lg:text-5xl font-bold ${t.textPrimary} mb-4 sm:mb-6`}>
            Gérez tout depuis votre Dashboard
          </h2>
          <p className={`${t.textSecondary} text-base sm:text-lg`}>
            Une interface puissante pour analyser votre trafic, engager vos clients et personnaliser votre programme de fidélité.
          </p>
        </div>

        <div className={`relative mx-auto max-w-5xl rounded-2xl border ${t.cardBorder} ${t.cardBg} shadow-2xl overflow-hidden demo-reveal`}>
          {/* Dashboard Header */}
          <div className={`h-12 sm:h-16 border-b ${t.border} flex items-center px-4 sm:px-6 justify-between`}>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-green-500/80" />
              </div>
              <div className="hidden sm:flex gap-1 text-sm font-medium">
                <span className="text-white bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 rounded-lg">Vue d'ensemble</span>
                <span className={`${t.textSecondary} hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors`}>Clients</span>
                <span className={`${t.textSecondary} hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors`}>Campagnes</span>
              </div>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs sm:text-sm">
              JS
            </div>
          </div>

          {/* Dashboard Body */}
          <div className="p-4 sm:p-6 md:p-8 grid lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 md:space-y-8">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {[
                  { label: "Clients actifs", value: "1,204", icon: Users, trend: "+12.5%", color: "text-indigo-400", bg: "bg-indigo-500/10" },
                  { label: "Passages (30j)", value: "458", icon: TrendingUp, trend: "+8.2%", color: "text-green-400", bg: "bg-green-500/10" },
                  { label: "Récompenses", value: "89", icon: Gift, trend: "+24.1%", color: "text-purple-400", bg: "bg-purple-500/10" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={`${t.cardBg} ${t.cardBorder} p-3 sm:p-5 rounded-xl sm:rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] stat-card`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex justify-between items-start mb-2 sm:mb-4">
                      <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                        <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                        <ArrowUpRight className="w-3 h-3" />
                        {stat.trend}
                      </div>
                    </div>
                    <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${t.textPrimary} mb-0.5 sm:mb-1`}>{stat.value}</div>
                    <div className={`${t.textSecondary} text-xs sm:text-sm`}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className={`${t.cardBg} ${t.cardBorder} p-4 sm:p-6 rounded-xl sm:rounded-2xl`}>
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <div>
                    <h3 className={`${t.textPrimary} font-semibold text-base sm:text-lg`}>Fréquentation</h3>
                    <p className={`${t.textSecondary} text-xs sm:text-sm`}>Visites des 30 derniers jours</p>
                  </div>
                </div>
                <div className="h-32 sm:h-48 flex items-end justify-between gap-1">
                  {[40, 55, 45, 90, 65, 85, 120, 95, 110, 140, 100, 130, 80, 115, 75, 105, 125, 90].map((h, i) => (
                    <div
                      key={i}
                      className="w-full bg-gradient-to-t from-indigo-900/40 to-indigo-500/60 rounded-t-sm hover:to-indigo-400 transition-colors cursor-pointer chart-bar"
                      style={{ height: `${(h / 140) * 100}%`, animationDelay: `${i * 30}ms` }}
                    />
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className={`${t.cardBg} ${t.cardBorder} rounded-xl sm:rounded-2xl overflow-hidden`}>
                <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${t.border} flex justify-between items-center`}>
                  <h3 className={`${t.textPrimary} font-semibold text-sm sm:text-base`}>Activité Récente</h3>
                  <span className="text-indigo-400 text-xs sm:text-sm hover:text-indigo-300 cursor-pointer transition-colors">Voir tout</span>
                </div>
                <div className={`divide-y ${t.border}`}>
                  {[
                    { name: "Sophie Martin", action: "Nouveau scan", time: "Il y a 5 min", points: "+10 pts", positive: true },
                    { name: "Thomas Dubois", action: "Récompense utilisée", time: "Il y a 22 min", points: "-50 pts", positive: false },
                    { name: "Lucas Bernard", action: "Nouveau client", time: "Il y a 1 heure", points: "Carte créée", positive: null },
                  ].map((item, i) => (
                    <div key={i} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-medium text-xs sm:text-sm">
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <div className={`${t.textPrimary} text-xs sm:text-sm font-medium`}>{item.name}</div>
                          <div className={`${t.textSecondary} text-xs`}>{item.action} • {item.time}</div>
                        </div>
                      </div>
                      <div className={`text-xs sm:text-sm font-medium ${item.positive === true ? 'text-green-400' : item.positive === false ? 'text-red-400' : 'text-indigo-400'}`}>
                        {item.points}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className={`${t.cardBg} ${t.cardBorder} rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col`}>
              <div className={`flex items-center gap-2 ${t.textPrimary} font-semibold mb-4 sm:mb-6 text-sm sm:text-base`}>
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                Votre Carte Digitale
              </div>

              {/* Card Preview */}
              <div className="relative mx-auto w-full max-w-[200px] sm:max-w-[220px] rounded-2xl overflow-hidden border border-white/10 shadow-xl mb-6 sm:mb-8">
                <div className="aspect-[9/16] bg-gradient-to-br from-indigo-900 via-slate-900 to-black flex flex-col items-center justify-center p-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xl mb-4">
                    C
                  </div>
                  <div className="text-white font-semibold text-center">Votre Enseigne</div>
                  <div className="text-indigo-400 text-xs mt-1">Carte de fidélité</div>
                  <div className="mt-auto w-full bg-white/5 rounded-lg p-3 backdrop-blur-md">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs">Tampons</span>
                      <span className="text-white font-bold">0 / 10</span>
                    </div>
                    <div className="w-full bg-black/50 rounded-full h-1.5 mt-2">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: "0%" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="w-full flex flex-col gap-2 sm:gap-3 mt-auto">
                <p className={`text-xs ${t.textMuted} font-medium uppercase tracking-wider mb-1`}>Actions rapides</p>
                <button className="flex items-center gap-2 sm:gap-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 sm:p-3.5 rounded-xl font-medium transition-all duration-200 text-sm active:scale-[0.98]">
                  <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                  Générer un QR Code
                </button>
                <button className={`flex items-center gap-2 sm:gap-3 w-full ${t.cardBg} border ${t.border} ${t.textSecondary} p-2.5 sm:p-3.5 rounded-xl font-medium transition-all duration-200 text-sm hover:bg-white/10 active:scale-[0.98]`}>
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  Envoyer une Push Notif
                </button>
                <button className={`flex items-center gap-2 sm:gap-3 w-full ${t.cardBg} border ${t.border} ${t.textSecondary} p-2.5 sm:p-3.5 rounded-xl font-medium transition-all duration-200 text-sm hover:bg-white/10 active:scale-[0.98]`}>
                  <Paintbrush className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
                  Modifier le design
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
