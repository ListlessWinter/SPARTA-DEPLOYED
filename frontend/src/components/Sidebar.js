import { Link, useLocation } from "react-router-dom";
import { Meander } from "./SpartanDecor";
import "../styles/AppShell.css";

// Shared navigation for the admin and player layouts.
// items: [{ to, label, icon: Component, match: (pathname) => boolean }]
export default function Sidebar({ items }) {
  const { pathname } = useLocation();

  return (
    <nav className="sh-sidebar" aria-label="Main">
      <Link to={items[0].to} className="sh-logo">
        <img src="/SPARTA_Logo.png" alt="" />
        <span>SPARTA</span>
      </Link>
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

      <div className="sh-sidebar-foot">
        <span className="sh-demo-dot" />
        Demo mode
      </div>
    </nav>
  );
}
