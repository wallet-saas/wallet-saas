/**
 * DemoAnimee — la partie « ce que ça vous rapporte » de la démo.
 *
 * Objectif : que le visiteur voie du mouvement et des chiffres qui montent,
 * pas une page figée. Trois mécaniques :
 *   1. des compteurs qui défilent quand le bloc entre à l'écran ;
 *   2. des notifications qui arrivent l'une après l'autre, en boucle ;
 *   3. les fonctionnalités qui se relaient automatiquement, avec barre de progression.
 *
 * Tout est calculé à partir des curseurs du visiteur : il voit SON chiffre.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { Bell, MapPin, Users, Star, TrendingUp, Repeat } from 'lucide-react';

/** Compteur qui défile de 0 à la valeur cible dès qu'il devient visible. */
function CompteurAnime({ valeur, suffixe = '', duree = 1.4 }: { valeur: number; suffixe?: string; duree?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: false, amount: 0.5 });
  const [affiche, setAffiche] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const controls = animate(0, valeur, {
      duration: duree,
      ease: 'easeOut',
      onUpdate: (v) => setAffiche(Math.round(v)),
    });
    return () => controls.stop();
  }, [visible, valeur, duree]);

  return (
    <span ref={ref}>
      {affiche.toLocaleString('fr-FR')}{suffixe}
    </span>
  );
}

const FONCTIONNALITES = [
  {
    id: 'notifications',
    icon: Bell,
    titre: 'Notifications illimitées',
    texte: "Une offre à pousser ? Vos clients l'ont sur leur écran en quelques secondes. Sans frais d'envoi, sans limite.",
    couleur: '#6366f1',
  },
  {
    id: 'geoloc',
    icon: MapPin,
    titre: 'Rappel de proximité',
    texte: "Un client passe devant votre vitrine : sa carte remonte sur son écran verrouillé. Il entre.",
    couleur: '#0ea5e9',
  },
  {
    id: 'retention',
    icon: Repeat,
    titre: 'Relances automatiques',
    texte: "Un client n'est pas revenu depuis 30 jours ? Il reçoit un message tout seul, pendant que vous travaillez.",
    couleur: '#f59e0b',
  },
  {
    id: 'avis',
    icon: Star,
    titre: 'Avis Google filtrés',
    texte: 'Les clients satisfaits vont sur votre fiche Google. Les mécontents arrivent chez vous, en privé.',
    couleur: '#22c55e',
  },
  {
    id: 'equipe',
    icon: Users,
    titre: 'Gestion d\u2019équipe',
    texte: 'Chaque employé a son code, ses accès et ses statistiques. Vous savez qui fait quoi.',
    couleur: '#a855f7',
  },
];

const NOTIFS_DEMO = [
  { titre: '🎁 Votre carte vous attend', texte: 'Plus que 2 tampons avant votre boisson offerte !' },
  { titre: '🔥 Offre du jour', texte: '-20 % sur les formules midi, aujourd\u2019hui seulement.' },
  { titre: '🎂 Joyeux anniversaire Marie', texte: 'Une part de gâteau vous attend cette semaine.' },
  { titre: '☕ Vous passez par là ?', texte: 'On vous garde une place au comptoir.' },
];

