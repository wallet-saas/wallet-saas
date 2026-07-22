import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Head from "next/head"
import {
  Smartphone,
  ScanLine,
  MapPin,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  Sparkles,
  BellRing,
  Users,
  TrendingUp,
  ChevronDown,
  Check,
  BarChart3,
  Database,
  Gift,
  Star,
  Activity,
  PieChart,
  ShieldCheck,
  Lock,
} from "lucide-react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Reusable Components ---

const ShimmerButton = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => (
  <button
    className={cn(
      "relative overflow-hidden rounded-full bg-foreground text-background px-8 py-4 font-bold shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]",
      className,
    )}
  >
    <span className="relative z-10 flex items-center gap-2 justify-center">
      {children}
    </span>
    <div className="absolute inset-0 animate-shimmer pointer-events-none" />
  </button>
)

const SectionHeading = ({
  subtitle,
  title,
  description,
  light = false,
}: {
  subtitle: string
  title: React.ReactNode
  description?: string
  light?: boolean
}) => (
  <div className="text-center mb-16 md:mb-24">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mb-6 tracking-wide uppercase",
        light ? "bg-white/10 text-white" : "bg-primary/10 text-primary",
      )}
    >
      <Sparkles size={16} />
      {subtitle}
    </motion.div>
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className={cn(
        "text-4xl md:text-6xl font-black tracking-tight mb-6",
        light ? "text-white" : "text-foreground",
      )}
    >
      {title}
    </motion.h2>
    {description && (
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className={cn(
          "text-lg md:text-xl max-w-2xl mx-auto leading-relaxed",
          light ? "text-gray-400" : "text-muted-foreground",
        )}
      >
        {description}
      </motion.p>
    )}
  </div>
)

const FuturisticHeroBackground = () => (
  <>
    <div className="hero-grid-container">
      <div className="hero-grid" />
    </div>
    <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-[-1]" />
    <motion.div
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-multiply z-[-1] pointer-events-none"
    />
    <motion.div
      animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 2,
      }}
      className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] mix-blend-multiply z-[-1] pointer-events-none"
    />
  </>
)

const DisplayCard = ({
  icon: Icon,
  title,
  description,
  colorClass,
}: {
  icon: any
  title: string
  description: string
  colorClass: string
}) => (
  <motion.div
    whileHover={{ y: -8, scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className="group relative bg-white border border-border rounded-3xl p-8 shadow-sm hover:shadow-2xl overflow-hidden cursor-default"
  >
    <div
      className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500",
        colorClass,
      )}
    />
    <div className="relative z-10">
      <div
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3",
          colorClass
            .replace("bg-", "bg-opacity-20 text-")
            .replace("from-", "text-"),
        )}
      >
        <Icon
          size={28}
          className={
            colorClass.includes("primary")
              ? "text-primary"
              : colorClass.includes("purple")
                ? "text-purple-600"
                : "text-blue-600"
          }
        />
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </motion.div>
)

