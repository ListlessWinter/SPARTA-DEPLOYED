import React, { useMemo } from "react";
const spartanHd = "/assets/spartan-hd.svg";

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

export function Brazier({ className }) {
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
  const stars = useMemo(() => {
    const rand = rng(42);
    return Array.from({ length: 70 }, () => ({
      left: `${(rand() * 100).toFixed(2)}%`,
      top: `${(rand() * 55).toFixed(2)}%`,
      size: rand() < 0.15 ? 3 : rand() < 0.5 ? 2 : 1,
      delay: `${(rand() * 6).toFixed(2)}s`,
      duration: `${(3 + rand() * 4).toFixed(2)}s`,
    }));
  }, []);

  return (
    <div className="lp-scene" aria-hidden="true">
      <div className="lp-sky" />
      {stars.map((s, i) => (
        <span
          key={i}
          className="lp-star"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay, animationDuration: s.duration }}
        />
      ))}

      <div className="lp-duel">
        <img src={spartanHd} alt="" className="lp-statue left" />
        <img src={spartanHd} alt="" className="lp-statue right" />
        <svg className="lp-spears" viewBox="-1 0 2 1" preserveAspectRatio="none">
          {[1, -1].map((s) => (
            <g key={s} transform={s < 0 ? 'scale(-1 1)' : undefined}>
              <line className="spear-rim" x1="-0.218" y1="0.225" x2="0.043" y2="0.054" />
              <line className="spear-core" x1="-0.218" y1="0.225" x2="0.043" y2="0.054" />
              {/* Gold socket and leaf-shaped head, matching the statue's spear */}
              <line className="spear-socket" x1="0.0313" y1="0.0617" x2="0.0447" y2="0.0529" />
              <polygon className="spear-head" points="0.0496,0.0640 0.0727,0.0537 0.1016,0.0156 0.0552,0.0269 0.0364,0.0440" />
              <line className="spear-rib" x1="0.0430" y1="0.0540" x2="0.0990" y2="0.0174" />
            </g>
          ))}
        </svg>
      </div>


      <div className="lp-mist" />
    </div>
  );
}