export function DemoAnimee({
  clientsParJour = 20,
  panierMoyen = 15,
  joursOuverture = 24,
}: {
  clientsParJour?: number;
  panierMoyen?: number;
  joursOuverture?: number;
}) {
  const [actif, setActif] = useState(0);
  const [notifVisible, setNotifVisible] = useState(0);

  // Les fonctionnalités se relaient toutes les 4 secondes
  useEffect(() => {
    const t = setInterval(() => setActif((i) => (i + 1) % FONCTIONNALITES.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Les notifications arrivent en boucle
  useEffect(() => {
    const t = setInterval(() => setNotifVisible((i) => (i + 1) % NOTIFS_DEMO.length), 2600);
    return () => clearInterval(t);
  }, []);

  // Hypothèse volontairement prudente : 1 visite de plus par mois pour 12 %
  // des clients grâce à la fidélisation.
  const clientsMois = clientsParJour * joursOuverture;
  const gainMensuel = Math.round(clientsMois * 0.12 * panierMoyen);
  const gainAnnuel = gainMensuel * 12;

  const F = FONCTIONNALITES[actif];

  return (
    <div className="space-y-12">
      {/* ── Ce que ça rapporte ── */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-8 sm:p-10 text-white overflow-hidden relative">
        <motion.div
          className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">
            Avec vos chiffres
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold mb-8">
            Ce que la fidélisation peut vous rapporter
          </h3>

          <div className="grid grid-cols-2 gap-6 sm:gap-10">
            <div>
              <p className="text-4xl sm:text-5xl font-black leading-none">
                +<CompteurAnime valeur={gainMensuel} suffixe=" €" />
              </p>
              <p className="text-sm text-white/70 mt-2">par mois</p>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-black leading-none">
                +<CompteurAnime valeur={gainAnnuel} suffixe=" €" duree={2} />
              </p>
              <p className="text-sm text-white/70 mt-2">sur l'année</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {[
              { label: 'clients fidélisés / mois', valeur: Math.round(clientsMois * 0.12) },
              { label: 'coût de Stamply / mois', valeur: 49, suffixe: ' €' },
            ].map((l) => (
              <div key={l.label} className="flex items-baseline gap-2">
                <span className="text-xl font-bold">
                  <CompteurAnime valeur={l.valeur} suffixe={l.suffixe || ''} />
                </span>
                <span className="text-white/60">{l.label}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-white/50 mt-6 max-w-lg">
            Estimation prudente basée sur une visite supplémentaire par mois pour 12 % de vos clients.
            Ajustez les curseurs plus haut pour voir vos propres chiffres.
          </p>
        </div>
      </div>

      {/* ── Les fonctionnalités qui se relaient ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-4">
            Tout est inclus
          </p>

          <div className="space-y-2">
            {FONCTIONNALITES.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setActif(i)}
                className={`w-full text-left rounded-xl px-4 py-3 transition-all flex items-center gap-3 ${
                  i === actif ? 'bg-white shadow-md scale-[1.02]' : 'hover:bg-white/60'
                }`}
              >
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    backgroundColor: i === actif ? f.couleur : '#f1f5f9',
                    color: i === actif ? '#fff' : '#94a3b8',
                  }}
                >
                  <f.icon className="h-4 w-4" />
                </div>
                <span className={`text-sm font-semibold ${i === actif ? 'text-gray-900' : 'text-gray-500'}`}>
                  {f.titre}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Panneau de la fonctionnalité active */}
        <div className="rounded-3xl bg-white border border-gray-100 shadow-xl p-7 min-h-[300px] flex flex-col">
          <motion.div
            key={F.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex-1"
          >
            <div
              className="h-12 w-12 rounded-2xl flex items-center justify-center mb-5"
              style={{ backgroundColor: `${F.couleur}18`, color: F.couleur }}
            >
              <F.icon className="h-6 w-6" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">{F.titre}</h4>
            <p className="text-gray-500 leading-relaxed">{F.texte}</p>
          </motion.div>

          {/* Barre de progression du carrousel */}
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-6">
            <motion.div
              key={`barre-${F.id}`}
              className="h-full rounded-full"
              style={{ backgroundColor: F.couleur }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 4, ease: 'linear' }}
            />
          </div>
        </div>
      </div>

      {/* ── Les notifications qui tombent ── */}
      <div className="rounded-3xl bg-gray-900 p-8 sm:p-10 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">En direct</p>
        <h3 className="text-xl sm:text-2xl font-extrabold mb-7">
          Ce que reçoivent vos clients, sans installer d'application
        </h3>

        <div className="space-y-3 min-h-[190px]">
          {NOTIFS_DEMO.map((n, i) => {
            const rang = (notifVisible - i + NOTIFS_DEMO.length) % NOTIFS_DEMO.length;
            const visible = rang < 3;
            return (
              <motion.div
                key={n.titre}
                animate={{
                  opacity: visible ? 1 - rang * 0.28 : 0,
                  y: visible ? 0 : 16,
                  scale: visible ? 1 - rang * 0.02 : 0.96,
                }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="rounded-2xl bg-white/10 backdrop-blur border border-white/10 px-4 py-3"
              >
                <p className="text-sm font-semibold">{n.titre}</p>
                <p className="text-sm text-white/60 mt-0.5">{n.texte}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mt-6 text-xs text-white/40">
          <TrendingUp className="h-3.5 w-3.5" />
          Envois illimités, inclus dans les 49 € par mois.
        </div>
      </div>
    </div>
  );
}
