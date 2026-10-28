import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import "../styles/SpartanDecor.css";
const spartaLogo = "/assets/SPARTA_Logo.svg";

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

// Climbing vine with spiral tendrils and leaves, drawn across a bar (viewBox 1600 x 72)
export function Vines({ className = "" }) {
  const { stem, branches, tendrils, leaves, berries } = useMemo(() => {
    const W = 1600, mid = 36;
    const yAt = (x) => mid + 7 * Math.sin(x / 73) + 4.5 * Math.sin(x / 31 + 0.8);
    const slope = (x) => (7 / 73) * Math.cos(x / 73) + (4.5 / 31) * Math.cos(x / 31 + 0.8);

    let stem = `M0,${yAt(0).toFixed(1)}`;
    for (let x = 6; x <= W; x += 6) stem += ` L${x},${yAt(x).toFixed(1)}`;

    // Uneven offshoots keep the vine from reading as a repeated border pattern.
    const branchPoints = [88, 246, 438, 628, 815, 1036, 1244, 1432];
    const branches = branchPoints.map((x, i) => {
      const side = i % 2 ? 1 : -1;
      const y = yAt(x);
      const reach = 25 + (i % 3) * 5;
      return {
        d: `M${x},${y.toFixed(1)} C${x + 8},${(y + side * 4).toFixed(1)} ${x + 18},${(y + side * reach * 0.72).toFixed(1)} ${x + 31},${(y + side * reach).toFixed(1)}`,
        x: x + 31,
        y: y + side * reach,
        side,
      };
    });

    // Sparse tendrils, rather than one on every wave, feel more botanical.
    const tendrils = [];
    [172, 356, 570, 748, 958, 1172, 1378, 1532].forEach((x, k) => {
      const top = k % 2 === 0;
      const py = yAt(x);
      const r0 = 9 + (k % 3);
      const cx = x + (top ? -4 : 4);
      const cy = py + (top ? -r0 : r0);
      const a0 = Math.atan2(py - cy, x - cx);
      const dir = top ? 1 : -1;
      let d = `M${x},${py.toFixed(1)}`;
      for (let t = 0; t <= 2.7 * Math.PI; t += 0.25) {
        const r = r0 * (1 - (t / (2.7 * Math.PI)) * 0.84);
        const a = a0 + dir * t;
        d += ` L${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
      }
      tendrils.push(d);
    });

    const leaves = [];
    const berries = [];
    const gaps = [31, 38, 27, 43, 34, 29, 40];
    for (let i = 0, x = 18; x < W; x += gaps[i % gaps.length], i++) {
      const ang = (Math.atan(slope(x)) * 180) / Math.PI;
      const side = [1, -1, 1, -1, -1, 1][i % 6];
      leaves.push({ x, y: yAt(x), rot: ang + side * (48 + (i % 3) * 7), s: 0.68 + ((i * 17) % 9) / 22, delay: (x / W) * 1.8 });
      if (i % 7 === 3) berries.push({ x: x + 5, y: yAt(x) + side * 7 });
    }

    branches.forEach((b, i) => {
      leaves.push({ x: b.x, y: b.y, rot: b.side > 0 ? 68 : -68, s: 0.72 + (i % 2) * 0.12, delay: 0.4 + i * 0.12 });
    });

    return { stem, branches, tendrils, leaves, berries };
  }, []);

  return (
    <svg className={`sp-vines ${className}`} viewBox="0 0 1600 72" preserveAspectRatio="xMinYMid slice" aria-hidden="true">
      <path d={stem} className="stem" pathLength="1" />
      {branches.map((b, i) => <path key={`b-${i}`} d={b.d} className="branch" pathLength="1" />)}
      {tendrils.map((d, i) => <path key={`t-${i}`} d={d} className="tendril" pathLength="1" />)}
      {leaves.map((l, i) => (
        <g key={`l-${i}`} transform={`translate(${l.x} ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(0)}) scale(${l.s.toFixed(2)})`}>
          <path className="leaf" d="M0,0 C5,-8 16,-9 23,-1 C18,7 7,9 0,0 Z" style={{ animationDelay: `${l.delay.toFixed(2)}s` }} />
          <path className="vein" d="M3,0 C9,-1 15,-1 20,-1" />
        </g>
      ))}
      {berries.map((b, i) => <circle key={`r-${i}`} cx={b.x} cy={b.y.toFixed(1)} r="2.4" className="berry" />)}
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
        <img src={spartaLogo} alt="" />
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
