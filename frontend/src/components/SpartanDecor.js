import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import "../styles/SpartanDecor.css";

// Small Sparta-themed decorations shared by redesigned pages.

// Greek key (meander) strip that tiles horizontally
export function Meander({ className = "", height = 12 }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={`sp-meander ${className}`} width="100%" height={height} aria-hidden="true">
      <defs>
        <pattern id={`mz-${id}`} width={height * 1.2} height={height} patternUnits="userSpaceOnUse" viewBox="0 0 24 20">
          <path d="M0,1 H24 M0,19 H24 M3,19 V5 H17 V15 H9 V10 H13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#mz-${id})`} />
    </svg>
  );
}

// Two laurel branches around a circle of radius r centred in a size x size box
export function Laurel({ size = 200, r = 78, className = "" }) {
  const leaves = useMemo(() => {
    const c = size / 2;
    const out = [];
    const branch = (from, to, dir) => {
      for (let a = from; dir > 0 ? a <= to : a >= to; a += 13 * dir) {
        const rad = (a * Math.PI) / 180;
        const x = c + r * Math.cos(rad);
        const y = c + r * Math.sin(rad);
        const tangent = a + 90 * dir;
        // Leaves get smaller toward the tips of each branch
        const t = Math.abs(a - from) / Math.abs(to - from);
        const s = 1 - t * 0.45;
        [-1, 1].forEach((side) => {
          const off = 7 * s * side;
          out.push({
            x: x + off * Math.cos(rad),
            y: y + off * Math.sin(rad),
            rot: tangent + side * 32 * dir,
            rx: 10 * s,
            ry: 4 * s,
          });
        });
      }
    };
    branch(102, 248, 1);
    branch(78, -68, -1);
    return out;
  }, [size, r]);

  return (
    <svg className={`sp-laurel ${className}`} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {leaves.map((l, i) => (
        <ellipse key={i} cx={l.x} cy={l.y} rx={l.rx} ry={l.ry} transform={`rotate(${l.rot} ${l.x} ${l.y})`} />
      ))}
    </svg>
  );
}

// Animated number that counts up when its value changes
export function CountUp({ value, duration = 1200 }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof value !== "number") {
      setShown(value);
      return undefined;
    }
    const start = performance.now();
    const begin = from.current;
    let frame;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(begin + (value - begin) * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{shown}</>;
}

// Helmet emblem inside a laurel wreath with crossed spears and a slowly turning ring
export function Emblem({ className = "" }) {
  return (
    <div className={`sp-emblem ${className}`} aria-hidden="true">
      <svg className="sp-emblem-ring" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="96" fill="none" strokeWidth="1.5" strokeDasharray="2 7" />
      </svg>
      <svg className="sp-emblem-spears" viewBox="0 0 200 200">
        <path d="M38,162 L162,38 M162,162 L38,38" strokeWidth="3.5" strokeLinecap="round" />
        <path className="tip" d="M162,38 l-3,15 l-12,-12 Z M38,38 l15,3 l-12,12 Z" />
      </svg>
      <Laurel className="sp-emblem-laurel" />
      <div className="sp-emblem-core">
        <img src="/SPARTA_Logo.png" alt="" />
      </div>
    </div>
  );
}

// Circular progress ring, value 0..1
export function Ring({ value, size = 44, stroke = 4, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="sp-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="track" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="bar"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))}
        />
      </svg>
      <span className="sp-ring-label">{children}</span>
    </span>
  );
}

// Rising ember particles; place inside a positioned, overflow-hidden parent
export function Embers({ count = 14, seed = 3 }) {
  const embers = useMemo(() => {
    let s = seed;
    const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    return Array.from({ length: count }, () => ({
      left: `${(rand() * 100).toFixed(1)}%`,
      size: 2 + Math.round(rand() * 2),
      delay: `${(rand() * 8).toFixed(2)}s`,
      duration: `${(6 + rand() * 6).toFixed(2)}s`,
      drift: `${((rand() - 0.5) * 60).toFixed(0)}px`,
    }));
  }, [count, seed]);
  return (
    <span className="sp-embers" aria-hidden="true">
      {embers.map((e, i) => (
        <i
          key={i}
          style={{ left: e.left, width: e.size, height: e.size, animationDelay: e.delay, animationDuration: e.duration, "--drift": e.drift }}
        />
      ))}
    </span>
  );
}
