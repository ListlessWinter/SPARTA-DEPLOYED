import React, { useMemo } from "react";

// Decorative backdrop for the login page: night sky, two bronze Spartan statues
// lunging toward the temple entrance with their spears crossed above it, and braziers.

// Small seeded RNG so the scene looks the same on every render
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function Brazier({ className }) {
  return (
    <div className={`lp-brazier ${className}`} aria-hidden="true">
      <span className="lp-fire">
        <i /><i /><i />
      </span>
      <svg viewBox="0 0 60 70">
        <path d="M4,10 H56 L48,30 H12 Z" className="bowl" />
        <path d="M30,30 V62 M18,66 L30,56 L42,66" className="stand" fill="none" />
      </svg>
    </div>
  );
}

export default function LoginScene() {
  const { stars, embers } = useMemo(() => {
    const rand = rng(42);
    const stars = Array.from({ length: 70 }, () => ({
      left: `${(rand() * 100).toFixed(2)}%`,
      top: `${(rand() * 55).toFixed(2)}%`,
      size: rand() < 0.15 ? 3 : rand() < 0.5 ? 2 : 1,
      delay: `${(rand() * 6).toFixed(2)}s`,
      duration: `${(3 + rand() * 4).toFixed(2)}s`,
    }));
    const embers = Array.from({ length: 24 }, () => ({
      left: `${(10 + rand() * 80).toFixed(2)}%`,
      size: 2 + Math.round(rand() * 3),
      delay: `${(rand() * 12).toFixed(2)}s`,
      duration: `${(9 + rand() * 8).toFixed(2)}s`,
      drift: `${((rand() - 0.5) * 120).toFixed(0)}px`,
    }));
    return { stars, embers };
  }, []);

  return (
    <div className="lp-scene" aria-hidden="true">
      <div className="lp-sky" />
      <div className="lp-sun" />
      {stars.map((s, i) => (
        <span
          key={i}
          className="lp-star"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay, animationDuration: s.duration }}
        />
      ))}
      <div className="lp-rays" />
      <div className="lp-horizon" />

      <img src="/spartans.png" alt="" className="lp-statues" />
      <Brazier className="outer left" />
      <Brazier className="inner left" />
      <Brazier className="inner right" />
      <Brazier className="outer right" />

      <div className="lp-clash">
        <span className="lp-clash-glow" />
        <svg viewBox="-50 -50 100 100" className="lp-clash-burst">
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a, i) => (
            <line key={a} x1="0" y1="0" x2="0" y2={i % 2 ? -26 : -44} transform={`rotate(${a})`} />
          ))}
        </svg>
      </div>

      {embers.map((e, i) => (
        <span
          key={i}
          className="lp-ember"
          style={{ left: e.left, width: e.size, height: e.size, animationDelay: e.delay, animationDuration: e.duration, "--drift": e.drift }}
        />
      ))}

      <div className="lp-mist" />
    </div>
  );
}
