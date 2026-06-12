import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

function Particles({ scrollY }: { scrollY: any }) {
  // Generate stable random values for particles so they don't jump on re-renders
  const [particles] = useState(() => 
    Array.from({ length: 30 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.1,
      opacity: Math.random() * 0.5 + 0.1
    }))
  );

  return (
    <>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            // Particles drift up slowly as you scroll down
            y: useTransform(scrollY, [0, 5000], [0, -2000 * p.speed])
          }}
        />
      ))}
    </>
  );
}

export function GlobalBackground() {
  const { scrollY } = useScroll();
  
  // Parallax for the massive 3D grid
  // As we scroll down, the grid moves forward, creating depth
  const gridY = useTransform(scrollY, [0, 5000], [0, 1500]);
  
  // Parallax for the glowing orbs
  const orb1Y = useTransform(scrollY, [0, 3000], [0, 800]);
  const orb2Y = useTransform(scrollY, [0, 3000], [0, -500]);
  const beamY = useTransform(scrollY, [0, 2000], [0, 600]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#0A0A0F]">
      
      {/* 1. Deep Space Tech Grid (Holographic Floor/Ceiling Illusion) */}
      <motion.div 
        className="absolute left-1/2 -translate-x-1/2 top-[-50%] w-[300vw] h-[200vh] opacity-20"
        style={{
          y: gridY,
          backgroundImage: `
            linear-gradient(to right, rgba(99,102,241,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99,102,241,0.15) 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px",
          transform: "perspective(1000px) rotateX(60deg)",
          transformOrigin: "top center",
          WebkitMaskImage: "radial-gradient(ellipse 60% 50% at center, black 10%, transparent 70%)",
          maskImage: "radial-gradient(ellipse 60% 50% at center, black 10%, transparent 70%)"
        }}
      />

      {/* 2. Floating Ambient Glow Orbs */}
      <motion.div 
        style={{ y: orb1Y }}
        className="absolute top-[10%] left-[5%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px]"
      />
      <motion.div 
        style={{ y: orb2Y }}
        className="absolute top-[50%] right-[-10%] w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[130px]"
      />

      {/* 3. Central Vertical Data Beam */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.02] -translate-x-1/2 hidden md:block">
        <motion.div 
           className="absolute left-0 w-full h-[30vh] bg-gradient-to-b from-transparent via-indigo-500/30 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.4)]"
           style={{ y: beamY }}
        />
      </div>

      {/* 4. Interactive Floating Tech Particles */}
      <Particles scrollY={scrollY} />

      {/* Noise Grain Overlay for texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
    </div>
  );
}
