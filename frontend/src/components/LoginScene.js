import React, { useId, useMemo } from "react";

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

// Full-body statue facing right on its pedestal (viewBox 900x1000).
// The spear crosses the mirrored statue's at (900, -60), above the top-right corner.
function Statue({ className }) {
  const id = useId().replace(/:/g, "");
  const bronze = `url(#bronze-${id})`;
  return (
    <svg className={className} viewBox="0 0 900 1000" overflow="visible" aria-hidden="true">
      <defs>
        <linearGradient id={`bronze-${id}`} gradientUnits="userSpaceOnUse" x1="200" y1="100" x2="600" y2="1000">
          <stop offset="0" stopColor="#8a6424" />
          <stop offset="0.4" stopColor="#4a3310" />
          <stop offset="1" stopColor="#170f05" />
        </linearGradient>
      </defs>

      {/* Pedestal */}
      <rect className="lp-pedestal" x="40" y="962" width="520" height="38" />
      <rect className="lp-pedestal-lip" x="30" y="954" width="540" height="10" />

      <g fill={bronze} stroke={bronze} strokeLinecap="round" strokeLinejoin="round">
        {/* Spear shaft */}
        <path fill="none" strokeWidth="9" d="M353.6,334.7 L912.1,-68.8" />
        {/* Legs in a lunge, with knees and sandals */}
        <path fill="none" strokeWidth="58" d="M300,560 L232,705 L150,935" />
        <path fill="none" strokeWidth="62" d="M362,560 L448,700 L436,930" />
        <circle strokeWidth="0" cx="232" cy="705" r="34" />
        <circle strokeWidth="0" cx="448" cy="700" r="36" />
        <path strokeWidth="0" d="M118,922 L180,922 L186,960 L94,960 Z" />
        <path strokeWidth="0" d="M408,920 L470,920 L502,960 L402,960 Z" />
        {/* Pteruges skirt */}
        <path strokeWidth="0" d="M270,500 L400,500 L428,590 L410,580 L398,600 L384,584 L370,604 L356,586 L342,606 L328,588 L314,604 L300,586 L286,600 L272,582 L258,594 Z" />
        {/* Arm on the hip, elbow out behind */}
        <path fill="none" strokeWidth="46" d="M272,342 L196,430" />
        <path fill="none" strokeWidth="40" d="M196,430 L262,492" />
        {/* Cuirass */}
        <path strokeWidth="0" d="M262,330 C300,305 360,300 396,318 C426,334 432,380 424,430 C418,470 410,495 404,512 L276,512 C268,470 254,420 252,380 C250,356 252,340 262,330 Z" />
        <rect strokeWidth="0" x="312" y="262" width="40" height="60" rx="14" />
        {/* Spear arm reaching toward the entrance */}
        <path fill="none" strokeWidth="48" d="M392,332 L470,280" />
        <path fill="none" strokeWidth="40" d="M470,280 L540,200" />
        <circle strokeWidth="0" cx="540" cy="200" r="26" />
        {/* Corinthian helmet with a curling crest */}
        <path strokeWidth="0" d="M288,248 C284,200 312,176 344,178 C378,180 398,206 398,240 L402,268 L386,276 L390,300 C370,310 340,312 318,304 C300,298 290,282 288,268 Z" />
        <path strokeWidth="0" d="M318,188 C298,150 306,108 338,90 C368,74 406,86 416,116 C422,136 410,152 394,152 C382,152 374,142 378,130 C382,120 396,122 396,132 C400,112 382,98 362,106 C338,116 334,148 352,186 Z" />
        {/* Oval shield on the front arm */}
        <ellipse strokeWidth="0" cx="404" cy="424" rx="74" ry="122" transform="rotate(-14 404 424)" />
      </g>
      <ellipse className="lp-shield-rim" cx="404" cy="424" rx="62" ry="108" transform="rotate(-14 404 424)" fill="none" strokeWidth="4" />
      <path className="lp-shield-mark" d="M382,470 L408,380 L432,466" fill="none" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" />
      <path className="lp-eye" d="M372,236 L394,234" />
      <path className="lp-spearhead" d="M956.7,-101 L937.2,-73.4 L915,-64.8 L909.2,-72.9 L924.4,-91.2 Z" />
    </svg>
  );
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

      <Statue className="lp-statue left" />
      <Statue className="lp-statue right" />
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