// --- Main App ---

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [calcCustomers, setCalcCustomers] = useState(20)
  const [calcTicket, setCalcTicket] = useState(15)
  const [calcDays, setCalcDays] = useState(24)
  const [calcRetention, setCalcRetention] = useState(10)
  const [faqOpen, setFaqOpen] = useState<number | null>(0)

  const extraRevenuePerMonth = Math.round(
    calcCustomers * calcDays * (calcRetention / 100) * calcTicket,
  )
  const extraRevenuePerYear = extraRevenuePerMonth * 12

  const sectors = [
    "Cafés",
    "Restaurants",
    "Coiffeurs",
    "Instituts de beauté",
    "Boutiques",
    "Boulangeries",
    "Fleuristes",
    "Salles de sport",
  ]

  const testimonials = [
    {
      text: "Le système de parrainage a généré 35% de nouveaux clients en 3 mois. L'outil marketing le plus rentable.",
      author: "Sophie Martin",
      role: "Directrice, Institut Bellezza",
      img: "S",
    },
    {
      text: "En 3 semaines j'avais 140 cartes actives. J'ai lancé une promo flash un vendredi soir, le samedi mon CA faisait +30%.",
      author: "Karima B.",
      role: "Gérante salon de coiffure",
      img: "K",
    },
    {
      text: "Ce que j'aimais avec le papier c'était la simplicité. Là c'est encore plus simple, et en plus ça marche vraiment.",
      author: "Mehdi R.",
      role: "Restaurateur — Paris",
      img: "M",
    },
    {
      text: "Nous avons remplacé toutes nos cartes papier en un jour. Nos coûts d'impression sont tombés à zéro.",
      author: "Thomas Lefèvre",
      role: "Boulangerie Le Fournil",
      img: "T",
    },
    {
      text: "L'interface est si simple que même mon équipe l'a prise en main en 5 minutes. Zéro formation nécessaire.",
      author: "Camille Bernard",
      role: "Maison Douce",
      img: "C",
    },
    {
      text: "Depuis qu'on a lancé les notifications push, les clients reviennent deux fois plus souvent.",
      author: "Antoine Girard",
      role: "Cave & Terroir",
      img: "A",
    },
  ]

  return (
    <>
      <Head>
        <title>Stamply — La carte de fidélité digitale qui fait revenir vos clients</title>
        <meta name="description" content="Remplacez vos cartes de fidélité papier par une carte digitale dans Apple Wallet & Google Wallet. Fidélisation, CRM, notifications push, géolocalisation." />
        <meta property="og:title" content="Stamply — Fidélité Digitale" />
        <meta property="og:description" content="Transformez chaque visite en client à vie. Carte digitale Apple Wallet & Google Wallet." />
      </Head>
    <div className="min-h-screen bg-background relative selection:bg-primary/20 selection:text-primary font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center text-white font-black shadow-lg">
              S
            </div>
            <span className="font-black text-xl tracking-tight">Stamply</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <a
              href="#fonctionnement"
              className="hover:text-foreground transition-colors"
            >
              Comment ça marche
            </a>
            <a
              href="#dashboard"
              className="hover:text-foreground transition-colors"
            >
              Analytics
            </a>
            <a
              href="#temoignages"
              className="hover:text-foreground transition-colors"
            >
              Avis
            </a>
            <a
              href="#tarifs"
              className="hover:text-foreground transition-colors"
            >
              Tarifs
            </a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {/* Bouton Admin */}
            <a
              href="/admin/login"
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-primary transition-all shadow-sm"
              title="Accès Administrateur"
            >
              <Lock size={14} />
            </a>
            <a
              href="/login"
              className="text-sm font-bold hover:text-primary transition-colors"
            >
              Connexion
            </a>
            <a
              href="mailto:contact@stamply.fr"
              className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-all shadow-md shadow-primary/20"
            >
              Démo gratuite
            </a>
          </div>

          <div className="md:hidden flex items-center gap-3">
            <a
              href="/admin/login"
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
            >
              <Lock size={14} />
            </a>
            <button
              className="text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 bg-white/95 backdrop-blur-3xl border-b border-border z-40 p-6 flex flex-col gap-4 shadow-2xl md:hidden"
          >
            <a
              href="#fonctionnement"
              onClick={() => setIsMenuOpen(false)}
              className="text-lg font-bold p-2"
            >
              Comment ça marche
            </a>
            <a
              href="#dashboard"
              onClick={() => setIsMenuOpen(false)}
              className="text-lg font-bold p-2"
            >
              Analytics
            </a>
            <a
              href="#temoignages"
              onClick={() => setIsMenuOpen(false)}
              className="text-lg font-bold p-2"
            >
              Avis
            </a>
            <a
              href="#tarifs"
              onClick={() => setIsMenuOpen(false)}
              className="text-lg font-bold p-2"
            >
              Tarifs
            </a>
            <hr className="my-2 border-border" />
            <a
              href="mailto:contact@stamply.fr"
              className="bg-primary text-white py-4 rounded-xl font-bold shadow-md w-full text-lg block text-center"
            >
              Réserver une démo
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* HERO */}
        <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6 relative min-h-[90vh] flex items-center">
          <FuturisticHeroBackground />
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center w-full">
            <div className="space-y-8 relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm font-bold shadow-sm"
              >
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                </span>
                La fidélité qui rapporte enfin
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-7xl lg:text-[5rem] font-black leading-[1.05] tracking-tight"
              >
                Transformez chaque visite en{" "}
                <span className="text-gradient block mt-2">client à vie.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-xl font-medium"
              >
                Une carte digitale dans leur téléphone en 2 clics. Zéro
                application. Récoltez leurs données, envoyez des relances, et
                doublez votre rétention.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <a
                  href="/register"
                  className="relative overflow-hidden rounded-full bg-foreground text-background px-8 py-4 font-bold shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] inline-flex items-center gap-2 justify-center"
                >
                  Commencer maintenant <ArrowRight size={20} />
                </a>
                <a
                  href="mailto:contact@stamply.fr"
                  className="px-8 py-4 rounded-full font-bold bg-white/50 backdrop-blur-md border border-white shadow-sm hover:bg-white transition-all flex items-center justify-center gap-2 text-foreground"
                >
                  Voir la démo
                </a>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full max-w-[360px] mx-auto perspective-1000"
            >
              <div className="animate-float-iphone relative z-10">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-purple-500/40 blur-[80px] rounded-full scale-110 -z-10" />

                <div className="w-[340px] h-[680px] bg-black rounded-[56px] p-2.5 shadow-2xl border-4 border-[#222] relative overflow-hidden ring-1 ring-white/20">
                  <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-20">
                    <div className="w-32 h-7 bg-black rounded-b-3xl" />
                  </div>
                  <div className="w-full h-full bg-[#f4f4f5] rounded-[44px] overflow-hidden flex flex-col relative">
                    <div className="pt-16 px-5 pb-6 flex-1 flex flex-col relative z-10">
                      <div className="flex justify-between items-center mb-6">
                        <span className="font-black text-3xl tracking-tight">
                          Cartes
                        </span>
                        <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center text-black">
                          <Wallet size={20} />
                        </div>
                      </div>

                      <div className="w-full bg-foreground rounded-[28px] p-7 text-white shadow-2xl relative overflow-hidden -mb-6 z-20 cursor-pointer transition-transform hover:-translate-y-2 border border-white/10">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/40 rounded-full blur-3xl -translate-y-10 translate-x-10" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl translate-y-10 -translate-x-10" />

                        <div className="flex items-center gap-4 mb-10 relative z-10">
                          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner border border-white/20">
                            C
                          </div>
                          <div>
                            <div className="font-black text-xl">Café Bloom</div>
                            <div className="text-white/70 text-sm font-medium">
                              Programme VIP
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-end relative z-10 mb-8">
                          <div>
                            <div className="text-5xl font-black font-mono tracking-tighter">
                              7
                              <span className="text-2xl text-white/50">
                                /10
                              </span>
                            </div>
                            <div className="text-white/80 text-sm font-medium mt-1">
                              Visites validées
                            </div>
                          </div>
                          <div className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center shadow-lg">
                            <ScanLine size={28} strokeWidth={2.5} />
                          </div>
                        </div>

                        <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "70%" }}
                            transition={{ duration: 1.5, delay: 1 }}
                            className="bg-gradient-to-r from-primary to-purple-400 h-full rounded-full relative"
                          >
                            <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                          </motion.div>
                        </div>
                      </div>

                      <div className="w-full h-32 bg-[#e2e8f0] rounded-[28px] p-6 shadow-sm relative z-10 scale-[0.93] origin-top border border-white/50 -mb-6" />
                      <div className="w-full h-32 bg-[#cbd5e1] rounded-[28px] p-6 shadow-sm relative z-0 scale-[0.86] origin-top border border-white/50" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Marquee Sectors */}
        <div className="py-8 bg-white border-y border-border/50 overflow-hidden flex whitespace-nowrap mask-edges">
          <div className="animate-marquee flex gap-16 items-center min-w-full">
            {[...sectors, ...sectors, ...sectors].map((sector, i) => (
              <span
                key={i}
                className="text-2xl font-black text-foreground/20 uppercase tracking-widest"
              >
                {sector}
              </span>
            ))}
          </div>
        </div>

        {/* HOW IT WORKS */}
        <section id="fonctionnement" className="py-24 md:py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <SectionHeading
              subtitle="Simple comme bonjour"
              title="Impossible à oublier"
              description="La puissance d'un grand groupe, la simplicité d'un outil pensé pour les indépendants."
            />

            <div className="space-y-32">
              {/* Step 1 */}
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="text-primary font-black text-xl mb-4">
                    Étape 01
                  </div>
                  <h3 className="text-4xl font-black mb-6">
                    Ajout au Wallet en 2 clics
                  </h3>
                  <p className="text-xl text-muted-foreground font-medium mb-8">
                    Le client scanne un QR code sur votre comptoir. Pas d'app,
                    pas de mot de passe. La carte s'ajoute directement dans son
                    Apple ou Google Wallet.
                  </p>
                  <ul className="space-y-4">
                    {[
                      "Friction zéro",
                      "Compatible 100% smartphones",
                      "Design à vos couleurs",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 font-semibold"
                      >
                        <div className="bg-green-100 text-green-600 p-1 rounded-full">
                          <Check size={18} strokeWidth={3} />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="relative h-[400px]"
                >
                  <div className="absolute inset-0 bg-primary/5 rounded-[3rem] border border-primary/10 flex items-center justify-center overflow-hidden">
                    <div className="border-beam-container rounded-3xl w-72 h-auto shadow-2xl rotate-3">
                      <div className="border-beam-content bg-white p-8 flex flex-col gap-4">
                        <a
                          href="/install/demo"
                          className="w-full bg-black text-white py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-lg"
                        >
                          Ajouter à Apple Wallet
                        </a>
                        <a
                          href="/install/demo"
                          className="w-full bg-white border-2 border-gray-200 py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-lg"
                        >
                          Ajouter à Google Wallet
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Step 2 - DATA COLLECTION */}
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="order-2 md:order-1 relative h-[450px]"
                >
                  <div className="absolute inset-0 bg-foreground rounded-[3rem] p-8 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-3xl rounded-full" />
                    <div className="flex justify-between items-center mb-8 text-white relative z-10">
                      <h4 className="font-bold text-xl">Base Clients (CRM)</h4>
                      <div className="bg-white/10 px-3 py-1 rounded-full text-sm font-bold">
                        +12 ce mois
                      </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                      {[
                        {
                          name: "Marie L.",
                          phone: "06 12 34 ** **",
                          visits: 12,
                          date: "À l'instant",
                          highlight: true,
                        },
                        {
                          name: "Thomas M.",
                          phone: "07 55 21 ** **",
                          visits: 4,
                          date: "Hier",
                          highlight: false,
                        },
                        {
                          name: "Sophie D.",
                          phone: "06 89 44 ** **",
                          visits: 24,
                          date: "Il y a 2 jours",
                          highlight: false,
                        },
                      ].map((row, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.2 }}
                          className={cn(
                            "p-4 rounded-2xl flex justify-between items-center",
                            row.highlight
                              ? "bg-primary/20 border border-primary/30"
                              : "bg-white/5 border border-white/5",
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-500 flex items-center justify-center text-white font-bold">
                              {row.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-white font-bold">
                                {row.name}
                              </div>
                              <div className="text-gray-400 text-xs font-mono">
                                {row.phone}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold">
                              {row.visits} visites
                            </div>
                            <div className="text-primary text-xs font-bold">
                              {row.date}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="order-1 md:order-2"
                >
                  <div className="text-primary font-black text-xl mb-4">
                    Étape 02
                  </div>
                  <h3 className="text-4xl font-black mb-6">
                    Un vrai CRM, sans effort
                  </h3>
                  <p className="text-xl text-muted-foreground font-medium mb-8">
                    Avec Stamply, vous capturez nom, email et téléphone
                    automatiquement et en toute légalité dès l'ajout de la
                    carte.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3 font-semibold">
                      <Database className="text-primary" /> Constitution de base
                      de données
                    </li>
                    <li className="flex items-center gap-3 font-semibold">
                      <BarChart3 className="text-primary" /> Suivi de la
                      fréquence de visite
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Step 3 */}
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="text-primary font-black text-xl mb-4">
                    Étape 03
                  </div>
                  <h3 className="text-4xl font-black mb-6">
                    Le bon message, au bon moment
                  </h3>
                  <p className="text-xl text-muted-foreground font-medium mb-8">
                    Faites les revenir. Envoyez des notifications push
                    illimitées directement sur leur écran de verrouillage. 100%
                    gratuit.
                  </p>
                  <a
                  href="mailto:contact@stamply.fr"
                  className="font-bold text-primary flex items-center gap-2 hover:gap-4 transition-all"
                >
                  Découvrir les campagnes automatisées{" "}
                  <ArrowRight size={20} />
                </a>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="w-full max-w-sm mx-auto space-y-6">
                    <motion.div
                      whileHover={{ scale: 1.02, x: -10 }}
                      className="glass-panel p-5 rounded-2xl flex gap-4 items-start relative z-20"
                    >
                      <div className="w-12 h-12 bg-foreground rounded-xl flex items-center justify-center shrink-0">
                        <MapPin size={24} className="text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-muted-foreground">
                          Notification Géolocalisée
                        </div>
                        <div className="font-black mt-1">
                          Vous êtes dans le coin ? 👋
                        </div>
                        <div className="text-sm font-medium mt-1">
                          Passez nous voir, votre 10ème menu est offert
                          aujourd'hui !
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02, x: 10 }}
                      className="glass-panel p-5 rounded-2xl flex gap-4 items-start opacity-90 relative z-10 translate-x-8"
                    >
                      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
                        <Gift size={24} className="text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-primary">
                          Campagne Anniversaire
                        </div>
                        <div className="font-black mt-1">
                          Joyeux Anniversaire ! 🎂
                        </div>
                        <div className="text-sm font-medium mt-1">
                          Un dessert vous attend sur présentation de ce message.
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* DASHBOARD ANALYTICS */}
        <section
          id="dashboard"
          className="py-32 px-6 bg-white relative overflow-hidden border-y border-border/50"
        >
          <div className="max-w-6xl mx-auto">
            <SectionHeading
              subtitle="Dashboard Analytics"
              title="Votre centre de commandement."
              description="Sachez exactement ce que votre programme rapporte. Prenez des décisions basées sur des chiffres réels, pas des impressions."
            />

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="w-full bg-foreground rounded-[3rem] p-4 md:p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="bg-[#1e293b]/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 md:p-10 w-full relative z-10">
                <div className="flex justify-between items-center mb-10">
                  <div className="text-white font-bold text-2xl">
                    Aperçu des performances
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-lg text-sm text-white font-medium flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />{" "}
                    Temps réel
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  {[
                    {
                      label: "CA Fidélité",
                      val: "16 328 €",
                      trend: "+28%",
                      color: "text-green-400",
                    },
                    {
                      label: "Cartes Actives",
                      val: "1 471",
                      trend: "+12%",
                      color: "text-green-400",
                    },
                    {
                      label: "Visites Répétées",
                      val: "846",
                      trend: "+45%",
                      color: "text-green-400",
                    },
                    {
                      label: "Taux de retour",
                      val: "68%",
                      trend: "+5%",
                      color: "text-green-400",
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="bg-white/5 border border-white/5 rounded-2xl p-6"
                    >
                      <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">
                        {stat.label}
                      </div>
                      <div className="text-white text-3xl font-black mb-2">
                        {stat.val}
                      </div>
                      <div className={cn("text-sm font-bold", stat.color)}>
                        {stat.trend} ce mois
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white/5 border border-white/5 rounded-3xl p-8 h-[300px] relative flex items-end">
                  <div className="absolute top-6 left-8">
                    <div className="text-white text-xl font-bold">
                      Évolution des revenus générés
                    </div>
                    <div className="text-gray-400 text-sm">
                      Les 6 derniers mois
                    </div>
                  </div>

                  <div className="w-full h-[60%] relative">
                    <svg
                      className="w-full h-full overflow-visible"
                      viewBox="0 0 1000 100"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient
                          id="gradient"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop
                            offset="0%"
                            stopColor="#6366F1"
                            stopOpacity="0.5"
                          />
                          <stop
                            offset="100%"
                            stopColor="#6366F1"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      <motion.path
                        d="M0,100 L0,80 L150,60 L300,70 L450,40 L600,50 L750,20 L900,30 L1000,0 L1000,100 Z"
                        fill="url(#gradient)"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                      />
                      <motion.path
                        d="M0,80 L150,60 L300,70 L450,40 L600,50 L750,20 L900,30 L1000,0"
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                      />
                      {[
                        { cx: 150, cy: 60 },
                        { cx: 450, cy: 40 },
                        { cx: 750, cy: 20 },
                        { cx: 1000, cy: 0 },
                      ].map((point, i) => (
                        <motion.circle
                          key={i}
                          cx={point.cx}
                          cy={point.cy}
                          r="6"
                          fill="#ffffff"
                          stroke="#818cf8"
                          strokeWidth="3"
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 1.5 + i * 0.2 }}
                        />
                      ))}
                    </svg>
                  </div>
                </div>
              </div>

              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/30 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none" />
            </motion.div>
          </div>
        </section>

        {/* DISPLAY CARDS (FEATURES) */}
        <section className="py-24 bg-background px-6">
          <div className="max-w-6xl mx-auto">
            <SectionHeading
              subtitle="L'arsenal complet"
              title="Tout ce dont vous avez besoin."
            />
            <div className="grid md:grid-cols-3 gap-6">
              <DisplayCard
                icon={MapPin}
                title="Géolocalisation"
                colorClass="bg-gradient-to-br from-indigo-500 to-primary"
                description="Envoyez automatiquement une notification sur leur écran de verrouillage lorsqu'ils sont proches."
              />
              <DisplayCard
                icon={Smartphone}
                title="Friction Zéro"
                colorClass="bg-gradient-to-br from-blue-400 to-blue-600"
                description="Pas d'app à télécharger. 2 clics et c'est dans leur téléphone (Apple & Google Wallet)."
              />
              <DisplayCard
                icon={ShieldCheck}
                title="100% Légal & RGPD"
                colorClass="bg-gradient-to-br from-green-400 to-green-600"
                description="Récoltez les données avec le consentement explicite de vos clients dès le premier ajout."
              />
            </div>
          </div>
        </section>

        {/* TESTIMONIALS V2 (Double Marquee) */}
        <section
          id="temoignages"
          className="py-32 bg-foreground text-background overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-dot-pattern opacity-[0.2] invert" />

          <div className="max-w-7xl mx-auto px-6 relative z-10 mb-16">
            <SectionHeading
              light
              subtitle="Ils l'utilisent au quotidien"
              title={
                <span className="text-white">Rejoignez les meilleurs.</span>
              }
              description="+30% de revenus, 140 cartes actives en 3 semaines, zéro pub Facebook. Leurs mots, pas les nôtres."
            />
          </div>

          <div className="relative z-10 flex flex-col gap-6 mask-edges">
            <div className="animate-marquee gap-6 items-center">
              {[...testimonials, ...testimonials].map((t, i) => (
                <div
                  key={i}
                  className="w-[400px] h-[220px] bg-[#1a1f2e] border border-white/10 rounded-[2rem] p-8 flex flex-col justify-between hover:bg-[#1f2537] transition-all hover:border-primary/50 shrink-0 group"
                >
                  <div className="flex gap-1 mb-4 text-yellow-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-lg text-white font-medium leading-snug line-clamp-3">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      {t.img}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">
                        {t.author}
                      </div>
                      <div className="text-xs text-gray-400">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="animate-marquee-reverse gap-6 items-center">
              {[...testimonials].reverse().concat(testimonials).map((t, i) => (
                <div
                  key={i}
                  className="w-[400px] h-[220px] bg-[#1a1f2e] border border-white/10 rounded-[2rem] p-8 flex flex-col justify-between hover:bg-[#1f2537] transition-all hover:border-purple-500/50 shrink-0 group"
                >
                  <div className="flex gap-1 mb-4 text-yellow-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-lg text-white font-medium leading-snug line-clamp-3">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center font-black text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      {t.img}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">
                        {t.author}
                      </div>
                      <div className="text-xs text-gray-400">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROI CALCULATOR */}
        <section
          id="roi"
          className="py-32 px-6 relative overflow-hidden bg-background"
        >
          <div className="max-w-5xl mx-auto">
            <SectionHeading
              subtitle="Calculateur ROI"
              title="Combien laissez-vous sur la table ?"
            />

            <div className="glass-card rounded-[3rem] p-8 md:p-12 shadow-2xl border border-white/60">
              <div className="grid lg:grid-cols-2 gap-16">
                <div className="space-y-10">
                  {[
                    {
                      label: "Clients par jour",
                      val: calcCustomers,
                      set: setCalcCustomers,
                      min: 10,
                      max: 300,
                      step: 5,
                      unit: "",
                    },
                    {
                      label: "Panier moyen",
                      val: calcTicket,
                      set: setCalcTicket,
                      min: 5,
                      max: 150,
                      step: 1,
                      unit: "€",
                    },
                    {
                      label: "Jours d'ouverture / mois",
                      val: calcDays,
                      set: setCalcDays,
                      min: 10,
                      max: 31,
                      step: 1,
                      unit: "j",
                    },
                    {
                      label: "Hypothèse de rétention",
                      val: calcRetention,
                      set: setCalcRetention,
                      min: 5,
                      max: 30,
                      step: 1,
                      unit: "%",
                      sub: "Pourcentage de clients qui reviendront 1 fois de plus",
                    },
                  ].map((slider, i) => (
                    <div key={i} className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="font-bold text-lg">
                          {slider.label}
                        </span>
                        <span className="text-primary text-2xl font-black">
                          {slider.val}
                          {slider.unit}
                        </span>
                      </div>
                      {slider.sub && (
                        <div className="text-sm text-muted-foreground -mt-2 font-medium">
                          {slider.sub}
                        </div>
                      )}
                      <input
                        type="range"
                        min={slider.min}
                        max={slider.max}
                        step={slider.step}
                        value={slider.val}
                        onChange={(e) => slider.set(Number(e.target.value))}
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  ))}
                </div>

                <div className="bg-foreground text-background rounded-[2.5rem] p-10 flex flex-col justify-center relative overflow-hidden shadow-2xl transform lg:scale-105">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-[60px]" />

                  <div className="relative z-10 space-y-8">
                    <div>
                      <h4 className="text-lg text-gray-400 font-bold uppercase tracking-wider mb-2">
                        Manque à gagner mensuel
                      </h4>
                      <div className="text-6xl font-black text-white tracking-tighter">
                        +{extraRevenuePerMonth.toLocaleString("fr-FR")} €
                      </div>
                    </div>

                    <div className="h-px bg-white/10 w-full" />

                    <div>
                      <h4 className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">
                        Impact sur l'année
                      </h4>
                      <div className="text-4xl font-black text-primary tracking-tight">
                        +{extraRevenuePerYear.toLocaleString("fr-FR")} €
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 relative z-10">
                    <a
                      href="/register"
                      className="block w-full bg-white text-black py-4 rounded-xl font-black text-lg hover:scale-[1.02] transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)] text-center"
                    >
                      Récupérer ce CA →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="tarifs" className="py-32 px-6 relative">
          <div className="max-w-4xl mx-auto">
            <SectionHeading
              subtitle="Tarif unique"
              title="Sans surprise. Sans engagement."
              description="La fidélisation digitale premium enfin accessible à tous les commerçants."
            />

            <div className="max-w-lg mx-auto border-beam-container shadow-2xl rounded-[3rem]">
              <div className="border-beam-content bg-white p-12 text-center rounded-[3rem]">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3">
                  <Sparkles className="text-primary" size={32} />
                </div>
                <h3 className="text-3xl font-black mb-4">Plan Commerçant</h3>
                <div className="flex justify-center items-end gap-2 mb-10">
                  <span className="text-7xl font-black tracking-tighter">
                    49€
                  </span>
                  <span className="text-muted-foreground font-bold mb-2 text-xl">
                    HT / mois
                  </span>
                </div>

                <ul className="space-y-5 text-left mb-12 text-lg">
                  {[
                    "Cartes clients illimitées",
                    "Notifications push géolocalisées",
                    "Apple Wallet & Google Wallet",
                    "CRM automatique & Analytics",
                    "Programme de parrainage inclus",
                    "Support & Accompagnement dédié",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-4">
                      <div className="bg-primary/10 p-1.5 rounded-full text-primary">
                        <Check size={18} strokeWidth={3} />
                      </div>
                      <span className="font-semibold">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="/register"
                  className="relative overflow-hidden rounded-full bg-foreground text-background px-8 py-4 font-bold shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] w-full text-xl py-6 block text-center"
                >
                  Démarrer mon essai
                </a>
                <div className="mt-6 text-sm text-muted-foreground font-bold uppercase tracking-widest">
                  14 jours gratuits • Sans carte bancaire
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-20 px-6 bg-foreground text-background">
          <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
            <div className="col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-foreground font-black shadow-lg">
                  S
                </div>
                <span className="font-black text-3xl tracking-tight">
                  Stamply
                </span>
              </div>
              <p className="text-gray-400 max-w-sm text-lg font-medium leading-relaxed">
                Remplacez votre carte de fidélité papier par un outil marketing
                surpuissant dans le téléphone de vos clients.
              </p>
            </div>

            <div>
              <h4 className="font-black text-xl mb-6">Produit</h4>
              <ul className="space-y-4 text-gray-400 font-bold">
                <li>
                  <a
                    href="#fonctionnement"
                    className="hover:text-white transition-colors"
                  >
                    Comment ça marche
                  </a>
                </li>
                <li>
                  <a
                    href="#dashboard"
                    className="hover:text-white transition-colors"
                  >
                    Analytics
                  </a>
                </li>
                <li>
                  <a
                    href="#temoignages"
                    className="hover:text-white transition-colors"
                  >
                    Témoignages
                  </a>
                </li>
                <li>
                  <a href="#roi" className="hover:text-white transition-colors">
                    Calculateur de CA
                  </a>
                </li>
                <li>
                  <a
                    href="#tarifs"
                    className="hover:text-white transition-colors"
                  >
                    Tarifs
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-xl mb-6">Entreprise</h4>
              <ul className="space-y-4 text-gray-400 font-bold">
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors font-bold">
                    Contactez-nous
                  </Link>
                </li>
                <li>
                  <Link href="/mentions-legales" className="hover:text-white transition-colors font-bold">
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link href="/politique-confidentialite" className="hover:text-white transition-colors font-bold">
                    Confidentialité
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/10 text-gray-500 font-bold flex flex-col md:flex-row justify-between items-center gap-4">
            <div>© 2026 Stamply. Tous droits réservés. Fabriqué en France.</div>
          </div>
        </footer>
      </main>
    </div>
    </>
  )
}
