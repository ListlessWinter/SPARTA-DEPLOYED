import { Link, useLocation } from "react-router-dom";
import { Meander } from "./SpartanDecor";
import "../styles/AppShell.css";
const spartaLogo = "/assets/SPARTA_Logo.svg";

// Shared navigation for the admin and player layouts.
// items: [{ to, label, icon: Component, match: (pathname) => boolean }]
export default function Sidebar({ items }) {
  const { pathname } = useLocation();

  return (
    <nav className="sh-sidebar" aria-label="Main">
      {/* Ionic capital */}
      <svg className="sh-capital" viewBox="0 0 240 96" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="shCapitalMarble" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#94949d" />
            <stop offset="0.24" stopColor="#e7e5e0" />
            <stop offset="0.55" stopColor="#b4b4b9" />
            <stop offset="0.78" stopColor="#eeece9" />
            <stop offset="1" stopColor="#82828c" />
          </linearGradient>
          <linearGradient id="shCapitalLeaf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e6e4df" />
            <stop offset="1" stopColor="#91919a" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="240" height="11" rx="2" className="stone" fill="url(#shCapitalMarble)" />
        <rect x="8" y="11" width="224" height="8" rx="3" className="stone" fill="url(#shCapitalMarble)" />
        <path d="M16,19 H224 L217,29 H23 Z" className="stone" fill="url(#shCapitalMarble)" />
        <path d="M22,29 H218 C210,45 195,51 177,51 H63 C45,51 30,45 22,29 Z" className="stone" fill="url(#shCapitalMarble)" />
        <path d="M43,50 C57,64 73,68 91,66 H149 C167,68 183,64 197,50 L188,78 H52 Z" className="stone" fill="url(#shCapitalMarble)" />
        <circle cx="30" cy="45" r="20" className="stone" fill="url(#shCapitalMarble)" />
        <circle cx="210" cy="45" r="20" className="stone" fill="url(#shCapitalMarble)" />
        <path className="trim" d="M30,45 m0,-3 a3,3 0 1,1 -3,3 a7,7 0 1,1 7,7 a11,11 0 1,1 -11,-11 a15,15 0 1,1 15,15" />
        <path className="trim" d="M210,45 m0,-3 a3,3 0 1,0 3,3 a7,7 0 1,0 -7,7 a11,11 0 1,0 11,-11 a15,15 0 1,0 -15,15" />
        {[66, 84, 102, 120, 138, 156, 174].map((x, i) => (
          <path key={x} className="acanthus" fill="url(#shCapitalLeaf)" d={`M${x},73 C${x - 8},63 ${x - 6},51 ${x},43 C${x + 6},51 ${x + 8},63 ${x},73 Z`} transform={i % 2 ? `translate(0 3)` : undefined} />
        ))}
        <rect x="48" y="77" width="144" height="19" rx="2" className="stone" fill="url(#shCapitalMarble)" />
        <path d="M48,78 H192 M55,88 H185 M64,79 V96 M82,79 V96 M100,79 V96 M118,79 V96 M136,79 V96 M154,79 V96 M172,79 V96" className="trim" />
      </svg>
      <Link to={items[0].to} className="sh-logo">
        <img src={spartaLogo} alt="" />
        <span>SPARTA</span>
      </Link>

      <div className="sh-scroll">
        <div className="sh-scroll-paper">
          <Meander className="sh-meander" height={14} />
          <ul className="sh-nav">
            {items.map(({ to, label, icon: Icon, match }) => {
              const active = match ? match(pathname) : pathname === to;
              return (
                <li key={label}>
                  <Link to={to} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
                    <Icon size={19} strokeWidth={2} />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Attic base: torus, scotia, torus, plinth */}
      <svg className="sh-base" viewBox="0 0 240 52" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="shBaseMarble" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#878790" />
            <stop offset="0.34" stopColor="#e1ded8" />
            <stop offset="0.7" stopColor="#aeaeb5" />
            <stop offset="1" stopColor="#eae7e3" />
          </linearGradient>
        </defs>
        <rect x="14" y="0" width="212" height="10" rx="5" className="stone" fill="url(#shBaseMarble)" />
        <rect x="22" y="10" width="196" height="6" className="shadow" />
        <rect x="6" y="16" width="228" height="13" rx="6.5" className="stone" fill="url(#shBaseMarble)" />
        <rect x="0" y="29" width="240" height="23" className="stone" fill="url(#shBaseMarble)" />
        <path d="M0,29 H240 M6,16 H234 M14,0 H226" className="trim" />
      </svg>
    </nav>
  );
}
