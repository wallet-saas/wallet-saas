'use client';

import { useMemo } from 'react';
import { useLandingTheme } from "./theme";

// Génère des positions stables une seule fois (hors composant pour éviter la recréation)
const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: ((i * 37 + 13) % 100),   // pseudo-random déterministe
  top: ((i * 53 + 7) % 100),
  delay: ((i * 31) % 80) / 10,
  duration: 6 + ((i * 17) % 80) / 10,
}));

export function GlobalBackground() {
  const t = useLandingTheme();

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none" style={{ backgroundColor: '#0A0A0F' }}>
      {/* 3D Grid */}
      <div className="absolute inset-0 grid-3d-bg" />

      {/* Large glowing orbs */}
      <div className="absolute top-[10%] left-[15%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] animate-orb-1" />
      <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] animate-orb-2" />
      <div className="absolute bottom-[5%] left-[30%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] animate-orb-3" />
      <div className="absolute top-[60%] left-[5%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] animate-orb-4" />

      {/* Floating particles — positions stables */}
      <div className="absolute inset-0">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute w-1 h-1 bg-indigo-400/40 rounded-full animate-particle"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0A0A0F_80%)]" />
    </div>
  );
}
