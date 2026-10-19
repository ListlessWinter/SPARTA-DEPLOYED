import React, { useEffect, useState } from 'react';
import { Construction, Info, X } from 'lucide-react';
import '../styles/DemoToasts.css';

const ICONS = { construction: Construction, info: Info };
const EXIT_MS = 450;

/**
 * Stack of toasts shown at the top of the screen on mount (page load / refresh).
 * Toasts slide up and fade out when dismissed or when the timer ends.
 * toasts: [{ icon: 'construction' | 'info', text: string }]
 */
export default function DemoToasts({ toasts, duration = 7000 }) {
  const [visible, setVisible] = useState(toasts.map((_, i) => i));
  const [leaving, setLeaving] = useState([]);

  const dismiss = (i) => {
    setLeaving((l) => (l.includes(i) ? l : [...l, i]));
    setTimeout(() => setVisible((v) => v.filter((x) => x !== i)), EXIT_MS);
  };

  useEffect(() => {
    // staggered exit, one after another
    const timers = toasts.map((_, i) => setTimeout(() => dismiss(i), duration + i * 250));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  return (
    <div className="dt-stack" role="status" aria-live="polite">
      {toasts.map((t, i) => {
        if (!visible.includes(i)) return null;
        const Icon = ICONS[t.icon] || Info;
        const isLeaving = leaving.includes(i);
        return (
          <div
            className={`dt-toast ${isLeaving ? 'leaving' : ''}`}
            key={i}
            style={isLeaving ? undefined : { animationDelay: `${i * 0.25}s` }}
          >
            <Icon size={18} />
            <span>{t.text}</span>
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(i)}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
