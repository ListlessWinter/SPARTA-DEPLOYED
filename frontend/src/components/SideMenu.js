import { LayoutDashboard, Flame, UserCheck, Landmark } from "lucide-react";
import Sidebar from "./Sidebar";

const ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/event", label: "Events", icon: Flame, match: (p) => p.startsWith("/admin/event") },
  { to: "/admin/approval", label: "Approvals", icon: UserCheck },
  { to: "/admin/pantheon", label: "Pantheon", icon: Landmark, match: (p) => p.startsWith("/admin/pantheon") },
];

const SideMenu = () => <Sidebar items={ITEMS} />;

export default SideMenu;
